import { TSESTree } from '@typescript-eslint/utils';

const {
  AST_NODE_TYPES
} = TSESTree;

type staticLiteralTypes = TSESTree.Literal | TSESTree.TemplateLiteral;

export function isStaticLiteral (node: TSESTree.Node):
  node is staticLiteralTypes {
  if (!node) return false;
  if (node.type === 'Literal') return true;
  // 模板字符串
  return node.type === 'TemplateLiteral' && node.expressions.length === 0;
}

export function getStaticLiteralValue (node: staticLiteralTypes) {
  return node.type !== AST_NODE_TYPES.TemplateLiteral
    ? node.value
    : node.quasis[0].value.cooked || node.quasis[0].value.raw;
}
