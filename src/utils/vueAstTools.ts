import {
  VESLintLiteralTypes,
  VExpressionContainerExpressionType
} from '../types/vue-eslint-parser';
import { AST } from 'vue-eslint-parser';

export type staticLiteralTypes = VESLintLiteralTypes | AST.ESLintTemplateLiteral;

export function isStaticLiteral (node: VExpressionContainerExpressionType):
  node is staticLiteralTypes {
  if (!node) return false;
  if (node.type === 'Literal') return true;
  // 模板字符串
  return node.type === 'TemplateLiteral' && node.expressions.length === 0;
}

export function getStaticLiteralValue (node: staticLiteralTypes) {
  return node.type !== 'TemplateLiteral'
    ? node.value
    : node.quasis[0].value.cooked || node.quasis[0].value.raw;
}
