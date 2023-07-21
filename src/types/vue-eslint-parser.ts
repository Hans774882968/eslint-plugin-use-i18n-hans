import {
  ESLintBigIntLiteral,
  ESLintBooleanLiteral,
  ESLintExpression,
  ESLintNullLiteral,
  ESLintNumberLiteral,
  ESLintRegExpLiteral,
  ESLintStringLiteral,
  VFilterSequenceExpression,
  VForExpression,
  VOnExpression,
  VSlotScopeExpression
} from 'vue-eslint-parser/ast';

export type VExpressionContainerExpressionType = ESLintExpression | VFilterSequenceExpression | VForExpression | VOnExpression | VSlotScopeExpression | null;
export type VESLintLiteralTypes = ESLintStringLiteral | ESLintBooleanLiteral | ESLintNullLiteral | ESLintNumberLiteral | ESLintRegExpLiteral | ESLintBigIntLiteral;
