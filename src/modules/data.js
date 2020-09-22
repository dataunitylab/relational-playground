// @flow
import {deepEqual} from 'fast-equals';
import produce from 'immer';

import patient from '../resources/Patient.json';
import doctor from '../resources/Doctor.json';

export const CHANGE_EXPR = 'CHANGE_EXPR';
export const RESET_EXPR = 'RESET_EXPR';

type ChangeAction = {
  type: 'CHANGE_EXPR',
  expr: {[string]: any},
  element: ?HTMLElement,
};

type ResetAction = {
  type: 'RESET_EXPR',
};

type Action = ChangeAction | ResetAction;

/**
 * @param expr - a relational algebra expression object
 * @param element
 * @return a new CHANGE_EXPR action
 */
export function changeExpr(
  expr: {[string]: any},
  element: ?HTMLElement
): ChangeAction {
  return {type: CHANGE_EXPR, expr, element};
}

export function resetAction(): ResetAction {
  return {type: RESET_EXPR};
}

export type Data = {
  name: string,
  columns: Array<string>,
  data: Array<{[string]: any}>,
};

export type State = {
  current?: Data,
  sourceData: {[string]: Data},
  element: ?HTMLElement,
};

// Source data which can be used in SQL queries
const initialState = {
  sourceData: {
    Doctor: doctor,

    Patient: patient,
  },
  element: undefined,
};

function resolveColumn(path: string, row: {[string]: any}): string {
  // Avoid an error if we're projecting nothing
  if (!row) {
    return path;
  }

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

// Try to resolve a column, otherwise treat it as a literal
function resolveValue(path: string, row: {[string]: any}): string {
  let value = path;
  try {
    value = row[resolveColumn(path, row)];
  } catch {}
  return value;
}

/**
 * @param expr - a relational algebra expression to evaluate
 * @param item - an item to evaluate against
 * @return result of evaluating the expression
 */
function applyItem(expr, item) {
  const type = Object.keys(expr)[0];
  switch (type) {
    case 'cmp':
      // Get the values to compare and the comparison operator
      const lhs = resolveValue(expr.cmp.lhs, item);
      const op = expr.cmp.op;
      let rhs = resolveValue(expr.cmp.rhs, item);

      switch (op) {
        case '$gte':
          return lhs >= rhs;
        case '$gt':
          return lhs > rhs;
        case '$lt':
          return lhs < rhs;
        case '$lte':
          return lhs <= rhs;
        case '$ne':
          // eslint-disable-next-line eqeqeq
          return lhs != rhs;
        case '$eq':
          // eslint-disable-next-line eqeqeq
          return lhs == rhs;
        default:
          throw new Error('Invaid comparison operator');
      }

    case 'and':
      let andResult = true;

      // Loop over all expressions to be evaluated
      for (var i = 0; andResult && i < expr.and.clauses.length; i++) {
        andResult = andResult && applyItem(expr.and.clauses[i], item);
      }
      return andResult;

    case 'or':
      let orResult = false;

      // Loop over all expressions to be evaluated
      for (var i2 = 0; !orResult && i2 < expr.or.clauses.length; i2++) {
        orResult = orResult || applyItem(expr.or.clauses[i2], item);
      }
      return orResult;

    case 'not':
      return !applyItem(expr.not.clause, item);

    default:
      console.log(expr);
      throw new Error('Invalid expression');
  }
}

/**
 * @param expr - a relational algebra expression to evaluate
 * @param sourceData - source data from relations
 * @return result of evaluating the expression
 */
function applyExpr(expr, sourceData) {
  const type = Object.keys(expr)[0];
  switch (type) {
    case 'projection':
      // Evaluate the single child of this expression
      let projData = applyExpr(expr.projection.children[0], sourceData);

      // Get the columns which should be deleted
      const columns = projData.columns.map((col) =>
        resolveColumn(col, projData.data[0])
      );
      const keep = expr.projection.arguments.project.map((col) =>
        resolveColumn(col, projData.data[0])
      );
      const deleted = columns.filter((column) => keep.indexOf(column) === -1);

      // Make a copy of the list of columns to project
      projData.columns = keep;

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
      selData.data = selData.data.filter((item) => applyItem(select, item));

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

    case 'except':
    case 'intersect':
    case 'union':
      // Process each side of the operation
      const setLeft = applyExpr(expr[type].left, sourceData);
      const setRight = applyExpr(expr[type].right, sourceData);

      // Check for valid columns
      if (setLeft.columns.length !== setRight.columns.length) {
        throw new Error(
          'Each side of ' + type + ' must have the same number of columns'
        );
      }

      const outColumns: Array<string> = setLeft.columns.slice();
      const setOutput = {
        name: setLeft.name + ' ∪ ' + setRight.name,
        columns: outColumns,
        data: [],
      };

      for (const leftRow of setLeft.data) {
        // Add the row if it doesn't exist or we don't want distinct
        if (
          !expr[type].distinct ||
          setOutput.data.find((row) => deepEqual(row, leftRow)) === undefined
        ) {
          setOutput.data.push(leftRow);
        }
      }

      // Generate new rows for the right side with the salem
      // column names as those on the left
      const newRight = setRight.data.map((rightRow) => {
        const newRow = {};
        for (const rightKey of Object.keys(rightRow)) {
          newRow[setLeft.columns[setRight.columns.indexOf(rightKey)]] =
            rightRow[rightKey];
        }

        return newRow;
      });

      if (type === 'intersect') {
        // Keep only rows from th left which have a match on the right
        setOutput.data = setOutput.data.filter((leftRow) => {
          for (const rightRow of newRight) {
            if (deepEqual(leftRow, rightRow)) {
              return true;
            }
          }
          return false;
        });
      } else {
        for (const rightRow of newRight) {
          if (type === 'except') {
            // Remove any matching rows
            setOutput.data = setOutput.data.filter(
              (row) => !deepEqual(row, rightRow)
            );
          } else if (type === 'union') {
            // Add the row if it doesn't exist or we don't want distinct
            if (
              !expr[type].distinct ||
              setOutput.data.find((row) => deepEqual(row, rightRow)) ===
                undefined
            ) {
              setOutput.data.push(rightRow);
            }
          }
        }
      }

      return setOutput;

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

function highlightExpr(currentElement: ?HTMLElement, newElement: ?HTMLElement) {
  if (currentElement !== newElement) {
    if (currentElement) {
      let newClassName = currentElement.className.replace(' highlighted', '');
      currentElement.className = newClassName;
    }
    if (newElement) {
      newElement.className = newElement.className + ' highlighted';
    }
  }
  return newElement;
}

export function applyResetAction(currentElement: ?HTMLElement) {
  if (currentElement) {
    let newClassName = currentElement.className.replace(' highlighted', '');
    currentElement.className = newClassName;
  }
}

const reducer: (State, Action) => State = produce<State, Action>(
  (draft: State, action: Action) => {
    // eslint-disable-next-line default-case
    switch (action.type) {
      case RESET_EXPR:
        applyResetAction(draft.element);
        draft.element = undefined;
        break;
      case CHANGE_EXPR:
        draft.current = applyExpr(action.expr, draft.sourceData);
        if (draft.element) {
          draft.element = highlightExpr(draft.element, action.element);
        }
        break;
    }
  },
  initialState
);

export default reducer;
