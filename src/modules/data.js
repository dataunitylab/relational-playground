// @flow
export const CHANGE_EXPR = 'CHANGE_EXPR';

type Action =
  | {type: 'CHANGE_EXPR', expr: {[string]: any}};

export function changeExpr(expr: {[string]: any}): Action {
  return {type: CHANGE_EXPR, expr};
}

export type Data = {
  name: string, columns: Array<string>, data: Array<{[string]: any}>
};

export type State = {
  current?: Data,
  sourcedata: {[string]: Data}
};

const initialState = {
  sourcedata: {
    'Doctor': {
      name: 'Doctor',
      columns: ['firstName', 'lastName', 'salary'],
      data: [
        {firstName: "Alice", lastName: "Yang", salary: 176000},
        {firstName: "Bob", lastName: "Smith", salary: 120000}
      ]
    }
  }
}

function applyExpr(expr, sourceData) {
    switch(Object.keys(expr)[0]) {
      case 'projection':
        let projData = applyExpr(expr.projection.children[0], sourceData);
        const deleted = projData.columns.filter((column) => expr.projection.arguments.project.indexOf(column) === -1);
        projData.columns = expr.projection.arguments.project.slice();

        for (let i=0; i < deleted.length; i++) {
          for (let j=0; j < projData.data.length; j++) {
            delete projData.data[j][deleted[i]];
          }
        }
        return projData;
      case 'selection':
        let selData = applyExpr(expr.selection.children[0], sourceData);
        let select = expr.selection.arguments.select;
        selData.data = selData.data.filter((item) => {
          let keep = true;
          for (var i = 0; i < select.length; i++) {
            const field = Object.keys(select[i])[0];
            const op = Object.keys(select[i][field])[0];
            switch (op) {
              case '$gte':
                keep = keep && item[field] >= select[i][field][op];
                break;
              case '$gt':
                keep = keep && item[field] > select[i][field][op];
                break;
              case '$lt':
                keep = keep && item[field] < select[i][field][op];
                break;
              case '$lte':
                keep = keep && item[field] <= select[i][field][op];
                break;
              case '$ne':
                keep = keep && item[field] !== select[i][field][op];
                break;
              case '$eq':
                keep = keep && item[field] === select[i][field][op];
                break;
              default:
                throw new Error('Invalid expression');
            }
          }
          return keep;
        });
        return selData;
      case 'rename':
        let renData = applyExpr(expr.rename.children[0], sourceData);
        Object.entries(expr.rename.arguments.rename).forEach(([from, to]) => {
          renData.columns[renData.columns.indexOf(from)] = to;
          for (let j=0; j < renData.data.length; j++) {
            renData.data[j][to] = renData.data[j][from];
            delete renData.data[j][from];
          }
        });
        return renData;
      case 'relation':
        return JSON.parse(JSON.stringify(sourceData[expr.relation]));
      default:
        throw new Error('Invalid expression');
    }
}

export default (state: State = initialState, action: Action) => {
  switch(action.type) {
    case CHANGE_EXPR:
      return {
        ...state,
        current: applyExpr(action.expr, state.sourcedata)
      };
    default:
      return {
        ...state
      }
  }
};
