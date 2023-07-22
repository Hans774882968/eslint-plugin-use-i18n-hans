import { ASTUtils, TSESLint, TSESTree } from '@typescript-eslint/utils';
import { getStaticLiteralValue, isStaticLiteral } from '../utils/astTools';
import createRule from '../utils/createRule';

const {
  isIdentifier
} = ASTUtils;

const {
  AST_NODE_TYPES
} = TSESTree;

export type Options = [{
  i18nFunctionName?: string,
  paths?: string[],
}];

type ParsedConfigOption = {
  i18nFunctionName: string,
  paths: string[],
};

export type MessageIDS = 'autofixRawTextSuggest' | 'useI18n';

type ContextType = Readonly<TSESLint.RuleContext<MessageIDS, Options>>;

const checkValueIsStaticLiteral = (context: ContextType, node: TSESTree.Node, options: ParsedConfigOption) => {
  if (!isStaticLiteral(node)) return;
  const value = getStaticLiteralValue(node);
  const replaceResult = `${options.i18nFunctionName}('${value}')`;
  context.report({
    data: { i18nFunctionName: options.i18nFunctionName },
    fix (fixer) {
      return fixer.replaceText(node, replaceResult);
    },
    messageId: 'useI18n',
    node,
    suggest: [
      {
        data: { replaceResult },
        fix (fixer) {
          return fixer.replaceText(node, replaceResult);
        },
        messageId: 'autofixRawTextSuggest'
      }
    ]
  });
};

export default createRule({
  create (
    context: ContextType
  ) {
    const options = context.options[0] || {};

    // 经过此方法过滤后，后续都不需要考虑输入的合法性
    const getLegalPaths = (paths: string[] | undefined) => {
      if (!Array.isArray(paths)) return [];
      const res = paths.filter((path) => {
        const keyList = path.split('.');
        // 把最后一个元素期望为数组的 path 丢弃
        if (keyList[keyList.length - 1].endsWith('[]')) return false;
        return true;
      });
      return [...new Set(res)];
    };
    const parsedOption: ParsedConfigOption = {
      i18nFunctionName: options.i18nFunctionName || '$gt',
      paths: getLegalPaths(options.paths)
    };

    return {
      ObjectExpression (node) {
        parsedOption.paths.forEach((path) => {
          const keyList = path.split('.');

          const recursiveCheckRawText = (keyList: string[], node: TSESTree.ObjectExpression) => {
            const copyOfKeyList = [...keyList];
            const rawKeyData = copyOfKeyList.shift();
            if (!rawKeyData) return;
            let currentKeyInfo: { currentKey: string, expectArray: boolean } = {
              currentKey: '', expectArray: false
            };
            if (rawKeyData.endsWith('[]')) {
              currentKeyInfo = { currentKey: rawKeyData.substring(0, rawKeyData.length - 2), expectArray: true };
            } else {
              currentKeyInfo = { currentKey: rawKeyData, expectArray: false };
            }
            node.properties.forEach((prop) => {
              if (prop.type !== AST_NODE_TYPES.Property) return;
              if (!isIdentifier(prop.key) || prop.key.name !== currentKeyInfo.currentKey) return;
              if (!copyOfKeyList.length) {
                // copyOfKeyList 已消耗完时，因为入口有做过滤，认定 currentKeyInfo.expectArray 必定为 false
                checkValueIsStaticLiteral(context, prop.value, parsedOption);
              } else if (currentKeyInfo.expectArray) {
                if (prop.value.type !== AST_NODE_TYPES.ArrayExpression) return;
                prop.value.elements.forEach((arrayItem) => {
                  if (arrayItem?.type !== AST_NODE_TYPES.ObjectExpression) return;
                  recursiveCheckRawText(copyOfKeyList, arrayItem);
                });
              } else {
                if (prop.value.type !== AST_NODE_TYPES.ObjectExpression) return;
                recursiveCheckRawText(copyOfKeyList, prop.value);
              }
            });
          };
          recursiveCheckRawText(keyList, node);
        });
      }
    };
  },
  defaultOptions: [{
    i18nFunctionName: '$gt',
    paths: Array<string>()
  }],
  meta: {
    docs: {
      description: 'Remind developers to wrap strings with i18n() when using specific schema',
      recommended: 'error',
      requiresTypeChecking: true
    },
    fixable: 'code',
    hasSuggestions: true,
    messages: {
      autofixRawTextSuggest: 'Change to {{replaceResult}}.',
      useI18n: 'Please use {{i18nFunctionName}}() for error message translation.'
    },
    schema: [
      {
        properties: {
          i18nFunctionName: {
            type: 'string'
          },
          paths: {
            type: 'array'
          }
        }
      }
    ],
    type: 'problem'
  },
  name: 'config-schema-no-raw-text'
});
