import { ASTUtils, TSESLint, TSESTree } from '@typescript-eslint/utils';
import { getStaticLiteralValue, isStaticLiteral } from '../utils/astTools';
import { isNonEmptyArray } from '../utils/utils';
import createRule from '../utils/createRule';

const {
  isIdentifier
} = ASTUtils;

const {
  AST_NODE_TYPES
} = TSESTree;

export type Options = [{
  i18nFunctionName?: string,
  levels?: string[],
  messageObjectNames?: string[]
}];

type ParsedConfigOption = {
  i18nFunctionName: string,
  levels: string[],
  messageObjectNames: string[]
};

export type MessageIDS = 'autofixRawTextSuggest' | 'messageShouldNotBeEmpty' | 'useI18n';

type ContextType = Readonly<TSESLint.RuleContext<MessageIDS, Options>>;

const checkValue = (context: ContextType, node: TSESTree.CallExpression, options: ParsedConfigOption) => {
  if (node.arguments.length < 1) {
    context.report({
      messageId: 'messageShouldNotBeEmpty',
      node
    });
    return;
  }
  const arg = node.arguments[0];
  if (!isStaticLiteral(arg)) return;
  const value = getStaticLiteralValue(arg);
  const replaceResult = `${options.i18nFunctionName}('${value}')`;
  context.report({
    data: { i18nFunctionName: options.i18nFunctionName },
    fix (fixer) {
      return fixer.replaceText(arg, replaceResult);
    },
    messageId: 'useI18n',
    node,
    suggest: [
      {
        data: { replaceResult },
        fix (fixer) {
          return fixer.replaceText(arg, replaceResult);
        },
        messageId: 'autofixRawTextSuggest'
      }
    ]
  });
};

const checkObjectValue = (context: ContextType, node: TSESTree.Property, options: ParsedConfigOption) => {
  if (!isStaticLiteral(node.value)) return;
  const value = getStaticLiteralValue(node.value);
  const replaceResult = `${options.i18nFunctionName}('${value}')`;
  context.report({
    data: { i18nFunctionName: options.i18nFunctionName },
    fix (fixer) {
      return fixer.replaceText(node.value, replaceResult);
    },
    messageId: 'useI18n',
    node,
    suggest: [
      {
        data: { replaceResult },
        fix (fixer) {
          return fixer.replaceText(node.value, replaceResult);
        },
        messageId: 'autofixRawTextSuggest'
      }
    ]
  });
};

const processCallExpressionFirstArgument = (context: ContextType, node: TSESTree.Identifier, parsedOption: ParsedConfigOption) => {
  const processCallExpressionFirstArgumentIsObject = (firstArg: TSESTree.ObjectExpression) => {
    const property = firstArg.properties.find((item) => {
      if (item.type !== AST_NODE_TYPES.Property || !isIdentifier(item.key) || item.key.name !== 'type') return false;
      if (item.value.type !== AST_NODE_TYPES.Literal || typeof item.value.value !== 'string') return false;
      return parsedOption.levels.includes(item.value.value);
    });
    if (!property) return;
    const msg = firstArg.properties.find((item) => item.type === AST_NODE_TYPES.Property && isIdentifier(item.key) && item.key.name === 'message');
    if (msg?.type === AST_NODE_TYPES.Property) {
      checkObjectValue(context, msg, parsedOption);
    }
    else {
      context.report({
        messageId: 'messageShouldNotBeEmpty',
        node
      });
    }
  };
  if (node.parent?.parent && node.parent.parent.type === AST_NODE_TYPES.CallExpression) {
    const ancestor = node.parent.parent;
    if (ancestor.callee.type === AST_NODE_TYPES.MemberExpression && ancestor.callee.property === node) {
      // this.$message('str')
      checkValue(context, ancestor, parsedOption);
      // this.$message({})
      if (ancestor.arguments.length && ancestor.arguments[0].type === AST_NODE_TYPES.ObjectExpression) {
        processCallExpressionFirstArgumentIsObject(ancestor.arguments[0]);
      }
    }
  }
  if (node.parent?.type === AST_NODE_TYPES.CallExpression) {
    const ancestor = node.parent;
    if (isIdentifier(ancestor.callee) && ancestor.callee === node) {
      // messageService('str')
      checkValue(context, node.parent, parsedOption);
      // messageService({})
      if (node.parent.arguments.length && node.parent.arguments[0].type === AST_NODE_TYPES.ObjectExpression) {
        processCallExpressionFirstArgumentIsObject(node.parent.arguments[0]);
      }
    }
  }
};

export default createRule({
  create (
    context: ContextType
  ) {
    const options = context.options[0] || {};
    const parsedOption: ParsedConfigOption = {
      i18nFunctionName: options.i18nFunctionName || '$gt',
      levels: isNonEmptyArray(options.levels) ? options.levels : ['error'],
      messageObjectNames: (options.messageObjectNames || ['$message', 'messageService']).map((item) => {
        return item.toLowerCase();
      })
    };

    return {
      Identifier (node) {
        const { messageObjectNames: messageForm } = parsedOption;
        if (parsedOption.levels.includes(node.name)) {
          const isMessage = (parentNode: TSESTree.MemberExpression) => {
            // this.$message.error('str') or this.messageService.error('str')
            const parentObject = parentNode.object;
            if (parentObject.type !== AST_NODE_TYPES.MemberExpression) return false;
            if (parentObject.property.type !== AST_NODE_TYPES.Identifier && parentObject.property.type !== AST_NODE_TYPES.PrivateIdentifier) return false;
            if (!messageForm.includes(parentObject.property.name.toLowerCase())) return false;
            return true;
          };
          const isMessageService = (parentNode: TSESTree.MemberExpression) => {
            // $message.error('str') or messageService.error('str')
            const parentObject = parentNode.object;
            if (!isIdentifier(parentObject)) return false;
            return messageForm.includes(parentObject.name.toLowerCase());
          };
          if (node.parent && node.parent.type === AST_NODE_TYPES.MemberExpression &&
              (isMessage(node.parent) || isMessageService(node.parent)) &&
              node.parent.parent?.type === AST_NODE_TYPES.CallExpression) {
            checkValue(context, node.parent.parent, parsedOption);
          }
        }
        else if (messageForm.includes(node.name.toLowerCase())) {
          processCallExpressionFirstArgument(context, node, parsedOption);
        }
      }
    };
  },
  defaultOptions: [{
    i18nFunctionName: '$gt',
    messageObjectNames: Array<string>()
  }],
  meta: {
    docs: {
      description: 'Remind developers to wrap strings with i18n() when using $message',
      recommended: 'error',
      requiresTypeChecking: true
    },
    fixable: 'code',
    hasSuggestions: true,
    messages: {
      autofixRawTextSuggest: 'Change to {{replaceResult}}.',
      messageShouldNotBeEmpty: 'error message should not be empty.',
      useI18n: 'Please use {{i18nFunctionName}}() for error message translation.'
    },
    schema: [
      {
        properties: {
          i18nFunctionName: {
            type: 'string'
          },
          messageObjectNames: {
            type: 'array'
          }
        }
      }
    ],
    type: 'problem'
  },
  name: 'i18n-message-usage'
});
