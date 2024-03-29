import { ASTUtils, TSESLint, TSESTree } from '@typescript-eslint/utils';
import { isNonEmptyArray } from '../utils/utils';
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
  create (
    context: Readonly<TSESLint.RuleContext<MessageIDS, Options>>
  ) {
    const options = context.options[0] || {};
    let { i18nFunctionNames } = options;
    i18nFunctionNames = isNonEmptyArray(i18nFunctionNames) ? i18nFunctionNames : ['$gt'];

    return {
      CallExpression (node) {
        const i18nFunctionName = getFunctionName(node);
        if (!i18nFunctionName || !i18nFunctionNames.includes(i18nFunctionName)) return;
        const args = node.arguments;
        if (!args.length) {
          context.report({
            data: { i18nFunctionName },
            messageId: 'parameter',
            node
          });
          return;
        }
        if (args[0].type === AST_NODE_TYPES.Literal && typeof args[0].value === 'string') {
          return;
        }
        if (args.length >= 2) {
          context.report({
            data: { i18nFunctionName },
            messageId: 'firstArgShouldBeString',
            node
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
          data: { i18nFunctionName },
          fix (fixer) {
            return fixer.replaceText(args[0], replaceResult);
          },
          messageId: 'firstArgShouldBeString',
          node,
          suggest: [
            {
              data: { i18nFunctionName, replaceResult },
              fix (fixer) {
                return fixer.replaceText(args[0], replaceResult);
              },
              messageId: 'autofixFirstArgSuggest'
            }
          ]
        });
      }
    };
  },
  defaultOptions: [{ i18nFunctionNames: new Array<string>() }],
  meta: {
    docs: {
      description: 'Detect illegal usage of i18n()',
      recommended: 'error',
      requiresTypeChecking: false
    },
    // 不加这个属性会报错 TypeError: Converting circular structure to JSON
    fixable: 'code',
    hasSuggestions: true,
    messages: {
      autofixFirstArgSuggest: 'Change to {{i18nFunctionName}}({{replaceResult}}).',
      firstArgShouldBeString: 'The first argument of {{i18nFunctionName}}() must be a string.' +
        ' If you need to use variable, you can use: {{i18nFunctionName}}("hello {name}", null, {name: "world"}).',
      parameter: 'This i18n method {{i18nFunctionName}}() requires parameters.'
    },
    // 不加这个属性会报错 TypeError: Converting circular structure to JSON
    schema: [
      {
        properties: {
          i18nFunctionNames: {
            type: 'array'
          }
        }
      }
    ],
    type: 'problem'
  },
  name: 'i18n-usage'
});

export default rule;
