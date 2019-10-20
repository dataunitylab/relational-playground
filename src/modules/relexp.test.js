import reducer from './relexp';
import {exprFromSql} from './relexp';

const parser = require('@michaelmior/js-sql-parser');

/** @test {relexp} */
it('converts a simple SELECT *', () => {
  const sql = parser.parse('SELECT * FROM foo');
  const action = exprFromSql(sql.value, {});
  expect(reducer({}, action)).toStrictEqual({expr: {relation: 'foo'}});
});

/** @test {relexp} */
it('converts a simple projection', () => {
  const sql = parser.parse('SELECT bar FROM foo');
  const action = exprFromSql(sql.value, {foo: ['bar']});
  expect(reducer({}, action)).toStrictEqual({
    expr: {
      projection: {
        arguments: {project: ['bar']},
        children: [{relation: 'foo'}],
      },
    },
  });
});

/** @test {relexp} */
it('converts a rename', () => {
  const sql = parser.parse('SELECT bar as baz FROM foo');
  const action = exprFromSql(sql.value, {foo: ['bar']});
  expect(reducer({}, action)).toStrictEqual({
    expr: {
      rename: {
        arguments: {rename: {bar: 'baz'}},
        children: [
          {
            projection: {
              arguments: {project: ['bar']},
              children: [{relation: 'foo'}],
            },
          },
        ],
      },
    },
  });
});

/** @test {relexp} */
it('converts a difference', () => {
  const sql = parser.parse('SELECT * FROM foo EXCEPT SELECT * FROM bar');
  const action = exprFromSql(sql.value, {});
  expect(reducer({}, action)).toStrictEqual({
    expr: {
      except: {
        left: {relation: 'foo'},
        right: {relation: 'bar'},
        distinct: true,
      },
    },
  });
});

/** @test {relexp} */
it('converts an intersection', () => {
  const sql = parser.parse('SELECT * FROM foo INTERSECT SELECT * FROM bar');
  const action = exprFromSql(sql.value, {});
  expect(reducer({}, action)).toStrictEqual({
    expr: {
      intersect: {
        left: {relation: 'foo'},
        right: {relation: 'bar'},
        distinct: true,
      },
    },
  });
});

/** @test {relexp} */
it('converts a distinct union', () => {
  const sql = parser.parse('SELECT * FROM foo UNION SELECT * FROM bar');
  const action = exprFromSql(sql.value, {});
  expect(reducer({}, action)).toStrictEqual({
    expr: {
      union: {
        left: {relation: 'foo'},
        right: {relation: 'bar'},
        distinct: true,
      },
    },
  });
});

/** @test {relexp} */
it('converts a union', () => {
  const sql = parser.parse('SELECT * FROM foo UNION ALL SELECT * FROM bar');
  const action = exprFromSql(sql.value, {});
  expect(reducer({}, action)).toStrictEqual({
    expr: {
      union: {
        left: {relation: 'foo'},
        right: {relation: 'bar'},
        distinct: false,
      },
    },
  });
});

/** @test {relexp} */
it('converts a union on two tables with the same column', () => {
  const sql = parser.parse('SELECT bar FROM foo UNION SELECT bar FROM baz');
  const action = exprFromSql(sql.value, {foo: ['bar'], baz: ['bar']});
  expect(reducer({}, action)).toStrictEqual({
    expr: {
      union: {
        left: {
          projection: {
            arguments: {project: ['bar']},
            children: [{relation: 'foo'}],
          },
        },
        right: {
          projection: {
            arguments: {project: ['bar']},
            children: [{relation: 'baz'}],
          },
        },
        distinct: true,
      },
    },
  });
});

/** @test {relexp} */
it('converts a simple cross join', () => {
  const sql = parser.parse('SELECT * FROM foo JOIN bar');
  const action = exprFromSql(sql.value, {});
  expect(reducer({}, action)).toStrictEqual({
    expr: {
      join: {
        left: {relation: 'foo'},
        right: {relation: 'bar'},
      },
    },
  });
});

/** @test {relexp} */
it('converts a join with a condition', () => {
  const sql = parser.parse('SELECT * FROM foo JOIN bar ON foo.baz = bar.corge');
  const action = exprFromSql(sql.value, {foo: ['baz'], bar: ['corge']});
  expect(reducer({}, action)).toStrictEqual({
    expr: {
      selection: {
        arguments: {select: [{'foo.baz': {$eq: 'bar.corge'}}]},
        children: [
          {
            join: {
              left: {relation: 'foo'},
              right: {relation: 'bar'},
            },
          },
        ],
      },
    },
  });
});

/** @test {relexp} */
it('converts a selection', () => {
  const sql = parser.parse('SELECT * FROM foo WHERE bar > 1');
  const action = exprFromSql(sql.value, {foo: ['bar']});
  expect(reducer({}, action)).toStrictEqual({
    expr: {
      selection: {
        arguments: {select: [{bar: {$gt: '1'}}]},
        children: [{relation: 'foo'}],
      },
    },
  });
});

/** @test {relexp} */
it('converts a selection with AND', () => {
  const sql = parser.parse('SELECT * FROM foo WHERE bar > 1 AND baz < 3');
  const action = exprFromSql(sql.value, {foo: ['bar', 'baz']});
  expect(reducer({}, action)).toStrictEqual({
    expr: {
      selection: {
        arguments: {select: [{bar: {$gt: '1'}}, {baz: {$lt: '3'}}]},
        children: [{relation: 'foo'}],
      },
    },
  });
});
