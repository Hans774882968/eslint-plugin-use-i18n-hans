import rule from '../src/rules/i18nUsage';
import { ESLintUtils } from '@typescript-eslint/utils';
import { TestCaseError } from '@typescript-eslint/utils/dist/ts-eslint/RuleTester';
import { MessageIDS } from '../src/rules/i18nUsage';

const ruleTester = new ESLintUtils.RuleTester({
  parser: '@typescript-eslint/parser'
});

const firstArgError = (i18nFunctionName: string, replaceResult: string, output: string):
  TestCaseError<MessageIDS> => {
  return {
    messageId: 'firstArgShouldBeString',
    suggestions: [
      {
        messageId: 'autofixFirstArgSuggest',
        data: { i18nFunctionName, replaceResult },
        output
      }
    ]
  };
};

const basicCaseInputCodes = [
  'console.log($i19n(1234));',
  'console.log($i17n(undefined));',
  'console.log($i19n(null));',
  'console.log($i19n(NaN));',
  'console.log($i19n(12+34*65));', // escodegen - auto format
  `
    const x = 'aaa';
    $gt(x);
  `,
  `
    const $y0y$$ = '123';
    const x = $i18n($y0y$$);
    const v = $gt('acmer');
    console.log(v, x);
  `,
  // escodegen - auto format
  `
  console.log($i18n(12
    + 34 *
    f(5)+({
      x:{y:1+ 2}
    }).x.y
  ));
  `
];

const basicCaseOutputCodes = [
  'console.log($i19n(\'{value}\', null, { value: 1234 }));',
  'console.log($i17n(\'{value}\', null, { value: undefined }));',
  'console.log($i19n(\'{value}\', null, { value: null }));',
  'console.log($i19n(\'{value}\', null, { value: NaN }));',
  'console.log($i19n(\'{value}\', null, { value: 12 + 34 * 65 }));', // escodegen - auto format
  `
    const x = 'aaa';
    $gt('{x}', null, { x });
  `,
  `
    const $y0y$$ = '123';
    const x = $i18n('{$y0y$$}', null, { $y0y$$ });
    const v = $gt('acmer');
    console.log(v, x);
  `,
  // escodegen - auto format
  `
  console.log($i18n('{value}', null, { value: 12 + 34 * f(5) + { x: { y: 1 + 2 } }.x.y }
  ));
  `
];

const bigCaseInputCodes = [
  `
  class A {
    $t() {}
    $gt() {}
    $i18n() {}
    g() {
      const y0y = 'acmer';
      console.log(this.$t(y0y));
      console.log(this.$i18n());
      console.log(this.$gt(y0y));
    }
    f() {
      const _x_ = 'hans';
      console.log(this.$i18n());
      console.log(this.$t(_x_));
      console.log(this.$gt(_x_));
    }
  }
  const a = new A();
  a.f();
  a.g();
  `,
  // escodegen - auto format + more than 1 params
  `
  function f() {
    const $i18n = () => {};
    const $gt = () => {};
    const $t = () => {};
    console.log($gt());
    console.log($t());
    console.log($i18n());
    console.log($gt(({x:{y:1243}}).x.y));
    console.log($t(({x:{y:1243}}).x.y));
    console.log($i18n(({x:{y:1243}}).x.y));

    console.log($gt('5678'));
    console.log($t('5678'));
    console.log($i18n('5678'));

    const a = [2, 3, 4];
    console.log($gt((a[1]+a[2])*a[0]));
    console.log($t((a[1]+a[2])*a[0]));
    console.log($i18n((a[1]+a[2])*a[0]));

    console.log($gt((a[1]+a[2])*a[0], null));
    console.log($t((a[1]+a[2])*a[0], null));
    console.log($i18n((a[1]+a[2])*a[0], null));
  }

  f();
  `
];

