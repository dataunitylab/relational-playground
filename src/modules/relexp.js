// @flow
import fromEntries from 'fromentries';
import produce from 'immer';

export const EXPR_FROM_SQL = 'EXPR_FROM_SQL';

type Action = {
  type: 'EXPR_FROM_SQL',
  sql: {[string]: any},
  types: {[string]: Array<string>},
};

/**
 * @param sql - a parsed SQL query
 * @param types - an object mapping table names to lists of columns
 * @return a new EXPR_FROM_SQL action
 */
export function exprFromSql(
  sql: {[string]: any},
  types: {[string]: Array<string>}
): Action {
  return {type: EXPR_FROM_SQL, sql, types};
}

type State = {
  expr: {[string]: any},
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
) {
  switch (expr.type) {
    case 'AndExpression':
      // Collect all expressions on either side of the AND
      let and: Array<any> = [];
      addToExpr(and, expr.left, types, tables);
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
      let ret = {};
      ret.lhs = convertExpr(expr.left, types, tables);
      ret.op = opMap[expr.operator];
      ret.rhs = convertExpr(expr.right, types, tables);
      return {cmp: ret};

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
function buildRelExp(sql, types, tables) {
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
      const join = {
        join: {
          left: buildRelExp(sql.left, types, tables),
          right: buildRelExp(sql.right, types, tables),
        },
      };

      // Add the join condition if it exists
      if (sql.condition) {
        return {
          selection: {
            arguments: {
              select: convertExpr(sql.condition.value, types, tables),
            },
            children: [join],
          },
        };
      }

      return join;

    default:
      throw new Error('Unsupported statement ' + sql.type + '.');
  }
}

export default produce<State, Action>((draft: State, action: Action) => {
  // eslint-disable-next-line default-case
  switch (action.type) {
    case EXPR_FROM_SQL:
      draft.expr = buildRelExp(action.sql, action.types, []);
      break;
  }
}, initialState);
