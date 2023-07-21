import { ESLintUtils } from '@typescript-eslint/utils';
import { InvalidTestCase } from '@typescript-eslint/utils/dist/ts-eslint/RuleTester';
import rule, { MessageIDS, Options } from '../src/rules/i18nMessageUsage';

const ruleTester = new ESLintUtils.RuleTester({
  parser: '@typescript-eslint/parser'
});

const messageShouldNotBeEmptyCases: Array<InvalidTestCase<MessageIDS, Options>> = [
  {
    code: 'this.$message.error()',
    errors: [
      { messageId: 'messageShouldNotBeEmpty' }
    ]
  },
  {
    code: 'abc.messageService.error()',
    errors: [
      { messageId: 'messageShouldNotBeEmpty' }
    ]
  },
  {
    code: 'abc.messageservice.error()',
    errors: [
      { messageId: 'messageShouldNotBeEmpty' }
    ]
  },
  {
    code: 'messageService.error()',
    errors: [
      { messageId: 'messageShouldNotBeEmpty' }
    ]
  },
  {
    code: 'messageservice.error()',
    errors: [
      { messageId: 'messageShouldNotBeEmpty' }
    ]
  },
  {
    code: '$message.error()',
    errors: [
      { messageId: 'messageShouldNotBeEmpty' }
    ]
  },
  {
    code: 'this.$message({ type: "error" });',
    errors: [
      { messageId: 'messageShouldNotBeEmpty' }
    ]
  },
  {
    code: 'messageService({ type: "error" });',
    errors: [
      { messageId: 'messageShouldNotBeEmpty' }
    ]
  },
  {
    code: `function f() {
      messageService({ type: "warning" });
      messageService({ type: "error" });
      this.$message({ type: "warning" });
      this.$message({ type: "error" });
      abc.$Message({ type: "warning" });
      def.$Message({ type: "error" });
    }`,
    errors: [
      { messageId: 'messageShouldNotBeEmpty' },
      { messageId: 'messageShouldNotBeEmpty' },
      { messageId: 'messageShouldNotBeEmpty' },
      { messageId: 'messageShouldNotBeEmpty' },
      { messageId: 'messageShouldNotBeEmpty' },
      { messageId: 'messageShouldNotBeEmpty' }
    ],
    options: [{
      levels: ['error', 'warning']
    }]
  }
];

ruleTester.run('i18n-message-usage', rule, {
  invalid: [
    ...messageShouldNotBeEmptyCases,
    {
      code: 'this.$message.error(\'hello world\');',
      errors: [
        { messageId: 'useI18n' }
      ]
    },
    {
      code: 'messageService.error(\'hello world\');',
      errors: [
        {
          data: { i18nFunctionName: '$i18n' },
          messageId: 'useI18n'
        }
      ],
      options: [{
        i18nFunctionNames: ['$i18n']
      }]
    },
    {
      code: 'messageService.error(\'hello world\');',
      errors: [
        {
          data: { i18nFunctionName: '$gt' },
          messageId: 'useI18n'
        }
      ]
    },
    {
      code: 'messageService({ type: \'error\', message: \'hello world\' });',
      errors: [
        {
          data: { i18nFunctionName: '$i18n' },
          messageId: 'useI18n'
        }
      ],
      options: [{
        i18nFunctionNames: ['$i18n']
      }]
    },
    {
      code: 'this.$message({ type: \'error\', message: \'hello world\' });',
      errors: [
        {
          data: { i18nFunctionName: '$gt' },
          messageId: 'useI18n'
        }
      ]
    }
  ],
  valid: [
    {
      code: 'this.$message.error($gt(\'hello world\'));'
    },
    {
      code: 'messageService.error($gt(\'hello world\'));'
    },
    {
      code: 'messageService({ type: \'error\', message: $gt(\'hello world\') });'
    },
    {
      code: 'this.$message({ type: \'error\', message: $gt(\'hello world\') });'
    }
  ]
});
