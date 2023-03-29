// @flow
import fromEntries from 'fromentries';
import produce from 'immer';

export const EXPR_FROM_SQL = 'EXPR_FROM_SQL';
export const ENABLE_OPTIMIZATION = 'ENABLE_OPTIMIZATION';
export const DISABLE_OPTIMIZATION = 'DISABLE_OPTIMIZATION';

type ExprFromSqlAction = {
  type: 'EXPR_FROM_SQL',
  sql: {[string]: any},
  types: {[string]: Array<string>},
};

type EnableOptimizationAction = {
  type: 'ENABLE_OPTIMIZATION',
  optimization: string,
};

type DisableOptimizationAction = {
  type: 'DISABLE_OPTIMIZATION',
};

/**
 * @param sql - a parsed SQL query
 * @param types - an object mapping table names to lists of columns
 * @return a new EXPR_FROM_SQL action
 */
export function exprFromSql(
  sql: {[string]: any},
  types: {[string]: Array<string>}
): ExprFromSqlAction {
  return {type: EXPR_FROM_SQL, sql, types};
}

/**
 * @param optimization - a string denoting the type of optimization performed
 * @return a new ENABLE_OPTIMIZATION action
 */
export function enableOptimization(
  optimization: string
): EnableOptimizationAction {
  return {type: ENABLE_OPTIMIZATION, optimization};
}

/**
 * @return a new DISABLE_OPTIMIZATION action
 */
export function disableOptimization(): DisableOptimizationAction {
  return {type: DISABLE_OPTIMIZATION};
}

export type State = {
  expr: {[string]: any},
  unoptimizedExpr?: {[string]: any},
};

const initialState = {
  expr: {},
};

const opMap = {
  '=': '$eq',
  '!=': '$ne',
  '>': '$gt',
  '>=': '$gte',
  '<': '$lt',
  '<=': '$lte',
};

/**
 * @param exprList - the current expression list
 * @param expr - a new expression to append to the list
 * @param types - an object mapping table names to lists of columns
 * @param tables - all tables used in the expression
 */
function addToExpr(
  exprList: Array<any>,
  expr: {[string]: any},
  types: {[string]: Array<string>},
  tables: Array<string>
) {
  const converted = convertExpr(expr, types, tables);
  if (Array.isArray(converted)) {
    exprList.push(...converted);
  } else {
    exprList.push(converted);
  }
}

/**
 * @param expr - a parsed expression from a SQL query
 * @param types - an object mapping table names to lists of columns
 * @param tables - all tables used in the expression
 * @return a relational algebra expression object
 */
function convertExpr(
  expr: {[string]: any},
  types: {[string]: Array<string>},
  tables: Array<string>
): {[string]: any} {
  switch (expr.type) {
    case 'AndExpression':
      // Collect all expressions on either side of the AND
      let and: Array<any> = [];
      if (expr.left.type === 'AndExpression') {
        addToExpr(and, expr.left.left, types, tables);
        addToExpr(and, expr.left.right, types, tables);
      } else {
        addToExpr(and, expr.left, types, tables);
      }

      addToExpr(and, expr.right, types, tables);

      return {and: {clauses: and}};

    case 'OrExpression':
      // Collect all expressions on either side of the AND
      let or: Array<any> = [];
      addToExpr(or, expr.left, types, tables);
      addToExpr(or, expr.right, types, tables);

      return {or: {clauses: or}};

    case 'NotExpression':
      return {not: {clause: convertExpr(expr.value, types, tables)}};

    case 'SimpleExprParentheses':
      if (
        expr.value.type === 'ExpressionList' &&
        expr.value.value.length === 1
      ) {
        return convertExpr(expr.value.value[0], types, tables);
      } else {
        throw new Error(
          'Parenthesized expressions can only contain a single value'
        );
      }

    case 'ComparisonBooleanPrimary':
      return {
        cmp: {
          lhs: convertExpr(expr.left, types, tables),
          op: opMap[expr.operator],
          rhs: convertExpr(expr.right, types, tables),
        },
      };

    case 'Identifier':
      // Splt into table, column parts
      let [table, column] = expr.value.split('.');
      if (!column) {
        column = table;
        table = undefined;
      }

      if (table) {
        // Ensure the given table exists
        if (!types[table]) {
          throw new Error('Table ' + table + ' not found');
        }

        // Make sure the column of the table exists
        if (!types[table].includes(column)) {
          throw new Error('Column ' + column + ' not found in ' + table);
        }

        if (!tables.includes(table)) {
          throw new Error('Table ' + table + ' is not referenced in query');
        }

        return expr.value;
      } else {
        // Find all tables which contain the column
        const columnTables = [];
        for (const table of tables) {
          if (types[table].includes(column)) {
            columnTables.push(table);
          }
        }

        // Check if the column was found in any table
        if (!columnTables.length) {
          throw new Error('Column  ' + column + ' not found');
        }

        // Ensure the column was found in only one table
        if (columnTables.length > 1) {
          throw new Error('Column ' + column + ' is ambiguous');
        }

        return column;
      }

    case 'Number':
      // For literals, just return the value object as-is
      return expr.value;

    case 'String':
      // If needed, strip quotes
      if (
        expr.value &&
        typeof expr.value === 'string' &&
        expr.value.length > 1 &&
        (expr.value[0] === "'" || expr.value[0] === '"') &&
        expr.value.charAt(expr.value.length - 1) === expr.value[0]
      ) {
        return expr.value.slice(1, -1);
      } else {
        return expr.value;
      }

    default:
      console.log(expr);
      // Produce an error if the expression is unsupported
      throw new Error('Invalid expression.');
  }
}

