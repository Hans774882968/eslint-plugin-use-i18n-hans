import eslintPluginVue from 'eslint-plugin-vue/lib/utils';
import { TSESLint } from '@typescript-eslint/utils';
import { AST } from 'vue-eslint-parser';
import { isKebabCase, pascalCase } from '../utils/humpsUtils';
import { toRegExp } from '../utils/utils';

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

export type MessageIDS = 'rawTextUsed';

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

function shouldNotReportError (value: string, options: ParsedConfigOption) {
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
  context.report({
    node: textNode as any,
    messageId: 'rawTextUsed',
    data: { textValue: value }
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
  context.report({
    node: node as any,
    messageId: 'rawTextUsed',
    data: { textValue: value }
  });
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
      rawTextUsed: 'Raw text \'{{textValue}}\' is used.'
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
      VText (node: AST.VText) {
        checkText(context, node, parsedOptions);
      },
      VAttribute (node: AST.VAttribute | AST.VDirective) {
        if (node.directive) {
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
