import rule from '../src/rules/i18nNoRawText';
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

const attributeConfig = {
  '/.+/': [
    'title',
    'placeholder',
    'content'
  ],
  'input': ['placeholder'],
  'img': ['alt'],
  'el-form-item': ['label'],
  'el-table-column': ['label'],
  'el-tabs-pane': ['label'],
  'el-option': ['label']
};

ruleTester.run('i18n-usage-vue', rule as any, {
  valid: [
    {
      code: `<template>
        <div>{{ $gt('hello world') }}</div>
      </template>`
    },
    {
      code: `<template>
      <div>hello world</div><div>acmer</div>
    </template>`,
      options: [{
        attributes: attributeConfig,
        ignoreText: ['hello world', 'acmer']
      }]
    },
    {
      code: `<template>
      <custom-component title="hello world" />
      <div :acmer="true" />
      <custom-component title="acmer" />
    </template>`,
      options: [{
        attributes: attributeConfig,
        ignoreText: ['hello world', 'acmer']
      }]
    }
  ],
  invalid: [
    {
      code: `<template>
      <div>hello</div><div>acmer</div><div>hans</div>
    </template>`,
      options: [{
        attributes: attributeConfig,
        ignoreText: ['hello world', 'acmer']
      }],
      errors: [
        {
          messageId: 'rawTextUsed',
          data: { textValue: 'hello' }
        },
        {
          messageId: 'rawTextUsed',
          data: { textValue: 'hans' }
        }
      ]
    },
    {
      code: `<template>
      <custom-component title="acmer7001" />
      <div :acmer="'true'" :title="'true'" />
      <custom-component title="hello">
        <el-form-item class="box" label="User Name" />
        <el-form-item class="box" label="用户名" />
      </custom-component>
    </template>`,
      options: [{
        attributes: attributeConfig,
        ignoreText: ['hello world', 'acmer7001']
      }],
      errors: [
        {
          messageId: 'rawTextUsed',
          data: { textValue: 'hello' }
        },
        {
          messageId: 'rawTextUsed',
          data: { textValue: 'User Name' }
        },
        {
          messageId: 'rawTextUsed',
          data: { textValue: '用户名' }
        }
      ]
    }
  ]
});
