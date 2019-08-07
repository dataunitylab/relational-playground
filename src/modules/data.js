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

function resolveColumn(path: string, row: {[string]: any}): string {
  let [table, column] = path.split('.');
  if (!column) {
    column = table;
    table = undefined;
  }

  if (table) {
    if (row.hasOwnProperty(path)) {
      // Use the dotted path
      return path;
    } else if (row.hasOwnProperty(column)) {
      // Use the column name without the table qualifier
      return column;
    }
  }

  const columns = [];
  for (const rowCol in row) {
    if (rowCol === column || rowCol.endsWith('.' + column)) {
      columns.push(rowCol);
    }
  }

  // Ensure we find the correct column
  if (columns.length === 1) {
    return columns[0];
  }

  throw new Error('Invalid column ' + path);
}

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
      const columns = projData.columns.map(col =>
        resolveColumn(col, projData.data[0])
      );
      const deleted = columns.filter(
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
          const col = resolveColumn(Object.keys(select[i])[0], item);
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
              // eslint-disable-next-line eqeqeq
              keep = keep && item[col] != select[i][col][op];
              break;
            case '$eq':
              // eslint-disable-next-line eqeqeq
              keep = keep && item[col] == select[i][col][op];
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
        // Ensure target name is a string
        if (typeof to !== 'string') {
          throw new Error('Invalid target for rename');
        }

        // Add a new column with the new name
        const fromColumn = resolveColumn(from, renData.data[0]);
        renData.columns[renData.columns.indexOf(fromColumn)] = to;

        // Copy all column data and delete the original column
        for (let j = 0; j < renData.data.length; j++) {
          renData.data[j][to] = renData.data[j][fromColumn];
          delete renData.data[j][fromColumn];
        }
      });
      return renData;

    case 'relation':
      // Make a copy of the data from a source table and return it
      return JSON.parse(JSON.stringify(sourceData[expr.relation]));

    case 'join':
      // Process each side of the join
      const left = applyExpr(expr.join.left, sourceData);
      const right = applyExpr(expr.join.right, sourceData);

      // Combine columns adding relation name where needed
      const combinedColumns: Array<string> = [];
      for (const leftColumn of left.columns) {
        if (right.columns.includes(leftColumn)) {
          combinedColumns.push(left.name + '.' + leftColumn);
        } else {
          combinedColumns.push(leftColumn);
        }
      }
      for (const rightColumn of right.columns) {
        if (left.columns.includes(rightColumn)) {
          combinedColumns.push(right.name + '.' + rightColumn);
        } else {
          combinedColumns.push(rightColumn);
        }
      }

      const output = {
        name: left.name + ' × ' + right.name,
        columns: combinedColumns,
        data: [],
      };

      // Perform the cross product
      for (const leftRow of left.data) {
        for (const rightRow of right.data) {
          // Combine data from the two objects including the relation name
          const combinedData = {};
          for (const leftKey in leftRow) {
            combinedData[left.name + '.' + leftKey] = leftRow[leftKey];
          }
          for (const rightKey in rightRow) {
            combinedData[right.name + '.' + rightKey] = rightRow[rightKey];
          }

          // Resolve the output data according to the combined data
          // This may remove relation names where they are not needed
          const outputData = {};
          for (const column of combinedColumns) {
            outputData[column] =
              combinedData[resolveColumn(column, combinedData)];
          }

          output.data.push(outputData);
        }
      }

      return output;

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
