import { AST } from 'vue-eslint-parser';
import { TSESLint } from '@typescript-eslint/utils';
import { VExpressionContainerExpressionType } from '../types/vue-eslint-parser';
import {
  getStaticLiteralValue,
  isStaticLiteral,
  staticLiteralTypes
} from '../utils/vueAstTools';
import { isKebabCase, pascalCase } from '../utils/humpsUtils';
import { isNonEmptyArray, toRegExp } from '../utils/utils';
import eslintPluginVue from 'eslint-plugin-vue/lib/utils';

type TagNameToAttrsMap = Record<string, string[]>;

type ConfigOption = {
  attributes?: TagNameToAttrsMap,
  i18nFunctionNames?: string[],
  ignorePattern?: string,
  ignoreText?: string[]
};

type ParsedConfigOption = {
  attributes: {
    name: RegExp,
    attrs: Set<string>
  }[],
  i18nFunctionNames: string[],
  ignorePattern: RegExp,
  ignoreText: string[]
};

type Options = [ConfigOption];

export type MessageIDS = 'rawTextUsed' | 'autofixRawTextSuggest';

type ContextType = Readonly<TSESLint.RuleContext<MessageIDS, Options>>;

function parseTargetAttrs (options: TagNameToAttrsMap) {
  const regexps = [];
  for (const tagName of Object.keys(options)) {
    const attrs = new Set(options[tagName]);
    regexps.push({
      attrs,
      name: toRegExp(tagName)
    });
  }
  return regexps;
}

const hasOnlyWhitespace = (value: string) => /^[\r\n\s\t\f\v]+$/.test(value);

function shouldNotReportError (
  value: string | number | bigint | boolean | RegExp | null,
  options: ParsedConfigOption
) {
  if (typeof value !== 'string') {
    return !value;
  }
  return (
    !value ||
      hasOnlyWhitespace(value) ||
      options.ignorePattern.test(value.trim()) ||
      options.ignoreText.includes(value.trim()) ||
      options.i18nFunctionNames.some((name) => value.trim().startsWith(name))
  );
}

function checkText (context: ContextType, textNode: AST.VText, options: ParsedConfigOption) {
  const value = textNode.value;
  if (shouldNotReportError(value, options)) {
    return;
  }
  const i18nFunctionName = options.i18nFunctionNames[0];
  const replaceResult = `{{ ${i18nFunctionName}('${value.replace(/\r\n\s\t/, '').trim()}') }}`;
  context.report({
    data: { textValue: value },
    fix (fixer) {
      return fixer.replaceText(textNode as any, replaceResult);
    },
    messageId: 'rawTextUsed',
    node: textNode as any,
    suggest: [
      {
        data: { replaceResult },
        fix (fixer) {
          return fixer.replaceText(textNode as any, replaceResult);
        },
        messageId: 'autofixRawTextSuggest'
      }
    ]
  });
}

function checkLiteral (context: ContextType, literal: staticLiteralTypes, options: ParsedConfigOption) {
  const value = getStaticLiteralValue(literal);
  if (shouldNotReportError(value, options)) {
    return;
  }
  const i18nFunctionName = options.i18nFunctionNames[0];
  const replaceResult = `${i18nFunctionName}('${value}')`;
  context.report({
    data: { textValue: value },
    fix (fixer) {
      return fixer.replaceText(literal as any, replaceResult);
    },
    messageId: 'rawTextUsed',
    node: literal as any,
    suggest: [
      {
        data: { replaceResult },
        fix (fixer) {
          return fixer.replaceText(literal as any, replaceResult);
        },
        messageId: 'autofixRawTextSuggest'
      }
    ]
  });
}

function getTargetAttrs (tagName: string, options: ParsedConfigOption) {
  const result: string[] = [];
  for (const { name, attrs } of options.attributes) {
    name.lastIndex = 0;
    if (name.test(tagName)) {
      result.push(...attrs);
    }
  }
  if (isKebabCase(tagName)) {
    result.push(...getTargetAttrs(pascalCase(tagName), options));
  }

  return new Set(result);
}

