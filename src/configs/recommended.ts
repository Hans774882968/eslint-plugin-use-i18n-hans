export default {
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    sourceType: 'module'
  },
  rules: {
    '@hans774882968/use-i18n/i18n-usage': 'error',
    '@hans774882968/use-i18n/i18n-usage-vue': 'error',
    '@hans774882968/use-i18n/i18n-no-raw-text': 'error'
  }
};
