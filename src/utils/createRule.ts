import { ESLintUtils } from '@typescript-eslint/utils';

// Note - cannot migrate this to an import statement because it will make TSC copy the package.json to the dist folder
// const {version} = require("../../package.json");
export default ESLintUtils.RuleCreator(
  () =>
    'https://github.com/Hans774882968/eslint-plugin-use-i18n-hans/blob/main/README.md'
);