/**
 * @param sql - a parsed SQL query
 * @param types - an object mapping table names to lists of columns
 * @param tables - all tables used in the expression
 * @return a relational algebra expression object representing the query
 */
function buildRelExp(
  sql: {[string]: any},
  types: {[string]: Array<string>},
  tables: Array<string>
): {[string]: any} {
  switch (sql.type) {
    case 'Except':
    case 'Intersect':
    case 'Union':
      const distinct = (sql.distinctOpt || '').toUpperCase();
      if (distinct && distinct !== 'ALL') {
        throw new Error('Invalid distinct option');
      }

      const setType = sql.type.toLowerCase();

      // Ensure we use a different set of tables for each side
      const setTablesBackup = tables.slice();
      const leftSetExp = buildRelExp(sql.left, types, tables);
      const rightSetExp = buildRelExp(sql.right, types, setTablesBackup);

      return {
        [setType]: {
          left: leftSetExp,
          right: rightSetExp,
          distinct: !distinct,
        },
      };

    case 'Select':
      // Ensure we have a FROM clause
      if (!sql.from) {
        throw new Error('A FROM clause must be specified.');
      }

      // Build an expression for everything in the FROM clause
      let from = sql.from.value.map((v) => buildRelExp(v, types, tables));
      if (from.length !== 1) {
        throw new Error('Only single table queries currently supported.');
      }

      // Wrap the table in a selection operator if there are any conditions
      if (sql.where) {
        from = [
          {
            selection: {
              arguments: {select: convertExpr(sql.where, types, tables)},
              children: from,
            },
          },
        ];
      }

      // Add projections as needed for the SELECT clause
      const select = sql.selectItems.value;
      if (select.length === 1 && select[0].value === '*') {
        // Don't project anything if SELECT * is used
        return from[0];
      } else {
        const project = select.map((field) =>
          convertExpr(field, types, tables)
        );
        const projection = {
          projection: {
            arguments: {project},
            children: from,
          },
        };

        // Check for any aliased columns (e.g. SELECT foo AS bar...)
        const rename = select
          .filter((field) => field.hasAs)
          .map((field) => [field.value, field.alias]);
        if (rename.length === 0) {
          // Don't add a rename if not needed
          return projection;
        } else {
          // Perform any necessary renames
          return {
            rename: {
              arguments: {rename: fromEntries(rename)},
              children: [projection],
            },
          };
        }
      }

    case 'TableReference':
      return buildRelExp(sql.value, types, tables);

    case 'TableFactor':
      // Store this table as one referenced by the query
      tables.push(sql.value.value);

      return {relation: sql.value.value};

    case 'InnerCrossJoinTable':
      // Add the condition if it exists
      if (sql.condition) {
        return {
          join: {
            left: buildRelExp(sql.left, types, tables),
            right: buildRelExp(sql.right, types, tables),
            type: 'inner',
            condition: convertExpr(sql.condition.value, types, tables),
          },
        };
      } else {
        return {
          product: {
            left: buildRelExp(sql.left, types, tables),
            right: buildRelExp(sql.right, types, tables),
          },
        };
      }

    case 'LeftRightJoinTable':
      // Add the condition if it exists
      if (sql.condition) {
        return {
          join: {
            left: buildRelExp(sql.left, types, tables),
            right: buildRelExp(sql.right, types, tables),
            type: sql.leftRight.toLowerCase(),
            condition: convertExpr(sql.condition.value, types, tables),
          },
        };
      } else {
        throw new Error('Condition-less ' + sql.leftRight + ' Join');
      }

    default:
      throw new Error('Unsupported statement ' + sql.type + '.');
  }
}

