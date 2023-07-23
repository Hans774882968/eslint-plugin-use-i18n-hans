import { ESLintUtils } from '@typescript-eslint/utils';
import { InvalidTestCase, ValidTestCase } from '@typescript-eslint/utils/dist/ts-eslint/RuleTester';
import rule, { MessageIDS, Options } from '../src/rules/configSchemaNoRawText';

const ruleTester = new ESLintUtils.RuleTester({
  parser: '@typescript-eslint/parser'
});

const validNonArrayCases: Array<ValidTestCase<Options>> = [
  {
    code: '{ label: \'foo\' }'
  },
  {
    code: '{ label: \'foo\' }',
    options: [{
      paths: [
        ''
      ]
    }]
  },
  {
    code: '{ label: \'foo\' }',
    options: [{
      paths: [
        'label.a'
      ]
    }]
  },
  {
    code: '{ label: { x: 0 } }',
    options: [{
      paths: [
        'label'
      ]
    }]
  },
  {
    code: '{ label: { x: \'hello~\' } }',
    options: [{
      paths: [
        'label.x.'
      ]
    }]
  },
  {
    code: '{ label: { x: \'hello~\' } }',
    options: [{
      paths: [
        '.label.x', '.label.x.'
      ]
    }]
  },
  {
    code: `let label = {};
    export default { label: { x: 'hello~' }, ...label };
    `,
    options: [{
      paths: [
        'label.', 'label'
      ]
    }]
  }
];

const validArrayCases: Array<ValidTestCase<Options>> = [
  {
    code: 'export default { columns: [{ label: [ { x: \'hello\' } ] }] };',
    options: [{
      paths: [
        'columns[].label[]'
      ]
    }]
  },
  {
    code: `let x = 0, y = [{ label: 'hello~' }];
    export default { columns: [{ label: [ { x: 'hello' } ] }, x, ...y] };`,
    options: [{
      paths: [
        'columns[].label'
      ]
    }]
  },
  {
    code: `let x = 0, y = [{ label: 'hello~' }];
    export default { columns: [{ label: x }, x, ...y] };`,
    options: [{
      paths: [
        'columns[].label.x'
      ]
    }]
  }
];

const invalidArrayCases: Array<InvalidTestCase<MessageIDS, Options>> = [
  {
    code: `let a = { columns: [
      { label: 'station字段1', prop: 'field1' },
      { label: 'station字段2', prop: 'field2' },
      { label: 'station字段5', prop: 'field5' },
      { label: 'station字段6', prop: 'field6' },
    ] };`,
    errors: Array(4).fill(0).map(() => ({
      data: { i18nFunctionName: '$i18n' },
      messageId: 'useI18n'
    })),
    options: [{
      i18nFunctionName: '$i18n',
      paths: [
        'columns[].label'
      ]
    }],
    output: `let a = { columns: [
      { label: $i18n('station字段1'), prop: 'field1' },
      { label: $i18n('station字段2'), prop: 'field2' },
      { label: $i18n('station字段5'), prop: 'field5' },
      { label: $i18n('station字段6'), prop: 'field6' },
    ] };`
  },
  {
    code: `let a = { columns: [
      { label: 'station字段1', prop: 'field1' },
      { label: [{ x: 'station字段2' }, { x: 'station字段5' }, { x: 'station字段6' }], prop: 'field2' },
    ] };`,
    errors: Array(4).fill(0).map(() => ({
      data: { i18nFunctionName: '$gt' },
      messageId: 'useI18n'
    })),
    options: [{
      paths: [
        'columns[].label',
        'columns[].label[].x'
      ]
    }],
    output: `let a = { columns: [
      { label: $gt('station字段1'), prop: 'field1' },
      { label: [{ x: $gt('station字段2') }, { x: $gt('station字段5') }, { x: $gt('station字段6') }], prop: 'field2' },
    ] };`
  }
];

ruleTester.run('config-schema-no-raw-text', rule, {
  invalid: [
    {
      code: `let a = { label1: 'foo' };
      fn({ label2: 'foo' });
      let b = {
        foo: { label3: 'hello world', label5: \`hello \${a}\`, label6: 'hello~' },
        bar: { label7: { label8: 'hi~' } }
      };
      export default { label4: \`hello world\` };`,
      errors: Array(6).fill(0).map(() => ({
        data: { i18nFunctionName: '$gt' },
        messageId: 'useI18n'
      })),
      options: [{
        paths: [
          'label1', 'label2', 'label3', 'label4', 'label5', 'label6', 'label7', 'label8'
        ]
      }],
      output: `let a = { label1: $gt('foo') };
      fn({ label2: $gt('foo') });
      let b = {
        foo: { label3: $gt('hello world'), label5: \`hello \${a}\`, label6: $gt('hello~') },
        bar: { label7: { label8: $gt('hi~') } }
      };
      export default { label4: $gt('hello world') };`
    },
    {
      code: `let a = {
        x: { y: { z: 'foo' } }
      };`,
      errors: Array(3).fill(0).map(() => ({
        data: { i18nFunctionName: '$i18n' },
        messageId: 'useI18n'
      })),
      options: [{
        i18nFunctionName: '$i18n',
        paths: [
          'x.y.z', 'y.z', 'z'
        ]
      }],
      output: `let a = {
        x: { y: { z: $i18n('foo') } }
      };`
    },
    ...invalidArrayCases
  ],
  valid: [
    ...validNonArrayCases,
    ...validArrayCases
  ]
});
