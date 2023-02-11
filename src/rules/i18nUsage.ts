import { TSESLint, ASTUtils, TSESTree } from '@typescript-eslint/utils';
import createRule from '../utils/createRule';
import escodegen from 'escodegen';

const {
  isIdentifier
} = ASTUtils;

const {
  AST_NODE_TYPES
} = TSESTree;

type Options = [{
  i18nFunctionNames: string[];
}];

function getFunctionName (node: TSESTree.CallExpression) {
  if (node.callee.type === AST_NODE_TYPES.MemberExpression) {
    if (isIdentifier(node.callee.property)) return node.callee.property.name;
  }
  if (isIdentifier(node.callee)) {
    return node.callee.name;
  }
  return '';
}

export type MessageIDS = 'parameter' | 'firstArgShouldBeString' | 'autofixFirstArgSuggest';

const rule = createRule({
  name: 'i18n-usage',
  meta: {
    docs: {
      description: 'Detect illegal usage of i18n()',
      recommended: 'error',
      requiresTypeChecking: false
    },
    messages: {
      parameter: 'This i18n method {{i18nFunctionName}}() requires parameters.',
      firstArgShouldBeString: 'The first argument of {{i18nFunctionName}}() must be a string.' +
        ' If you need to use variable, you can use: {{i18nFunctionName}}("hello {name}", null, {name: "world"}).',
      autofixFirstArgSuggest: 'Change to {{i18nFunctionName}}({{replaceResult}}).'
    },
    type: 'problem',
    hasSuggestions: true, // 不加这个属性会报错 TypeError: Converting circular structure to JSON
    fixable: 'code', // 不加这个属性会报错 TypeError: Converting circular structure to JSON
    schema: [
      {
        properties: {
          i18nFunctionNames: {
            type: 'array'
          }
        }
      }
    ]
  },
  defaultOptions: [{ i18nFunctionNames: new Array<string>() }],
  create (
    context: Readonly<TSESLint.RuleContext<MessageIDS, Options>>
  ) {
    const options = context.options[0] || {};
    let { i18nFunctionNames } = options;
    i18nFunctionNames = Array.isArray(i18nFunctionNames) && i18nFunctionNames.length ? i18nFunctionNames : ['$gt'];
    return {
      CallExpression (node) {
        const i18nFunctionName = getFunctionName(node);
        if (!i18nFunctionName || !i18nFunctionNames.includes(i18nFunctionName)) return;
        const args = node.arguments;
        if (!args.length) {
          context.report({
            node,
            messageId: 'parameter',
            data: { i18nFunctionName }
          });
          return;
        }
        if (args[0].type === AST_NODE_TYPES.Literal && typeof args[0].value === 'string') {
          return;
        }
        if (args.length >= 2) {
          context.report({
            node,
            messageId: 'firstArgShouldBeString',
            data: { i18nFunctionName }
          });
          return;
        }
        const firstArgShouldUseIdentifierName = () => {
          if (!isIdentifier(args[0])) {
            return {
              flag: false, varName: 'value'
            };
          }
          const varName = args[0].name;
          if (varName !== 'undefined' && varName !== 'NaN') {
            return {
              flag: true, varName
            };
          }
          return { flag: false, varName: 'value' };
        };
        const { flag: shouldUseIdentifierName, varName } = firstArgShouldUseIdentifierName();

        const getReplaceResult = () => {
          if (shouldUseIdentifierName) {
            return `'{${varName}}', null, { ${varName} }`;
          }
          const args0Code = escodegen.generate(args[0]);
          const replaceResult = `'{value}', null, { value: ${args0Code} }`;
          return replaceResult;
        };
        const replaceResult = getReplaceResult();

        context.report({
          node,
          messageId: 'firstArgShouldBeString',
          data: { i18nFunctionName },
          fix (fixer) {
            return fixer.replaceText(args[0], replaceResult);
          },
          suggest: [
            {
              messageId: 'autofixFirstArgSuggest',
              data: { i18nFunctionName, replaceResult },
              fix (fixer) {
                return fixer.replaceText(args[0], replaceResult);
              }
            }
          ]
        });
      }
    };
  }
});

export default rule;
