// @flow
export const CHANGE_EXPR = 'CHANGE_EXPR';

type Action = {type: 'CHANGE_EXPR', expr: {[string]: any}};

/**
 * @param expr - a relational algebra expression object
 * @return a new CHANGE_EXPR action
 */
export function changeExpr(expr: {[string]: any}): Action {
  return {type: CHANGE_EXPR, expr};
}

export type Data = {
  name: string,
  columns: Array<string>,
  data: Array<{[string]: any}>,
};

export type State = {
  current?: Data,
  sourceData: {[string]: Data},
};

// Source data which can be used in SQL queries
const initialState = {
  sourceData: {
    Doctor: {
      name: 'Doctor',
      columns: ['firstName', 'lastName', 'salary'],
      data: [
        {firstName: 'Alice', lastName: 'Yang', salary: 176000},
        {firstName: 'Bob', lastName: 'Smith', salary: 120000},
      ],
    },

    Patient: {
      name: 'Patient',
      columns: ['firstName', 'lastName'],
      data: [
        {firstName: 'Carlos', lastName: 'Vasquez'},
        {firstName: 'Xu', lastName: 'Xing'},
      ],
    },
  },
};

/**
 * @param expr - a relational algebra expression to evaluate
 * @param sourceData - source data from relations
 * @return result of evaluating the expression
 */
function applyExpr(expr, sourceData) {
  switch (Object.keys(expr)[0]) {
    case 'projection':
      // Evaluate the single child of this expression
      let projData = applyExpr(expr.projection.children[0], sourceData);

      // Get the columns which should be deleted
      const deleted = projData.columns.filter(
        column => expr.projection.arguments.project.indexOf(column) === -1
      );

      // Make a copy of the list of columns to project
      projData.columns = expr.projection.arguments.project.slice();

      // Delete data values which should not be included
      for (let i = 0; i < deleted.length; i++) {
        for (let j = 0; j < projData.data.length; j++) {
          delete projData.data[j][deleted[i]];
        }
      }
      return projData;

    case 'selection':
      // Evaluate the single child of this expression
      let selData = applyExpr(expr.selection.children[0], sourceData);

      let select = expr.selection.arguments.select;
      selData.data = selData.data.filter(item => {
        let keep = true;

        // Loop over all expressions to be evaluauted
        for (var i = 0; keep && i < select.length; i++) {
          // Get the column to compare and the comparison operator
          const col = Object.keys(select[i])[0];
          const op = Object.keys(select[i][col])[0];

          // Update the flag indicating whether we should keep this tuple
          switch (op) {
            case '$gte':
              keep = keep && item[col] >= select[i][col][op];
              break;
            case '$gt':
              keep = keep && item[col] > select[i][col][op];
              break;
            case '$lt':
              keep = keep && item[col] < select[i][col][op];
              break;
            case '$lte':
              keep = keep && item[col] <= select[i][col][op];
              break;
            case '$ne':
              keep = keep && item[col] !== select[i][col][op];
              break;
            case '$eq':
              keep = keep && item[col] === select[i][col][op];
              break;
            default:
              throw new Error('Invalid expression');
          }
        }
        return keep;
      });

      return selData;

    case 'rename':
      // Evaluate the single child of this expression
      let renData = applyExpr(expr.rename.children[0], sourceData);

      // Loop over all pairs of things to rename
      Object.entries(expr.rename.arguments.rename).forEach(([from, to]) => {
        // Add a new column with the new name
        renData.columns[renData.columns.indexOf(from)] = to;

        // Copy all column data and delete the original column
        for (let j = 0; j < renData.data.length; j++) {
          renData.data[j][to] = renData.data[j][from];
          delete renData.data[j][from];
        }
      });
      return renData;

    case 'relation':
      // Make a copy of the data from a source table and return it
      return JSON.parse(JSON.stringify(sourceData[expr.relation]));

    default:
      // Fallback in case we get something invalid to show a nice error
      throw new Error('Invalid expression');
  }
}

export default (state: State = initialState, action: Action) => {
  switch (action.type) {
    case CHANGE_EXPR:
      return {
        ...state,
        current: applyExpr(action.expr, state.sourceData),
      };
    default:
      return {
        ...state,
      };
  }
};
