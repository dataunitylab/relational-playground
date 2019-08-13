// @flow
import fromEntries from 'fromentries';

export const EXPR_FROM_SQL = 'EXPR_FROM_SQL';

type Action = {
  type: 'EXPR_FROM_SQL',
  sql: {[string]: any},
  types: {[string]: Array<string>},
};

/**
 * @param sql - a parsed SQL query
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
 * @param and - the current expression list
 * @param expr - a new expression to append to the list
 */
function addToAnd(
  and: Array<any>,
  expr: {[string]: any},
  types: {[string]: Array<string>},
  tables: Array<string>
) {
  const converted = convertExpr(expr.left, types, tables);
  if (Array.isArray(converted)) {
    and = and.concat(converted);
  } else {
    and.push(converted);
  }
}

/**
 * @param expr - a parsed expression from a SQL query
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
      addToAnd(and, expr.left, types, tables);
      addToAnd(and, expr.right, types, tables);

      return and;

    case 'ComparisonBooleanPrimary':
      let ret = {};
      ret[(convertExpr(expr.left, types, tables): any)] = {
        [opMap[expr.operator]]: convertExpr(expr.right, types, tables),
      };
      return [ret];

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
        if (tables.length > 1) {
          throw new Error('Column ' + column + ' is ambiguous');
        }

        return column;
      }

    case 'Number':
    case 'String':
      // For literals, just return the value object as-is
      return expr.value;

    default:
      // Produce an error if the expression is unsupported
      throw new Error('Invalid expression.');
  }
}

/**
 * @param sql - a parsed SQL query
 * @return a relational algebra expression object representing the query
 */
function buildRelExp(sql, types, tables) {
  switch (sql.type) {
    case 'Select':
      // Build an expression for everything in the FROM clause
      let from = sql.from.value.map(v => buildRelExp(v, types, tables));
      if (from.length > 1) {
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
        const project = select.map(field => convertExpr(field, types, tables));
        const projection = {
          projection: {
            arguments: {project},
            children: from,
          },
        };

        // Check for any aliased columns (e.g. SELECT foo AS bar...)
        const rename = select
          .filter(field => field.hasAs)
          .map(field => [field.value, field.alias]);
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
      return {
        join: {
          left: buildRelExp(sql.left, types, tables),
          right: buildRelExp(sql.right, types, tables),
        },
      };

    default:
      throw new Error('Unsupported statement ' + sql.type + '.');
  }
}

export default (state: State = initialState, action: Action) => {
  switch (action.type) {
    case EXPR_FROM_SQL:
      return {
        ...state,
        expr: buildRelExp(action.sql, action.types, []),
      };
    default:
      return {
        ...state,
      };
  }
};