function checkVAttribute (context: ContextType, node: AST.VAttribute, options: ParsedConfigOption) {
  if (!node.value) return;
  const literal = node.value;
  const value = literal.value;
  if (shouldNotReportError(value, options)) {
    return;
  }
  const i18nFunctionName = options.i18nFunctionNames[0];
  const replaceResult = `"${i18nFunctionName}('${value}')"`;
  function *fixFunction (fixer: TSESLint.RuleFixer) {
    yield fixer.insertTextBefore(node as any, ':');
    yield fixer.replaceText(literal as any, replaceResult);
  }
  context.report({
    data: { textValue: value },
    *fix (fixer) {
      for (const v of fixFunction(fixer)) yield v;
    },
    messageId: 'rawTextUsed',
    node: node as any,
    suggest: [
      {
        data: { replaceResult },
        *fix (fixer) {
          for (const v of fixFunction(fixer)) yield v;
        },
        messageId: 'autofixRawTextSuggest'
      }
    ]
  });
}

function checkVAttributeDirective (context: ContextType, node: AST.VDirective, options: ParsedConfigOption) {
  if (node.key.name.name !== 'text' || !node.value?.expression) return;
  // 只处理 v-text，不处理 v-bind 等
  checkExpressionContainerText(context, node.value.expression, options);
}

function checkExpressionContainerText (context: ContextType, expression: VExpressionContainerExpressionType, options: ParsedConfigOption) {
  if (isStaticLiteral(expression)) {
    checkLiteral(context, expression, options);
  } else if (expression?.type === 'ConditionalExpression') {
    const targets = [expression.consequent, expression.alternate];
    targets.forEach((target) => {
      if (isStaticLiteral(target)) {
        checkLiteral(context, target, options);
      }
    });
  }
}

// 参考 @intlify/vue-i18n https://github.com/intlify/eslint-plugin-vue-i18n/blob/master/lib/rules/no-raw-text.ts
export default {
  create (
    context: ContextType
  ) {
    const options = context.options[0] || {};
    const parsedOptions: ParsedConfigOption = {
      attributes: parseTargetAttrs(options.attributes || {}),
      i18nFunctionNames: isNonEmptyArray(options.i18nFunctionNames) ? options.i18nFunctionNames : ['$gt'],
      ignorePattern: new RegExp(options.ignorePattern || /^$/),
      ignoreText: options.ignoreText || []
    };

    const templateVisitor = {
      VAttribute (node: AST.VAttribute | AST.VDirective) {
        if (node.directive) {
          if (!node.value) return;
          checkVAttributeDirective(context, node, parsedOptions);
          return;
        }
        const tagName = node.parent.parent.rawName;
        const attrName = node.key.name;
        if (!getTargetAttrs(tagName, parsedOptions).has(attrName)) {
          return;
        }
        checkVAttribute(context, node, parsedOptions);
      },
      VExpressionContainer (node: AST.VExpressionContainer) {
        if (!node.expression || !node.parent || node.parent.type !== 'VElement') return;
        // 处理 <custom-component>{{ exp }}</custom-component>
        checkExpressionContainerText(context, node.expression, parsedOptions);
      },
      VText (node: AST.VText) {
        checkText(context, node, parsedOptions);
      }
    };
    return eslintPluginVue.defineTemplateBodyVisitor(context, templateVisitor);
  },
  defaultOptions: [{
    attributes: Array<object>(),
    i18nFunctionNames: Array<string>(),
    ignorePattern: '',
    ignoreText: Array<string>()
  }],
  meta: {
    docs: {
      description: 'disallow raw string literal',
      recommended: 'error',
      requiresTypeChecking: false,
      url: 'https://github.com/Hans774882968/eslint-plugin-use-i18n-hans/blob/main/README.md'
    },
    // 不加这个属性会报错 TypeError: Converting circular structure to JSON
    fixable: 'code',

    hasSuggestions: true,

    messages: {
      autofixRawTextSuggest: 'Change to {{replaceResult}}.',
      rawTextUsed: 'Raw text \'{{textValue}}\' is used.'
    },
    // 不加这个属性会报错 TypeError: Converting circular structure to JSON
    schema: [
      {
        properties: {
          attributes: {
            additionalProperties: false,
            patternProperties: {
              '^(?:\\S+|/.*/[a-z]*)$': {
                items: { type: 'string' },
                type: 'array',
                uniqueItems: true
              }
            },
            type: 'object'
          },
          i18nFunctionNames: {
            type: 'array'
          },
          ignorePattern: {
            type: 'string'
          },
          ignoreText: {
            type: 'array'
          }
        }
      }
    ],
    type: 'problem'
  },
  name: 'i18n-no-raw-text'
};
