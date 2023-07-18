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
    },
    {
      code: `<template>
      <custom-component title="hello world" />
      <div v-text="'acmer'" />
      <custom-component title="acmer">{{ \`hello world\` }}</custom-component>
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
      ],
      output: `<template>
      <div>{{ $gt('hello') }}</div><div>acmer</div><div>{{ $gt('hans') }}</div>
    </template>`
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
      ],
      output: `<template>
      <custom-component title="acmer7001" />
      <div :acmer="'true'" :title="'true'" />
      <custom-component :title="$gt('hello')">
        <el-form-item class="box" :label="$gt('User Name')" />
        <el-form-item class="box" :label="$gt('用户名')" />
      </custom-component>
    </template>`
    },
    {
      code: `<template>
      <input placeholder="hello-world" />
      <div v-text="true ? 'acmer7' : \`acmer8\${value}\`" />
      <custom-component title="acmer">{{ false ? \`template string\` : 'normal string' }}</custom-component>
      <input placeholder="hello world">{{ true ? 0x1bf52 : undefined }}</input>
    </template>`,
      // 在这个 case 发现， vue-eslint-parser9.1.0 还不支持 0x1bf52n 这种 bigint 的解析
      options: [{
        attributes: attributeConfig,
        ignoreText: ['hello world', 'acmer']
      }],
      errors: [
        {
          messageId: 'rawTextUsed',
          data: { textValue: 'hello-world' }
        },
        {
          messageId: 'rawTextUsed',
          data: { textValue: 'acmer7' }
        },
        {
          messageId: 'rawTextUsed',
          data: { textValue: 'template string' }
        },
        {
          messageId: 'rawTextUsed',
          data: { textValue: 'normal string' }
        },
        {
          messageId: 'rawTextUsed',
          data: { textValue: '114514' }
        }
      ],
      output: `<template>
      <input :placeholder="$gt('hello-world')" />
      <div v-text="true ? $gt('acmer7') : \`acmer8\${value}\`" />
      <custom-component title="acmer">{{ false ? $gt('template string') : $gt('normal string') }}</custom-component>
      <input placeholder="hello world">{{ true ? $gt('114514') : undefined }}</input>
    </template>`
    },
    {
      code: `<template>
      <el-option v-text="'option1'" />
      <el-option v-text="\`option2\`" />
      <el-option v-text="\`选项3\`" />
      <el-option v-text="true" />
      <el-option v-text="false" />
      <el-option v-text="null" />
      <el-option v-text="NaN" />
      <el-option v-text="undefined" />
      <el-option v-text="3.14" />
    </template>`,
      options: [{
        attributes: attributeConfig,
        ignoreText: ['hello world', 'acmer']
      }],
      errors: [
        {
          messageId: 'rawTextUsed',
          data: { textValue: 'option1' }
        },
        {
          messageId: 'rawTextUsed',
          data: { textValue: 'option2' }
        },
        {
          messageId: 'rawTextUsed',
          data: { textValue: '选项3' }
        },
        {
          messageId: 'rawTextUsed',
          data: { textValue: 'true' }
        },
        {
          messageId: 'rawTextUsed',
          data: { textValue: '3.14' }
        }
      ],
      output: `<template>
      <el-option v-text="$gt('option1')" />
      <el-option v-text="$gt('option2')" />
      <el-option v-text="$gt('选项3')" />
      <el-option v-text="$gt('true')" />
      <el-option v-text="false" />
      <el-option v-text="null" />
      <el-option v-text="NaN" />
      <el-option v-text="undefined" />
      <el-option v-text="$gt('3.14')" />
    </template>`
    }
  ]
});
