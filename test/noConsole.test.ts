import rule from '../src/rules/noConsole';
import { ESLintUtils } from '@typescript-eslint/utils';

const ruleTester = new ESLintUtils.RuleTester({
  parser: '@typescript-eslint/parser'
});

ruleTester.run('no-console', rule, {
  valid: [
    {
      code: `
        const x = 1;
        const y = 2;
      `
    },
    {
      code: `
        const x = 1;
        console.memory;
      `
    }
  ],
  invalid: [
    {
      code: `
        const x = 1;
        console.log('x', x);
      `,
      errors: [{ messageId: 'rememberToDelete' }]
    },
    {
      code: `
        const x = 1;
        console.debug('x', x);
        const y = 2;
      `,
      errors: [{ messageId: 'rememberToDelete' }]
    },
    {
      code: `
        function f() {
          const x = { y: 1 };
          console.dir(x);
        }
        f();
      `,
      errors: [{ messageId: 'rememberToDelete' }]
    }
  ]
});
