// @flow

/**
 * @param expr - an object representing an expression
 * @param top - whether this is a top-level expression - to avoid unneccessary ()
 * @return a string representing a query condition
 */
export function exprToString(
  expr: {[string]: any},
  top: boolean = true
): string {
  const strExpr = exprToStringInner(expr, top);

  // Removes unneccessary () from inner expressions within and(s) and or(s)
  if (strExpr[0] === '(' && strExpr[strExpr.length - 1] === ')') {
    return strExpr.substring(1, strExpr.length - 1);
  } else {
    return strExpr;
  }
}

/**
 * @param expr - an object representing an expression
 * @param top - whether this is a top-level expression - to avoid unneccessary ()
 * @return a string representing a query condition
 */
function exprToStringInner(expr: {[string]: any}, top: boolean = true): string {
  // We have reached a simple value
  if (typeof expr !== 'object') {
    return expr.toString();
  }

  const opMap = {
    $gte: '>=',
    $gt: '>',
    $lt: '<',
    $lte: '<=',
    $ne: '!=',
    $eq: '=',
  };

  const type = Object.keys(expr)[0];
  let exprString;
  switch (type) {
    case 'cmp':
      exprString = expr.cmp.lhs + ' ' + opMap[expr.cmp.op] + ' ' + expr.cmp.rhs;
      break;

    case 'and':
      exprString =
        '(' +
        expr.and.clauses.map((c) => exprToString(c, false)).join(' ∧ ') +
        ')';
      break;

    case 'or':
      exprString =
        '(' +
        expr.or.clauses.map((c) => exprToString(c, false)).join(' ∨ ') +
        ')';
      break;

    case 'not':
      exprString = '¬(' + exprToString(expr.not.clause, false) + ')';
      break;

    default:
      throw new Error('Unhandled expression object');
  }

  // Parenthesize if we're not at the top level
  if (top) {
    return exprString;
  } else {
    return '(' + exprString + ')';
  }
}
