import eslintPluginVue from 'eslint-plugin-vue/lib/utils';
import { TSESLint } from '@typescript-eslint/utils';
import { AST } from 'vue-eslint-parser';
import { isKebabCase, pascalCase } from '../utils/humpsUtils';
import { toRegExp } from '../utils/utils';
import { VExpressionContainerExpressionType } from '../types/vue-eslint-parser';
import {
  getStaticLiteralValue,
  isStaticLiteral,
  staticLiteralTypes
} from '../utils/vueAstTools';

type TagNameToAttrsMap = Record<string, string[]>;

type ConfigOption = {
  attributes?: TagNameToAttrsMap,
  ignorePattern?: string,
  ignoreText?: string[]
};

type ParsedConfigOption = {
  attributes: {
    name: RegExp,
    attrs: Set<string>
  }[],
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
      name: toRegExp(tagName),
      attrs
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
      /^\$gt|\$t/.test(value.trim())
  );
}

function checkText (context: ContextType, textNode: AST.VText, options: ParsedConfigOption) {
  const value = textNode.value;
  if (shouldNotReportError(value, options)) {
    return;
  }
  const replaceResult = `{{ $gt('${value.replace(/\r\n\s\t/, '').trim()}') }}`;
  context.report({
    node: textNode as any,
    messageId: 'rawTextUsed',
    data: { textValue: value },
    fix (fixer) {
      return fixer.replaceText(textNode as any, replaceResult);
    },
    suggest: [
      {
        messageId: 'autofixRawTextSuggest',
        data: { replaceResult },
        fix (fixer) {
          return fixer.replaceText(textNode as any, replaceResult);
        }
      }
    ]
  });
}

function checkLiteral (context: ContextType, literal: staticLiteralTypes, options: ParsedConfigOption) {
  const value = getStaticLiteralValue(literal);
  if (shouldNotReportError(value, options)) {
    return;
  }
  const replaceResult = `$gt('${value}')`;
  context.report({
    node: literal as any,
    messageId: 'rawTextUsed',
    data: { textValue: value },
    fix (fixer) {
      return fixer.replaceText(literal as any, replaceResult);
    },
    suggest: [
      {
        messageId: 'autofixRawTextSuggest',
        data: { replaceResult },
        fix (fixer) {
          return fixer.replaceText(literal as any, replaceResult);
        }
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
  const replaceResult = `"$gt('${value}')"`;
  function *fixFunction (fixer: TSESLint.RuleFixer) {
    yield fixer.insertTextBefore(node as any, ':');
    yield fixer.replaceText(literal as any, replaceResult);
  }
  context.report({
    node: node as any,
    messageId: 'rawTextUsed',
    data: { textValue: value },
    *fix (fixer) {
      for (const v of fixFunction(fixer)) yield v;
    },
    suggest: [
      {
        messageId: 'autofixRawTextSuggest',
        data: { replaceResult },
        *fix (fixer) {
          for (const v of fixFunction(fixer)) yield v;
        }
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

export default {
  name: 'i18n-no-raw-text',
  meta: {
    docs: {
      description: 'disallow raw string literal',
      recommended: 'error',
      requiresTypeChecking: false,
      url: 'https://github.com/Hans774882968/eslint-plugin-use-i18n-hans/blob/main/README.md'
    },
    messages: {
      rawTextUsed: 'Raw text \'{{textValue}}\' is used.',
      autofixRawTextSuggest: 'Change to {{replaceResult}}.'
    },
    type: 'problem',
    hasSuggestions: true, // 不加这个属性会报错 TypeError: Converting circular structure to JSON
    fixable: 'code', // 不加这个属性会报错 TypeError: Converting circular structure to JSON
    schema: [
      {
        properties: {
          attributes: {
            type: 'object',
            patternProperties: {
              '^(?:\\S+|/.*/[a-z]*)$': {
                type: 'array',
                items: { type: 'string' },
                uniqueItems: true
              }
            },
            additionalProperties: false
          },
          ignorePattern: {
            type: 'string'
          },
          ignoreText: {
            type: 'array'
          }
        }
      }
    ]
  },
  defaultOptions: [{
    ignorePattern: '',
    ignoreText: Array<string>()
  }],
  create (
    context: ContextType
  ) {
    const options = context.options[0] || {};
    const parsedOptions = {
      attributes: parseTargetAttrs(options.attributes || {}),
      ignorePattern: new RegExp(options.ignorePattern || /^$/),
      ignoreText: options.ignoreText || []
    };

    const templateVisitor = {
      VExpressionContainer (node: AST.VExpressionContainer) {
        if (!node.expression || !node.parent || node.parent.type !== 'VElement') return;
        // 处理 <custom-component>{{ exp }}</custom-component>
        checkExpressionContainerText(context, node.expression, parsedOptions);
      },
      VText (node: AST.VText) {
        checkText(context, node, parsedOptions);
      },
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
      }
    };
    return eslintPluginVue.defineTemplateBodyVisitor(context, templateVisitor);
  }
};
