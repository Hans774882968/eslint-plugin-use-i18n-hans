import { TSESLint, ASTUtils, TSESTree } from '@typescript-eslint/utils';
import createRule from '../utils/createRule';

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
        ' If you need to use variable, you can use: {{i18nFunctionName}}("hello {name}", null, {name: "world"}).'
    },
    type: 'problem',
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
    context: Readonly<TSESLint.RuleContext<'parameter' | 'firstArgShouldBeString', Options>>
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
        if (args[0].type !== AST_NODE_TYPES.Literal || typeof args[0].value !== 'string') {
          context.report({
            node,
            messageId: 'firstArgShouldBeString',
            data: { i18nFunctionName }
          });
        }
      }
    };
  }
});

export default rule;
