// @flow
import fromEntries from 'fromentries';
import {produce} from 'immer';
import {joinOrderOptimization} from './joinOrderOptimization';
import {constructRelationalGraph} from './constructRelationalGraph';

export const EXPR_FROM_SQL = 'EXPR_FROM_SQL';
export const ENABLE_OPTIMIZATION = 'ENABLE_OPTIMIZATION';
export const DISABLE_OPTIMIZATION = 'DISABLE_OPTIMIZATION';

// Supported aggregate functions
export const SUPPORTED_AGGREGATE_FUNCTIONS = [
  'MAX',
  'MIN',
  'AVG',
  'SUM',
  'COUNT',
  'STDEV',
];

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

export type OrderByColumn = {
  column_name: string,
  ascending: boolean,
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
  optimized?: true,
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
 * Normalizes column names for comparison by extracting the base column name
 * @param columnName - column name (could be qualified like "Doctor.departmentId" or unqualified like "departmentId")
 * @return the base column name without table qualification
 */
function normalizeColumnName(columnName: string): string {
  if (typeof columnName !== 'string') {
    return columnName;
  }
  const parts = columnName.split('.');
  return parts[parts.length - 1]; // Return the last part (column name)
}

/**
 * @param expr - a parsed expression from a SQL query
 * @param types - an object mapping table names to lists of columns
 * @param tables - all tables used in the expression
 * @return a relational algebra expression object
 */
/**
 * Extracts aggregate functions used in a HAVING expression
 * @param expr - the HAVING expression to analyze
 * @return array of aggregate objects
 */
function extractHavingAggregates(expr: {
  [string]: any,
}): Array<{[string]: any}> {
  const aggregates: Array<{[string]: any}> = [];

  switch (expr.type) {
    case 'FunctionCall':
      const funcName = expr.name.toUpperCase();
      if (SUPPORTED_AGGREGATE_FUNCTIONS.includes(funcName)) {
        let param;
        if (expr.params[0] === '*') {
          param = '*';
        } else {
          // For now, assume it's a simple column reference
          param = expr.params[0].value || expr.params[0];
        }
        aggregates.push({
          aggregate: {
            function: funcName,
            column: param,
          },
        });
      }
      return aggregates;

    case 'ComparisonBooleanPrimary':
      aggregates.push(...extractHavingAggregates(expr.left));
      aggregates.push(...extractHavingAggregates(expr.right));
      return aggregates;

    case 'AndExpression':
    case 'OrExpression':
      aggregates.push(...extractHavingAggregates(expr.left));
      aggregates.push(...extractHavingAggregates(expr.right));
      return aggregates;

    case 'BetweenPredicate':
      aggregates.push(...extractHavingAggregates(expr.left));
      aggregates.push(...extractHavingAggregates(expr.right.left));
      aggregates.push(...extractHavingAggregates(expr.right.right));
      return aggregates;

    default:
      return aggregates;
  }
}

/**
 * Converts a HAVING expression to work with the grouped/aggregated column names
 * @param expr - the HAVING expression to convert
 * @param types - an object mapping table names to lists of columns
 * @param tables - all tables used in the expression
 * @return a condition expression for selection after GROUP BY
 */
function convertHavingExpr(
  expr: {[string]: any},
  types: {[string]: Array<string>},
  tables: Array<string>
): {[string]: any} {
  switch (expr.type) {
    case 'ComparisonBooleanPrimary':
      return {
        cmp: {
          lhs: convertHavingValue(expr.left, types, tables),
          op: opMap[expr.operator],
          rhs: convertHavingValue(expr.right, types, tables),
        },
      };

    case 'AndExpression':
      return {
        and: {
          clauses: [
            convertHavingExpr(expr.left, types, tables),
            convertHavingExpr(expr.right, types, tables),
          ],
        },
      };

    case 'OrExpression':
      return {
        or: {
          clauses: [
            convertHavingExpr(expr.left, types, tables),
            convertHavingExpr(expr.right, types, tables),
          ],
        },
      };

    case 'BetweenPredicate':
      const lhs = convertHavingValue(expr.left, types, tables);
      return {
        and: {
          clauses: [
            {
              cmp: {
                lhs,
                op: '$gte',
                rhs: convertHavingValue(expr.right.left, types, tables),
              },
            },
            {
              cmp: {
                lhs,
                op: '$lte',
                rhs: convertHavingValue(expr.right.right, types, tables),
              },
            },
          ],
        },
      };

    default:
      throw new Error(`Unsupported HAVING expression type: ${expr.type}`);
  }
}

/**
 * Converts a value in a HAVING expression (could be aggregate, column, or literal)
 */
function convertHavingValue(
  expr: {[string]: any},
  types: {[string]: Array<string>},
  tables: Array<string>
): string {
  if (typeof expr === 'string' || typeof expr === 'number') {
    return expr.toString();
  }

  switch (expr.type) {
    case 'FunctionCall':
      // Convert aggregate function to column name
      const funcName = expr.name.toUpperCase();
      let param;
      if (expr.params[0] === '*') {
        param = '*';
      } else {
        param = convertHavingValue(expr.params[0], types, tables);
      }
      return `${funcName}(${param})`;

    case 'Identifier':
      // Convert column reference to actual column name
      return expr.value;

    case 'Number':
    case 'String':
      return expr.value;

    default:
      throw new Error(`Unsupported HAVING value type: ${expr.type}`);
  }
}

/**
 * Validates that a HAVING expression only uses aggregate functions or GROUP BY columns
 * @param expr - the expression to validate
 * @param groupByColumns - columns that are in the GROUP BY clause (converted expressions)
 * @return true if valid, throws error if invalid
 */
function validateHavingExpression(
  expr: {[string]: any},
  groupByColumns: Array<string>
): boolean {
  switch (expr.type) {
    case 'FunctionCall':
      const funcName = expr.name.toUpperCase();
      if (SUPPORTED_AGGREGATE_FUNCTIONS.includes(funcName)) {
        return true; // Aggregate functions are allowed
      }
      throw new Error(
        `Function '${expr.name}' is not allowed in HAVING clause`
      );

    case 'Identifier':
      const normalizedColumn = normalizeColumnName(expr.value);
      const isInGroupBy = groupByColumns.some(
        (groupCol) => normalizeColumnName(groupCol) === normalizedColumn
      );
      if (!isInGroupBy) {
        throw new Error(
          `Column '${expr.value}' in HAVING clause must appear in the GROUP BY clause or be used in an aggregate function`
        );
      }
      return true;

    case 'Number':
    case 'String':
      return true; // Literals are allowed

    case 'ComparisonBooleanPrimary':
      validateHavingExpression(expr.left, groupByColumns);
      validateHavingExpression(expr.right, groupByColumns);
      return true;

    case 'AndExpression':
    case 'OrExpression':
      validateHavingExpression(expr.left, groupByColumns);
      validateHavingExpression(expr.right, groupByColumns);
      return true;

    case 'BetweenPredicate':
      validateHavingExpression(expr.left, groupByColumns);
      validateHavingExpression(expr.right.left, groupByColumns);
      validateHavingExpression(expr.right.right, groupByColumns);
      return true;

    default:
      throw new Error(
        `Unsupported expression type '${expr.type}' in HAVING clause`
      );
  }
}

function convertExpr(
  expr: {[string]: any},
  types: {[string]: Array<string>},
  tables: Array<string>
): {[string]: any} {
  switch (expr.type) {
    case 'BetweenPredicate':
      const lhs = convertExpr(expr.left, types, tables);
      return {
        and: {
          clauses: [
            {
              cmp: {
                lhs,
                op: '$gte',
                rhs: convertExpr(expr.right.left, types, tables),
              },
            },
            {
              cmp: {
                lhs,
                op: '$lte',
                rhs: convertExpr(expr.right.right, types, tables),
              },
            },
          ],
        },
      };

    case 'AndExpression':
      // Collect all expressions on either side of the AND
      let and: Array<any> = [];
      let exprLeft = Object.assign({}, expr);
      let exprRight: Array<any> = [];
      while (exprLeft.type === 'AndExpression') {
        exprRight.unshift(exprLeft.right);
        exprLeft = exprLeft.left;
      }
      addToExpr(and, exprLeft, types, tables);
      exprRight.forEach((element) => addToExpr(and, element, types, tables));

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

    case 'OrderBy':
      const values = [];
      for (const value of expr.value) {
        values.push(convertExpr(value, types, tables));
      }
      return {
        order_by: values,
      };

    case 'GroupByOrderByItem':
      return {
        column_name: convertExpr(expr.value, types, tables),
        ascending: (expr.sortOpt || 'ASC').toUpperCase() === 'ASC',
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

    case 'InExpressionListPredicate':
      if (expr.right.type !== 'ExpressionList') {
        // Currently IN expressions are only supported with lists of values
        throw new Error('Query not supported');
      }

      let orIn: Array<any> = [];
      for (const inSetElem of expr.right.value) {
        const inExpr = {
          type: 'ComparisonBooleanPrimary',
          left: expr.left,
          operator: '=',
          right: inSetElem,
        };
        addToExpr(orIn, inExpr, types, tables);
      }
      const inOrExpr = {or: {clauses: orIn}};

      if (expr.hasNot === 'NOT') {
        return {not: {clause: inOrExpr}};
      } else {
        return inOrExpr;
      }

    case 'FunctionCall':
      // Handle aggregate functions like MAX, MIN, AVG, SUM
      const funcName = expr.name.toUpperCase();
      if (!SUPPORTED_AGGREGATE_FUNCTIONS.includes(funcName)) {
        throw new Error('Unsupported aggregate function: ' + expr.name);
      }

      if (expr.params.length !== 1) {
        throw new Error('Aggregate functions must have exactly one parameter');
      }

      // Handle special case for COUNT(*)
      let param;
      if (expr.params[0] === '*') {
        param = '*';
      } else {
        const paramObj = convertExpr(expr.params[0], types, tables);
        param =
          typeof paramObj === 'string' ? paramObj : JSON.stringify(paramObj);
      }

      return {
        aggregate: {
          function: funcName,
          column: param,
        },
      };

    default:
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

      // Check for aggregates in SELECT clause (with or without GROUP BY)
      const select = sql.selectItems.value;
      const hasAggregates = select.some((field) => containsAggregate(field));

      // Helper function to check if a field contains aggregates without converting
      function containsAggregate(field: any): boolean {
        if (!field || typeof field !== 'object') return false;

        // Direct function call
        if (field.type === 'FunctionCall') {
          const funcName = field.name?.toUpperCase?.();
          return SUPPORTED_AGGREGATE_FUNCTIONS.includes(funcName);
        }

        // Check nested structures recursively
        if (field.value && typeof field.value === 'object') {
          return containsAggregate(field.value);
        }

        return false;
      }

      // Add group by operator if there's a GROUP BY clause OR aggregates are present
      if (sql.groupBy || hasAggregates) {
        // Now we need to convert expressions for validation and GROUP BY processing
        const aggregates = [];
        const groupColumns = [];

        for (const field of select) {
          const converted = convertExpr(field, types, tables);
          if (
            converted &&
            typeof converted === 'object' &&
            converted.aggregate
          ) {
            aggregates.push(converted);
          } else {
            groupColumns.push(converted);
          }
        }
        let groupByColumns: Array<string> = [];

        if (sql.groupBy) {
          groupByColumns = sql.groupBy.value.map((item) =>
            convertExpr(item.value, types, tables)
          );
        }

        // Validate GROUP BY rules: all non-aggregate SELECT columns must be in GROUP BY
        if (aggregates.length > 0 && groupColumns.length > 0) {
          for (const selectColumn of groupColumns) {
            const selectColumnStr =
              typeof selectColumn === 'string'
                ? selectColumn
                : JSON.stringify(selectColumn);
            const normalizedSelectColumn = normalizeColumnName(selectColumnStr);
            const isInGroupBy = groupByColumns.some(
              (groupCol) =>
                normalizeColumnName(groupCol) === normalizedSelectColumn
            );

            if (!isInGroupBy) {
              throw new Error(
                `Column '${selectColumnStr}' must appear in the GROUP BY clause or be used in an aggregate function`
              );
            }
          }
        }

        // Validate ORDER BY rules when GROUP BY is present
        if (sql.orderBy) {
          const orderByColumns = sql.orderBy.value;
          for (const orderCol of orderByColumns) {
            const orderColumn = convertExpr(orderCol.value, types, tables);
            // Check if the ORDER BY column is either in GROUP BY or is an aggregate
            const isAggregate =
              orderColumn &&
              typeof orderColumn === 'object' &&
              orderColumn.aggregate;

            if (!isAggregate) {
              const orderColumnStr =
                typeof orderColumn === 'string'
                  ? orderColumn
                  : JSON.stringify(orderColumn);
              const normalizedOrderColumn = normalizeColumnName(orderColumnStr);
              const isInGroupBy = groupByColumns.some(
                (groupCol) =>
                  normalizeColumnName(groupCol) === normalizedOrderColumn
              );

              if (!isInGroupBy) {
                throw new Error(
                  `Column '${orderColumnStr}' in ORDER BY clause must appear in the GROUP BY clause or be used in an aggregate function`
                );
              }
            }
          }
        }

        // Extract aggregates from HAVING clause if it exists
        let havingAggregates: Array<{[string]: any}> = [];
        if (sql.having) {
          havingAggregates = extractHavingAggregates(sql.having);
        }

        // Combine SELECT aggregates with HAVING aggregates, removing duplicates
        const allAggregates = [...aggregates];
        for (const havingAgg of havingAggregates) {
          const isDuplicate = allAggregates.some(
            (selectAgg) =>
              selectAgg.aggregate.function === havingAgg.aggregate.function &&
              selectAgg.aggregate.column === havingAgg.aggregate.column
          );
          if (!isDuplicate) {
            allAggregates.push(havingAgg);
          }
        }

        from = [
          {
            group_by: {
              arguments: {
                groupBy: groupByColumns,
                aggregates: allAggregates, // Include both SELECT and HAVING aggregates
                selectColumns: groupColumns, // Non-aggregate columns from SELECT
              },
              children: from,
            },
          },
        ];

        // Add HAVING clause if it exists
        if (sql.having) {
          // Validate HAVING expression
          validateHavingExpression(sql.having, groupByColumns);

          // Apply HAVING as a selection (restriction) operation after GROUP BY
          from = [
            {
              selection: {
                arguments: {
                  select: convertHavingExpr(sql.having, types, tables),
                },
                children: from,
              },
            },
          ];

          // If HAVING clause introduced additional aggregates not in SELECT,
          // add a projection to only return the originally requested columns
          const extraHavingAggregates = havingAggregates.filter((havingAgg) => {
            return !aggregates.some(
              (selectAgg) =>
                selectAgg.aggregate.function === havingAgg.aggregate.function &&
                selectAgg.aggregate.column === havingAgg.aggregate.column
            );
          });

          if (extraHavingAggregates.length > 0) {
            const originalColumns = groupColumns.map((col) =>
              typeof col === 'string' ? col : JSON.stringify(col)
            ); // Non-aggregate SELECT columns

            // Add aggregate columns that were in the original SELECT
            for (const agg of aggregates) {
              const columnName = `${agg.aggregate.function}(${agg.aggregate.column})`;
              originalColumns.push(columnName);
            }

            from = [
              {
                projection: {
                  arguments: {project: originalColumns},
                  children: from,
                },
              },
            ];
          }
        }
      }

      if (sql.orderBy) {
        from = [
          {
            order_by: {
              arguments: convertExpr(sql.orderBy, types, tables),
              children: from,
            },
          },
        ];
      }

      // Add projections as needed for the SELECT clause

      // If GROUP BY is used or aggregates are present, return from without additional projection
      if (sql.groupBy || hasAggregates) {
        return from[0];
      }

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
              arguments: {rename: {columns: fromEntries(rename)}},
              children: [projection],
            },
          };
        }
      }

    case 'SubQuery':
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
 * Optimizes a given relational algebra expression, if possible
 * @param type string denoting the type of optimization
 * @param expr object denoting the expression to optimize
 * @returns {{join: {condition: {cmp: {op, lhs, rhs}}, left: {[p: string]: *}, right: {[p: string]: *}, type: *}}|{[p: string]: *}}
 */
function optimize(type: string, expr: {[key: string]: any}) {
  switch (type) {
    case 'join':
      const {graph, globalSelections, canOptimize} =
        constructRelationalGraph(expr);
      if (!canOptimize) return expr;
      const optimizedExpr = joinOrderOptimization(graph, globalSelections);
      return optimizedExpr;
    default:
      return expr;
  }
}

const reducer = (
  state: State = initialState,
  action:
    | ExprFromSqlAction
    | EnableOptimizationAction
    | DisableOptimizationAction
): State => {
  return produce(state, (draft: State) => {
    // eslint-disable-next-line default-case
    switch (action.type) {
      case EXPR_FROM_SQL:
        draft.expr = buildRelExp(action.sql, action.types, []);
        delete draft.unoptimizedExpr;
        delete draft.optimized;
        break;
      case ENABLE_OPTIMIZATION:
        draft.unoptimizedExpr = draft.expr;
        draft.expr = optimize(action.optimization, draft.expr);
        draft.optimized = true;
        break;
      case DISABLE_OPTIMIZATION:
        if (draft.unoptimizedExpr) {
          draft.expr = draft.unoptimizedExpr;
          delete draft.unoptimizedExpr;
        }
        delete draft.optimized;
    }
  });
};

export default reducer;