/**
 * Returns a join expression, with the given left, right and join configurations
 * @param left config
 * @param right config
 * @param join config
 * @returns {{join: {condition: {cmp: {op, lhs, rhs}}, left: {[p: string]: *}, right: {[p: string]: *}, type: *}}}
 */
function joinExpr(
  left: {[string]: any},
  right: {[string]: any},
  join: {[string]: any}
) {
  return {
    join: {
      left: left,
      right: right,
      type: join.type,
      condition: {
        cmp: {
          lhs: join.condition.cmp.lhs,
          op: join.condition.cmp.op,
          rhs: join.condition.cmp.rhs,
        },
      },
    },
  };
}

/**
 * Optimizes a given relational algebra expression, if possible
 * @param type string denoting the type of optimization
 * @param expr object denoting the expression to optimize
 * @returns {{join: {condition: {cmp: {op, lhs, rhs}}, left: {[p: string]: *}, right: {[p: string]: *}, type: *}}|{[p: string]: *}}
 */
function optimize(type: string, expr: {[string]: any}) {
  switch (type) {
    case 'join':
      const selectChildren = 'selection' in expr ? expr.selection.children : [];
      for (const child of selectChildren) {
        if ('join' in child) {
          // relation names
          let selectLeft =
            expr.selection.arguments.select.cmp.lhs.split('.')[0];
          let selectRight =
            expr.selection.arguments.select.cmp.rhs.split('.')[0];
          let joinLeft = child.join.left.relation;
          let joinRight = child.join.right.relation;

          if (selectLeft === joinLeft || selectRight === joinLeft) {
            let left = {
              selection: {
                arguments: expr.selection.arguments,
                children: [
                  {
                    relation: child.join.left.relation,
                  },
                ],
              },
            };
            let right = child.join.right;
            let join = child.join;
            return joinExpr(left, right, join);
          } else if (selectLeft === joinRight || selectRight === joinRight) {
            let left = child.join.left;
            let right = {
              selection: {
                arguments: expr.selection.arguments,
                children: [
                  {
                    relation: child.join.right.relation,
                  },
                ],
              },
            };
            let join = child.join;
            return joinExpr(left, right, join);
          }
        } else {
          return expr;
        }
      }
      return expr;
    default:
      return expr;
  }
}

const reducer: (
  State,
  ExprFromSqlAction | EnableOptimizationAction | DisableOptimizationAction
) => State = produce<
  State,
  ExprFromSqlAction | EnableOptimizationAction | DisableOptimizationAction
>(
  (
    draft: State,
    action:
      | ExprFromSqlAction
      | EnableOptimizationAction
      | DisableOptimizationAction
  ) => {
    // eslint-disable-next-line default-case
    switch (action.type) {
      case EXPR_FROM_SQL:
        draft.expr = buildRelExp(action.sql, action.types, []);
        break;
      case ENABLE_OPTIMIZATION:
        draft.unoptimizedExpr = draft.expr;
        draft.expr = optimize(action.optimization, draft.expr);
        break;
      case DISABLE_OPTIMIZATION:
        if (draft.unoptimizedExpr) {
          draft.expr = draft.unoptimizedExpr;
          delete draft.unoptimizedExpr;
        }
    }
  },
  initialState
);

export default reducer;
