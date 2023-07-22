import { ESLintUtils } from '@typescript-eslint/utils';
import { InvalidTestCase } from '@typescript-eslint/utils/dist/ts-eslint/RuleTester';
import rule, { MessageIDS, Options } from '../src/rules/i18nMessageUsage';

const ruleTester = new ESLintUtils.RuleTester({
  parser: '@typescript-eslint/parser'
});

const messageShouldNotBeEmptyCases: Array<InvalidTestCase<MessageIDS, Options>> = [
  {
    code: 'this.$message.error();',
    errors: [
      { messageId: 'messageShouldNotBeEmpty' }
    ]
  },
  {
    code: 'abc.messageService.error();',
    errors: [
      { messageId: 'messageShouldNotBeEmpty' }
    ]
  },
  {
    code: 'abc.messageservice.error();',
    errors: [
      { messageId: 'messageShouldNotBeEmpty' }
    ]
  },
  {
    code: 'messageService.error();',
    errors: [
      { messageId: 'messageShouldNotBeEmpty' }
    ]
  },
  {
    code: 'messageservice.error();',
    errors: [
      { messageId: 'messageShouldNotBeEmpty' }
    ]
  },
  {
    code: '$message.error();',
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
    errors: Array(6).fill(0).map(() => ({
      messageId: 'messageShouldNotBeEmpty'
    })),
    options: [{
      levels: ['error', 'warning']
    }]
  },
  {
    code: `function f() {
      ElMessage.warning();
      foo.$message.error();
    }`,
    errors: Array(2).fill(0).map(() => ({
      messageId: 'messageShouldNotBeEmpty'
    })),
    options: [{
      levels: ['error', 'warning'],
      messageObjectNames: ['ElMessage', 'messageService', '$message']
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
      ],
      output: 'this.$message.error($gt(\'hello world\'));'
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
        i18nFunctionName: '$i18n'
      }],
      output: 'messageService.error($i18n(\'hello world\'));'
    },
    {
      code: 'messageService.error(\'hello world\');',
      errors: [
        {
          data: { i18nFunctionName: '$gt' },
          messageId: 'useI18n'
        }
      ],
      output: 'messageService.error($gt(\'hello world\'));'
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
        i18nFunctionName: '$i18n'
      }],
      output: 'messageService({ type: \'error\', message: $i18n(\'hello world\') });'
    },
    {
      code: 'this.$message({ type: \'error\', message: \'hello world\' });',
      errors: [
        {
          data: { i18nFunctionName: '$gt' },
          messageId: 'useI18n'
        }
      ],
      output: 'this.$message({ type: \'error\', message: $gt(\'hello world\') });'
    },
    {
      code: 'abc.$message(\'hello world\');',
      errors: [
        {
          data: { i18nFunctionName: '$gt' },
          messageId: 'useI18n'
        }
      ],
      output: 'abc.$message($gt(\'hello world\'));'
    },
    {
      code: 'messageService(\'hello world\');',
      errors: [
        {
          data: { i18nFunctionName: '$gt' },
          messageId: 'useI18n'
        }
      ],
      output: 'messageService($gt(\'hello world\'));'
    },
    {
      code: `import { ElMessage } from 'element-plus';
      ElMessage(\`hello world\`);`,
      errors: [
        {
          data: { i18nFunctionName: '$i18n' },
          messageId: 'useI18n'
        }
      ],
      options: [{
        i18nFunctionName: '$i18n',
        messageObjectNames: ['ElMessage']
      }],
      output: `import { ElMessage } from 'element-plus';
      ElMessage($i18n('hello world'));`
    },
    {
      code: `import { ElMessage } from 'element-plus';
      ElMessage.error('');
      ElMessage.error("");
      ElMessage.error(\`\`);

      ElMessage.error('hello world');
      messageService.error('hello world');
      $message.error('hello world');
      foo.ElMessage.error('hello world');
      foo.messageService.error('hello world');
      foo.$message.error('hello world');
      ElMessage('hello world');
      messageService('hello world');
      $message('hello world');
      ElMessage({ type: 'warning', message: 'bar' });
      messageService({ type: 'warning', message: 'bar' });
      $message({ type: 'warning', message: 'bar' });
      foo.ElMessage('bar');
      foo.messageService('bar');
      foo.$message('bar');
      foo.ElMessage({ type: 'warning', message: 'bar', foo: 'irrelevant' }, { type: 'warning', message: 'bar' });
      foo.messageService({ type: 'warning', message: 'bar', foo: 'irrelevant' }, { type: 'warning', message: 'bar' });
      foo.$message({ type: 'warning', message: 'bar', foo: 'irrelevant' }, { type: 'warning', message: 'bar' });
      error.messageService('hello world', \`hello\`);
      error.ElMessage({ type: 'error', message: 'hello world' }, \`hello\`);
      `,
      errors: Array(23).fill(0).map(() => ({
        data: { i18nFunctionName: '$gt' },
        messageId: 'useI18n'
      })),
      options: [{
        levels: ['error', 'warning'],
        messageObjectNames: ['ElMessage', 'messageService', '$message']
      }],
      output: `import { ElMessage } from 'element-plus';
      ElMessage.error($gt(''));
      ElMessage.error($gt(''));
      ElMessage.error($gt(''));

      ElMessage.error($gt('hello world'));
      messageService.error($gt('hello world'));
      $message.error($gt('hello world'));
      foo.ElMessage.error($gt('hello world'));
      foo.messageService.error($gt('hello world'));
      foo.$message.error($gt('hello world'));
      ElMessage($gt('hello world'));
      messageService($gt('hello world'));
      $message($gt('hello world'));
      ElMessage({ type: 'warning', message: $gt('bar') });
      messageService({ type: 'warning', message: $gt('bar') });
      $message({ type: 'warning', message: $gt('bar') });
      foo.ElMessage($gt('bar'));
      foo.messageService($gt('bar'));
      foo.$message($gt('bar'));
      foo.ElMessage({ type: 'warning', message: $gt('bar'), foo: 'irrelevant' }, { type: 'warning', message: 'bar' });
      foo.messageService({ type: 'warning', message: $gt('bar'), foo: 'irrelevant' }, { type: 'warning', message: 'bar' });
      foo.$message({ type: 'warning', message: $gt('bar'), foo: 'irrelevant' }, { type: 'warning', message: 'bar' });
      error.messageService($gt('hello world'), \`hello\`);
      error.ElMessage({ type: 'error', message: $gt('hello world') }, \`hello\`);
      `
    },
    {
      code: `messageService.error(123, 'hello');
      messageService.error(true, 'hello');
      messageService.error(false, 'hello');
      messageService.error(null, 'hello');`,
      errors: Array(4).fill(0).map(() => ({
        data: { i18nFunctionName: '$gt' },
        messageId: 'useI18n'
      })),
      output: `messageService.error($gt('123'), 'hello');
      messageService.error($gt('true'), 'hello');
      messageService.error($gt('false'), 'hello');
      messageService.error($gt('null'), 'hello');`
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
    },
    {
      code: `import { ElMessage } from 'element-plus';
      ElMessage.error('hello world');`
    },
    {
      code: 'abc.$message.error($gt(\'hello world\'));'
    },
    {
      code: 'this.$message($gt(\'hello world\'));'
    },
    {
      code: 'abc.$message($gt(\'hello world\'));'
    },
    {
      code: 'messageService($gt(\'hello world\'));'
    },
    {
      code: `import { ElMessage } from 'element-plus';
      ElMessage($gt('hello world'));`,
      options: [{
        messageObjectNames: ['ElMessage']
      }]
    },
    {
      code: 'messageService($gt(\'hello world\'), `hello`);'
    },
    {
      code: `ElMessage($gt('hello world'), \`hello\`);
      messageService('hello world');`,
      options: [{
        messageObjectNames: ['ElMessage']
      }]
    },
    {
      code: `let x = 1;
      ElMessage(\`x = \${x}\`);
      ElMessage.error(\`\${x} === x\`);`,
      options: [{
        i18nFunctionName: '$i18n',
        messageObjectNames: ['ElMessage']
      }]
    },
    {
      code: `messageService.error.hello('hello world', \`hello\`);
      messageService.hello.error('hello world', \`hello\`);
      this.messageService.error.hello('hello world', \`hello\`);
      messageService.error.hello({ type: 'error', message: 'hello message' }, \`hello\`);
      messageService.hello.error({ type: 'error', message: 'hello message' }, \`hello\`);
      this.messageService.error.hello({ type: 'error', message: 'hello message' }, \`hello\`);

      messageService.error(messageService, 'hello');
      messageService.error(undefined, 'hello');
      messageService.error(NaN, 'hello');
      `
    }
  ]
});
