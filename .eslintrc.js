module.exports = {
  env: {
    'es2021': true,
    'node': true
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@hans774882968/use-i18n/all'
  ],
  overrides: [
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    'ecmaVersion': 'latest',
    'sourceType': 'module'
  },
  plugins: [
    '@typescript-eslint',
    '@hans774882968/use-i18n',
    'sort-imports-es6-autofix',
    'sort-keys-fix'
  ],
  // http://eslint.cn/docs/rules/
  rules: {
    '@hans774882968/use-i18n/i18n-usage': ['error', {
      i18nFunctionNames: ['$i18n', '$t']
    }],
    '@hans774882968/use-i18n/no-console': ['error', {
      excludedFiles: [
        'test/*.ts',
        'fixtures/no-warn-folder/**/*.js',
        'fixtures/i18n-tests/*.js'
      ]
    }],
    '@typescript-eslint/camelcase': 'off',
    '@typescript-eslint/naming-convention': [
      'off',
      {
        format: null,
        selector: 'default'
      }
    ],
    '@typescript-eslint/no-explicit-any': 'off',
    'arrow-spacing': ['error', { 'after': true, 'before': true }],
    'comma-dangle': ['error', 'never'],
    'comma-spacing': 'error',
    'eol-last': 'error',
    // 使用2个空格
    'indent': ['error', 2, { SwitchCase: 1 }],
    'key-spacing': 'error',
    'keyword-spacing': ['error', { 'before': true }], // } else if() {
    'no-console': 'off',
    'no-constant-condition': ['error', { 'checkLoops': false }],
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-multiple-empty-lines': ['error', { 'max': 1, 'maxEOF': 0 }],
    'no-trailing-spaces': 'error', // 禁用行尾空格
    'object-curly-spacing': [
      2,
      'always',
      { arraysInObjects: true, objectsInObjects: false }
    ],
    // 使用单引号
    'quotes': ['error', 'single'],
    'semi': 'error',
    'sort-imports-es6-autofix/sort-imports-es6': ['warn', {
      ignoreCase: false,
      ignoreMemberSort: false,
      memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single']
    }],
    'sort-keys-fix/sort-keys-fix': 'warn',
    'space-before-blocks': 'error',
    'space-before-function-paren': ['error', 'always'],
    'space-infix-ops': ['error', { 'int32Hint': false }]
  }
};
