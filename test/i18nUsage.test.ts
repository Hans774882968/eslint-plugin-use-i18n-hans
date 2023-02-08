import rule from '../src/rules/i18nUsage';
import { ESLintUtils } from '@typescript-eslint/utils';

const ruleTester = new ESLintUtils.RuleTester({
  parser: '@typescript-eslint/parser'
});

ruleTester.run('i18n-usage', rule, {
  valid: [
    {
      code: `
        const v = $gt('acmer');
        console.log(v);
      `
    },
    {
      // $gt 不在检测范围内
      code: `
        class A {
          $t() {}
          $gt() {}
          $i18n() {}
          f() {
            console.log(this.$i18n('hans'));
            console.log(this.$t('ctfer'));
            console.log(this.$gt());
          }
        }
        const a = new A();
        a.f();
      `,
      options: [
        { i18nFunctionNames: ['$i18n', '$t'] }
      ]
    },
    {
      // $gt 不在检测范围内
      code: `
        console.log($i18n('hans'));
        console.log($t('ctfer'));
        console.log($gt());
      `,
      options: [
        { i18nFunctionNames: ['$i18n', '$t'] }
      ]
    },
    {
      // $i18n 不在检测范围内
      code: `
        const y = '123';
        const x = $i18n(y);
        const v = $gt('acmer');
        console.log(v, x);
      `
    }
  ],
  invalid: [
    {
      code: `
        $gt()
      `,
      errors: [{ messageId: 'parameter' }]
    },
    {
      code: `
        const c = $t();
        console.log(c);
      `,
      options: [{ i18nFunctionNames: ['$t'] }],
      errors: [{ messageId: 'parameter' }]
    },
    {
      code: `
        class A {
          $t() {}
          $gt() {}
          $i18n() {}
          f() {
            console.log(this.$i18n('hans'));
            console.log(this.$t('ctfer'));
            console.log(this.$gt());
          }
        }
        const a = new A();
        a.f();
      `,
      options: [
        { i18nFunctionNames: ['$i18n', '$t', '$gt'] }
      ],
      errors: [{ messageId: 'parameter' }]
    },
    {
      code: `
        console.log($i19n(1234));
      `,
      options: [{ i18nFunctionNames: ['$i19n'] }],
      errors: [{ messageId: 'firstArgShouldBeString' }]
    },
    {
      code: `
        console.log($i17n(undefined));
      `,
      options: [{ i18nFunctionNames: ['$i17n'] }],
      errors: [{ messageId: 'firstArgShouldBeString' }]
    },
    {
      code: `
        console.log($i19n(null));
      `,
      options: [{ i18nFunctionNames: ['$i19n'] }],
      errors: [{ messageId: 'firstArgShouldBeString' }]
    },
    {
      code: `
        console.log($i19n(12 + 34));
      `,
      options: [{ i18nFunctionNames: ['$i19n'] }],
      errors: [{ messageId: 'firstArgShouldBeString' }]
    },
    {
      code: `
        const x = 'aaa';
        $gt(x);
      `,
      errors: [{ messageId: 'firstArgShouldBeString' }]
    },
    {
      code: `
        const y = '123';
        const x = $i18n(y);
        const v = $gt('acmer');
        console.log(v, x);
      `,
      options: [
        { i18nFunctionNames: ['$i18n'] }
      ],
      errors: [{ messageId: 'firstArgShouldBeString' }]
    },
    {
      // 按文件从上到下的顺序匹配所有错误
      code: `
        class A {
          $t() {}
          $gt() {}
          $i18n() {}
          g() {
            const y = 'acmer';
            console.log(this.$t(y));
            console.log(this.$i18n());
            console.log(this.$gt(y));
          }
          f() {
            const x = 'hans';
            console.log(this.$i18n());
            console.log(this.$t(x));
            console.log(this.$gt(x));
          }
        }
        const a = new A();
        a.f();
        a.g();
      `,
      options: [
        { i18nFunctionNames: ['$i18n', '$t'] }
      ],
      errors: [
        { messageId: 'firstArgShouldBeString' }, { messageId: 'parameter' },
        { messageId: 'parameter' }, { messageId: 'firstArgShouldBeString' }
      ]
    },
    {
      code: `
        function f() {
          const $i18n = () => {};
          const $gt = () => {};
          const $t = () => {};
          console.log($gt());
          console.log($t());
          console.log($i18n());
          const x = '1234';
          console.log($gt(x));
          console.log($t(x));
          console.log($i18n(x));

          console.log($gt('5678'));
          console.log($t('5678'));
          console.log($i18n('5678'));

          console.log($gt(1234));
          console.log($t(1234));
          console.log($i18n(1234));

          console.log($gt(true));
          console.log($t(true));
          console.log($i18n(true));

          console.log($gt(12 + 34));
          console.log($t(12 + 34));
          console.log($i18n(12 + 34));
        }

        f();
      `,
      options: [
        { i18nFunctionNames: ['$i18n'] }
      ],
      errors: [
        { messageId: 'parameter' }, { messageId: 'firstArgShouldBeString' },
        { messageId: 'firstArgShouldBeString' }, { messageId: 'firstArgShouldBeString' },
        { messageId: 'firstArgShouldBeString' }
      ]
    }
  ]
});
