import rule from '../src/rules/i18nUsageVue';
import { RuleTester } from 'eslint';
const vueEslintParser = require.resolve('vue-eslint-parser');

const ruleTester = new RuleTester({
  parser: vueEslintParser,
  parserOptions: {
    ecmaVersion: 2015,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  }
});

const firstArgError = (i18nFunctionName: string, replaceResult: string, output: string):
  RuleTester.TestCaseError => {
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
  '<template><p><span>{{ $t(123) }}</span></p></template>',
  '<template><p>{{ $t(null) }}</p></template>',
  '<template><p>{{ $t(undefined) }}</p></template>',
  '<template><p><span>{{ $t(NaN) }}</span></p></template>',
  '<template><p><span>{{ $t(true) }}</span></p></template>',
  '<template><p><span>{{ $t(false) }}</span></p></template>',
  `
  <template><p><span>{{ $t(()=>{}) }}</span></p></template>
  `,
  // vue-eslint-parser的bug，两个右大括号不要写在一起，要用一个空格隔开
  '<template><p><span>{{ $t(12*({x:{y:2} }).x.y+34*65) }}</span></p></template>',
  '<template><p>{{ $t($t) }}</p></template>'
];

const basicCaseOutputCodes = [
  '<template><p><span>{{ $t(\'{value}\', null, { value: 123 }) }}</span></p></template>',
  '<template><p>{{ $t(\'{value}\', null, { value: null }) }}</p></template>',
  '<template><p>{{ $t(\'{value}\', null, { value: undefined }) }}</p></template>',
  '<template><p><span>{{ $t(\'{value}\', null, { value: NaN }) }}</span></p></template>',
  '<template><p><span>{{ $t(\'{value}\', null, { value: true }) }}</span></p></template>',
  '<template><p><span>{{ $t(\'{value}\', null, { value: false }) }}</span></p></template>',
  `
  <template><p><span>{{ $t('{value}', null, { value: () => {
} }) }}</span></p></template>
  `,
  '<template><p><span>{{ $t(\'{value}\', null, { value: 12 * { x: { y: 2 } }.x.y + 34 * 65 }) }}</span></p></template>',
  '<template><p>{{ $t(\'{$t}\', null, { $t }) }}</p></template>'
];

ruleTester.run('i18n-usage-vue', rule as any, {
  valid: [
    {
      code: `<template>
        <div>{{ $gt('x') }}</div>
      </template>`
    },
    {
      code: `<template>
        <div>
          {{ $gt('hello world') }}
          <p>
            {{ $i18n(123) }}
          </p>
          {{ $gt('x1x2x3', 5, 6) }}
        </div>
      </template>`
    }
  ],
  invalid: [
    {
      // <script>内的不在检测范围内
      code: `
        <template>
          <div>{{ $gt() }}</div>
        </template>

        <script>
        function f() {
          console.log($gt());
        }
        </script>
      `,
      errors: [
        { messageId: 'parameter' }
      ]
    },
    {
      code: `<template>
        {{ $t() }}
      </template>`,
      options: [{ i18nFunctionNames: ['$t'] }],
      errors: [{ messageId: 'parameter' }]
    },
    {
      code: basicCaseInputCodes[0],
      options: [{ i18nFunctionNames: ['$t'] }],
      output: basicCaseOutputCodes[0],
      errors: [
        firstArgError('$t', '\'{value}\', null, { value: 123 }', basicCaseOutputCodes[0])
      ]
    },
    {
      code: basicCaseInputCodes[1],
      options: [{ i18nFunctionNames: ['$t'] }],
      output: basicCaseOutputCodes[1],
      errors: [
        firstArgError('$t', '\'{value}\', null, { value: null }', basicCaseOutputCodes[1])
      ]
    },
    {
      code: basicCaseInputCodes[2],
      options: [{ i18nFunctionNames: ['$t'] }],
      output: basicCaseOutputCodes[2],
      errors: [
        firstArgError('$t', '\'{value}\', null, { value: undefined }', basicCaseOutputCodes[2])
      ]
    },
    {
      code: basicCaseInputCodes[3],
      options: [{ i18nFunctionNames: ['$t'] }],
      output: basicCaseOutputCodes[3],
      errors: [
        firstArgError('$t', '\'{value}\', null, { value: NaN }', basicCaseOutputCodes[3])
      ]
    },
    {
      code: basicCaseInputCodes[4],
      options: [{ i18nFunctionNames: ['$t'] }],
      output: basicCaseOutputCodes[4],
      errors: [
        firstArgError('$t', '\'{value}\', null, { value: true }', basicCaseOutputCodes[4])
      ]
    },
    {
      code: basicCaseInputCodes[5],
      options: [{ i18nFunctionNames: ['$t'] }],
      output: basicCaseOutputCodes[5],
      errors: [
        firstArgError('$t', '\'{value}\', null, { value: false }', basicCaseOutputCodes[5])
      ]
    },
    {
      code: basicCaseInputCodes[6],
      options: [{ i18nFunctionNames: ['$t'] }],
      output: basicCaseOutputCodes[6],
      errors: [
        firstArgError('$t', `'{value}', null, { value: () => {
} }`, basicCaseOutputCodes[6])
      ]
    },
    {
      code: basicCaseInputCodes[7],
      options: [{ i18nFunctionNames: ['$t'] }],
      output: basicCaseOutputCodes[7],
      errors: [
        firstArgError('$t', '\'{value}\', null, { value: 12 * { x: { y: 2 } }.x.y + 34 * 65 }', basicCaseOutputCodes[7])
      ]
    },
    {
      code: basicCaseInputCodes[8],
      options: [{ i18nFunctionNames: ['$t'] }],
      output: basicCaseOutputCodes[8],
      errors: [
        firstArgError('$t', '\'{$t}\', null, { $t }', basicCaseOutputCodes[8])
      ]
    }
  ]
});
