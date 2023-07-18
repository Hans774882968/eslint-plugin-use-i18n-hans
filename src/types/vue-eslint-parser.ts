import {
  ESLintExpression,
  VFilterSequenceExpression,
  VForExpression,
  VOnExpression,
  VSlotScopeExpression,
  ESLintStringLiteral,
  ESLintBooleanLiteral,
  ESLintNullLiteral,
  ESLintNumberLiteral,
  ESLintRegExpLiteral,
  ESLintBigIntLiteral
} from 'vue-eslint-parser/ast';

export type VExpressionContainerExpressionType = ESLintExpression | VFilterSequenceExpression | VForExpression | VOnExpression | VSlotScopeExpression | null;
export type VESLintLiteralTypes = ESLintStringLiteral | ESLintBooleanLiteral | ESLintNullLiteral | ESLintNumberLiteral | ESLintRegExpLiteral | ESLintBigIntLiteral;
