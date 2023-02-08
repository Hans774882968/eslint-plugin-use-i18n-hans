import { TSESLint, ASTUtils } from '@typescript-eslint/utils';
import createRule from '../utils/createRule';
import path from 'path';
import multimatch from 'multimatch';

const {
  isIdentifier
} = ASTUtils;

type Options = [{
  excludedFiles: string[];
}];

const whiteList = ['memory'];

const rule = createRule({
  name: 'no-console',
  meta: {
    docs: {
      description: 'Remember to delete console.{{methodName}}()',
      recommended: 'error',
      requiresTypeChecking: false
    },
    messages: {
      rememberToDelete: 'Remember to delete console.{{methodName}}()'
    },
    type: 'problem',
    schema: [
      {
        properties: {
          excludedFiles: {
            type: 'array'
          }
        }
      }
    ]
  },
  defaultOptions: [{ excludedFiles: new Array<string>() }],
  create (
    context: Readonly<TSESLint.RuleContext<'rememberToDelete', Options>>
  ) {
    // 单测环境context.getFilename()只能返回file.ts，只好在引入本插件的工程中看效果
    const fileName = context.getFilename();
    const options = context.options[0] || {};
    const { excludedFiles } = options;
    if (Array.isArray(excludedFiles)) {
      const excludedFilePaths = excludedFiles.map(excludedFile => path.resolve(excludedFile));
      if (multimatch([fileName], excludedFilePaths).length > 0) {
        return {};
      }
    }
    return {
      MemberExpression (node) {
        if (!isIdentifier(node.object) || node.object.name !== 'console' ||
            !isIdentifier(node.property)) {
          return;
        }
        const methodName = node.property.name;
        if (!Object.prototype.hasOwnProperty.call(console, methodName) || whiteList.includes(methodName)) {
          return;
        }
        context.report({
          node,
          messageId: 'rememberToDelete',
          data: { methodName }
        });
      }
    };
  }
});

export default rule;