// 注意：需要模拟的是单处格式化的结果
const bigCaseOutputCodes = [
  [
    `
  class A {
    $t() {}
    $gt() {}
    $i18n() {}
    g() {
      const y0y = 'acmer';
      console.log(this.$t('{y0y}', null, { y0y }));
      console.log(this.$i18n());
      console.log(this.$gt(y0y));
    }
    f() {
      const _x_ = 'hans';
      console.log(this.$i18n());
      console.log(this.$t(_x_));
      console.log(this.$gt(_x_));
    }
  }
  const a = new A();
  a.f();
  a.g();
  `, `
  class A {
    $t() {}
    $gt() {}
    $i18n() {}
    g() {
      const y0y = 'acmer';
      console.log(this.$t(y0y));
      console.log(this.$i18n());
      console.log(this.$gt(y0y));
    }
    f() {
      const _x_ = 'hans';
      console.log(this.$i18n());
      console.log(this.$t('{_x_}', null, { _x_ }));
      console.log(this.$gt(_x_));
    }
  }
  const a = new A();
  a.f();
  a.g();
  `, `
  class A {
    $t() {}
    $gt() {}
    $i18n() {}
    g() {
      const y0y = 'acmer';
      console.log(this.$t('{y0y}', null, { y0y }));
      console.log(this.$i18n());
      console.log(this.$gt(y0y));
    }
    f() {
      const _x_ = 'hans';
      console.log(this.$i18n());
      console.log(this.$t('{_x_}', null, { _x_ }));
      console.log(this.$gt(_x_));
    }
  }
  const a = new A();
  a.f();
  a.g();
  `
  ],
  [
    `
  function f() {
    const $i18n = () => {};
    const $gt = () => {};
    const $t = () => {};
    console.log($gt());
    console.log($t());
    console.log($i18n());
    console.log($gt(({x:{y:1243}}).x.y));
    console.log($t(({x:{y:1243}}).x.y));
    console.log($i18n('{value}', null, { value: { x: { y: 1243 } }.x.y }));

    console.log($gt('5678'));
    console.log($t('5678'));
    console.log($i18n('5678'));

    const a = [2, 3, 4];
    console.log($gt((a[1]+a[2])*a[0]));
    console.log($t((a[1]+a[2])*a[0]));
    console.log($i18n((a[1]+a[2])*a[0]));

    console.log($gt((a[1]+a[2])*a[0], null));
    console.log($t((a[1]+a[2])*a[0], null));
    console.log($i18n((a[1]+a[2])*a[0], null));
  }

  f();
  `, `
  function f() {
    const $i18n = () => {};
    const $gt = () => {};
    const $t = () => {};
    console.log($gt());
    console.log($t());
    console.log($i18n());
    console.log($gt(({x:{y:1243}}).x.y));
    console.log($t(({x:{y:1243}}).x.y));
    console.log($i18n(({x:{y:1243}}).x.y));

    console.log($gt('5678'));
    console.log($t('5678'));
    console.log($i18n('5678'));

    const a = [2, 3, 4];
    console.log($gt((a[1]+a[2])*a[0]));
    console.log($t((a[1]+a[2])*a[0]));
    console.log($i18n('{value}', null, { value: (a[1] + a[2]) * a[0] }));

    console.log($gt((a[1]+a[2])*a[0], null));
    console.log($t((a[1]+a[2])*a[0], null));
    console.log($i18n((a[1]+a[2])*a[0], null));
  }

  f();
  `, `
  function f() {
    const $i18n = () => {};
    const $gt = () => {};
    const $t = () => {};
    console.log($gt());
    console.log($t());
    console.log($i18n());
    console.log($gt(({x:{y:1243}}).x.y));
    console.log($t(({x:{y:1243}}).x.y));
    console.log($i18n('{value}', null, { value: { x: { y: 1243 } }.x.y }));

    console.log($gt('5678'));
    console.log($t('5678'));
    console.log($i18n('5678'));

    const a = [2, 3, 4];
    console.log($gt((a[1]+a[2])*a[0]));
    console.log($t((a[1]+a[2])*a[0]));
    console.log($i18n('{value}', null, { value: (a[1] + a[2]) * a[0] }));

    console.log($gt((a[1]+a[2])*a[0], null));
    console.log($t((a[1]+a[2])*a[0], null));
    console.log($i18n((a[1]+a[2])*a[0], null));
  }

  f();
  `
  ]
];

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
      code: basicCaseInputCodes[0],
      options: [{ i18nFunctionNames: ['$i19n'] }],
      output: basicCaseOutputCodes[0],
      errors: [
        firstArgError('$i19n', '\'{value}\', null, { value: 1234 }', basicCaseOutputCodes[0])
      ]
    },
    {
      code: basicCaseInputCodes[1],
      options: [{ i18nFunctionNames: ['$i17n'] }],
      output: basicCaseOutputCodes[1],
      errors: [
        firstArgError('$i17n', '\'{value}\', null, { value: undefined }', basicCaseOutputCodes[1])
      ]
    },
    {
      code: basicCaseInputCodes[2],
      options: [{ i18nFunctionNames: ['$i19n'] }],
      output: basicCaseOutputCodes[2],
      errors: [
        firstArgError('$i19n', '\'{value}\', null, { value: null }', basicCaseOutputCodes[2])
      ]
    },
    {
      code: basicCaseInputCodes[3],
      options: [{ i18nFunctionNames: ['$i19n'] }],
      output: basicCaseOutputCodes[3],
      errors: [
        firstArgError('$i19n', '\'{value}\', null, { value: NaN }', basicCaseOutputCodes[3])
      ]
    },
    {
      code: basicCaseInputCodes[4],
      options: [{ i18nFunctionNames: ['$i19n'] }],
      output: basicCaseOutputCodes[4],
      errors: [
        firstArgError('$i19n', '\'{value}\', null, { value: 12 + 34 * 65 }', basicCaseOutputCodes[4])
      ]
    },
    {
      code: basicCaseInputCodes[5],
      output: basicCaseOutputCodes[5],
      errors: [
        firstArgError('$gt', '\'{x}\', null, { x }', basicCaseOutputCodes[5])
      ]
    },
    {
      code: basicCaseInputCodes[6],
      options: [
        { i18nFunctionNames: ['$i18n'] }
      ],
      output: basicCaseOutputCodes[6],
      errors: [
        firstArgError('$i18n', '\'{$y0y$$}\', null, { $y0y$$ }', basicCaseOutputCodes[6])
      ]
    },
    {
      code: basicCaseInputCodes[7],
      options: [
        { i18nFunctionNames: ['$i18n'] }
      ],
      output: basicCaseOutputCodes[7],
      errors: [
        firstArgError('$i18n', '\'{value}\', null, { value: 12 + 34 * f(5) + { x: { y: 1 + 2 } }.x.y }', basicCaseOutputCodes[7])
      ]
    },
    // big cases
    {
      // 按文件从上到下的顺序匹配所有错误
      code: bigCaseInputCodes[0],
      options: [
        { i18nFunctionNames: ['$i18n', '$t'] }
      ],
      output: bigCaseOutputCodes[0][2],
      errors: [
        firstArgError('$t', '\'{y0y}\', null, { y0y }', bigCaseOutputCodes[0][0]),
        { messageId: 'parameter' },
        { messageId: 'parameter' },
        firstArgError('$t', '\'{_x_}\', null, { _x_ }', bigCaseOutputCodes[0][1])
      ]
    },
    {
      code: bigCaseInputCodes[1],
      options: [
        { i18nFunctionNames: ['$i18n'] }
      ],
      output: bigCaseOutputCodes[1][2],
      errors: [
        { messageId: 'parameter' },
        firstArgError('$i18n', '\'{value}\', null, { value: { x: { y: 1243 } }.x.y }', bigCaseOutputCodes[1][0]),
        firstArgError('$i18n', '\'{value}\', null, { value: (a[1] + a[2]) * a[0] }', bigCaseOutputCodes[1][1]),
        { messageId: 'firstArgShouldBeString' }
      ]
    }
  ]
});
