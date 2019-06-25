// @flow
import fromEntries from 'fromentries';

export const EXPR_FROM_SQL = 'EXPR_FROM_SQL';

type Action = {type: 'EXPR_FROM_SQL', sql: {[string]: any}};

/**
 * @param sql - a parsed SQL query
 * @return a new EXPR_FROM_SQL action
 */
export function exprFromSql(sql: {[string]: any}): Action {
  return {type: EXPR_FROM_SQL, sql};
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
function addToAnd(and: Array<any>, expr: {[string]: any}) {
  const converted = convertExpr(expr.left);
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
function convertExpr(expr: {[string]: any}) {
  switch (expr.type) {
    case 'AndExpression':
      // Collect all expressions on either side of the AND
      let and: Array<any> = [];
      addToAnd(and, expr.left);
      addToAnd(and, expr.right);

      return and;

    case 'ComparisonBooleanPrimary':
      let ret = {};
      ret[(convertExpr(expr.left): any)] = {
        [opMap[expr.operator]]: convertExpr(expr.right),
      };
      return [ret];

    case 'Identifier':
    case 'Number':
    case 'String':
      // For literals and identtifiers, just return the value object as-is
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
function buildRelExp(sql) {
  switch (sql.type) {
    case 'Select':
      // Build an expression for everything in the FROM clause
      let from = sql.from.value.map(v => buildRelExp(v));
      if (from.length > 1) {
        throw new Error('Only single table queries currently supported.');
      }

      // Wrap the table in a selection operator if there are any conditions
      if (sql.where) {
        from = [
          {
            selection: {
              arguments: {select: convertExpr(sql.where)},
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
        const project = select.map(field => field.value);
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

    case 'TableRefrence':
      return buildRelExp(sql.value);

    case 'TableFactor':
      return {relation: sql.value.value};

    default:
      throw new Error('Unsupported statement.');
  }
}

export default (state: State = initialState, action: Action) => {
  switch (action.type) {
    case EXPR_FROM_SQL:
      return {
        ...state,
        expr: buildRelExp(action.sql),
      };
    default:
      return {
        ...state,
      };
  }
};
