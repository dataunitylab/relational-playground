export const EXPR_FROM_SQL = 'EXPR_FROM_SQL';

export function exprFromSql(sql) {
  return {type: EXPR_FROM_SQL, sql};
}

const initialState = {
  expr: {
    rename: {
      arguments: { rename: {'firstName': 'name'}},
      children: [
        {projection: {
          arguments: { project: ['firstName', 'lastName']},
          children: [
            {selection: {
              arguments: { select: [{'salary': {'$gt': 130000}}] },
              children: [
                {relation: 'Doctor'}
              ]
            }}
          ]
        }}
      ]
    }
  }
}

function buildExpr(sql) {
  switch (sql.type) {
    case 'Select':
      const from = sql.from.value.map((v) => buildExpr(v));
      if (from.length > 1) {
        throw 'Only single table queries currently supported.';
      }

      const select = sql.selectItems.value;
      if (select.length === 1 && select[0].value === '*') {
        return from[0];
      } else {
        const project = select.map((field) => field.value);
        return {projection: {
          arguments: {project},
          children: from
        }};
      }
    case 'TableRefrence':
      return buildExpr(sql.value);
    case 'TableFactor':
      return {relation: sql.value.value};
    default:
      throw 'Unsupported statement.';
  }
}

export default (state = initialState, action) => {
  switch(action.type) {
    case EXPR_FROM_SQL:
      return {
        ...state,
        expr: buildExpr(action.sql)
      };
    default:
      return {
        ...state
      }
  }
}
