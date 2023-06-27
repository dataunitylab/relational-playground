import reducer from './relexp';
import {exprFromSql, enableOptimization, disableOptimization} from './relexp';

const parser = require('@michaelmior/js-sql-parser');

/** @test {relexp} */
it('converts a simple SELECT *', () => {
  const sql = parser.parse('SELECT * FROM foo');
  const action = exprFromSql(sql.value, {});
  expect(reducer({}, action)).toMatchObject({
    expr: {relation: 'foo'},
  });
});

/** @test {relexp} */
it('converts a simple projection', () => {
  const sql = parser.parse('SELECT bar FROM foo');
  const action = exprFromSql(sql.value, {foo: ['bar']});
  expect(reducer({}, action)).toMatchObject({
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
  expect(reducer({}, action)).toMatchObject({
    expr: {
      rename: {
        arguments: {rename: {columns: {bar: 'baz'}}},
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
  expect(reducer({}, action)).toMatchObject({
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
  expect(reducer({}, action)).toMatchObject({
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
  expect(reducer({}, action)).toMatchObject({
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
  expect(reducer({}, action)).toMatchObject({
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
  expect(reducer({}, action)).toMatchObject({
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
  expect(reducer({}, action)).toMatchObject({
    expr: {
      product: {
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
  expect(reducer({}, action)).toMatchObject({
    expr: {
      join: {
        left: {relation: 'foo'},
        right: {relation: 'bar'},
        type: 'inner',
        condition: {cmp: {lhs: 'foo.baz', op: '$eq', rhs: 'bar.corge'}},
      },
    },
  });
});

/** @test {relexp} */
it('converts a left outer join with a condition', () => {
  const sql = parser.parse(
    'SELECT * FROM foo LEFT JOIN bar ON foo.baz = bar.corge'
  );
  const action = exprFromSql(sql.value, {foo: ['baz'], bar: ['corge']});
  expect(reducer({}, action)).toMatchObject({
    expr: {
      join: {
        left: {relation: 'foo'},
        right: {relation: 'bar'},
        type: 'left',
        condition: {cmp: {lhs: 'foo.baz', op: '$eq', rhs: 'bar.corge'}},
      },
    },
  });
});

/** @test {relexp} */
it('converts a right outer join with a condition', () => {
  const sql = parser.parse(
    'SELECT * FROM foo RIGHT JOIN bar ON foo.baz = bar.corge'
  );
  const action = exprFromSql(sql.value, {foo: ['baz'], bar: ['corge']});
  expect(reducer({}, action)).toMatchObject({
    expr: {
      join: {
        left: {relation: 'foo'},
        right: {relation: 'bar'},
        type: 'right',
        condition: {cmp: {lhs: 'foo.baz', op: '$eq', rhs: 'bar.corge'}},
      },
    },
  });
});

/** @test {relexp} */
it('converts a pre-optimized select-join statement with a condition', () => {
  const sql = parser.parse(
    'SELECT * FROM foo JOIN bar ON foo.baz = bar.corge WHERE foo.baz = 1'
  );
  const action = exprFromSql(sql.value, {foo: ['baz'], bar: ['corge']});
  expect(reducer({}, action)).toMatchObject({
    expr: {
      selection: {
        arguments: {
          select: {cmp: {lhs: 'foo.baz', op: '$eq', rhs: '1'}},
        },
        children: [
          {
            join: {
              condition: {cmp: {lhs: 'foo.baz', op: '$eq', rhs: 'bar.corge'}},
              left: {relation: 'foo'},
              right: {relation: 'bar'},
              type: 'inner',
            },
          },
        ],
      },
    },
  });
});

/** @test {relexp} */
it('converts a post-optimized select-join statement with a condition', () => {
  const sql = parser.parse(
    'SELECT * FROM foo JOIN bar ON foo.baz = bar.corge WHERE foo.baz = 1'
  );
  const action = exprFromSql(sql.value, {foo: ['baz'], bar: ['corge']});
  const draft = reducer({}, action);
  const optimizeAction = enableOptimization('join');
  expect(reducer(draft, optimizeAction)).toMatchObject({
    expr: {
      join: {
        condition: {cmp: {lhs: 'foo.baz', op: '$eq', rhs: 'bar.corge'}},
        left: {
          selection: {
            arguments: {
              select: {cmp: {lhs: 'foo.baz', op: '$eq', rhs: '1'}},
            },
            children: [{relation: 'foo'}],
          },
        },
        right: {relation: 'bar'},
        type: 'inner',
      },
    },
    unoptimizedExpr: {
      selection: {
        arguments: {
          select: {cmp: {lhs: 'foo.baz', op: '$eq', rhs: '1'}},
        },
        children: [
          {
            join: {
              condition: {cmp: {lhs: 'foo.baz', op: '$eq', rhs: 'bar.corge'}},
              left: {relation: 'foo'},
              right: {relation: 'bar'},
              type: 'inner',
            },
          },
        ],
      },
    },
  });
});

/** @test {relexp} */
it('checks if a select-join statement with a condition converts back correctly after optimization', () => {
  const sql = parser.parse(
    'SELECT * FROM foo JOIN bar ON foo.baz = bar.corge WHERE foo.baz = 1'
  );
  const action = exprFromSql(sql.value, {foo: ['baz'], bar: ['corge']});
  const preOptDraft = reducer({}, action);
  const optimizeAction = enableOptimization('join');
  const draft = reducer(preOptDraft, optimizeAction);
  const disableOptimizeAction = disableOptimization();
  expect(reducer(draft, disableOptimizeAction)).toMatchObject(preOptDraft);
});

/** @test {relexp} */
it('converts a pre-optimized select-join statement with multiple conditions', () => {
  const sql = parser.parse(
    'SELECT * FROM foo JOIN bar ON foo.baz = bar.corge WHERE foo.baz > 4 AND foo.baz < 9 AND bar.corge > 1 AND bar.corge < 6'
  );
  const action = exprFromSql(sql.value, {foo: ['baz'], bar: ['corge']});
  expect(reducer({}, action)).toMatchObject({
    expr: {
      selection: {
        arguments: {
          select: {
            and: {
              clauses: [
                {cmp: {lhs: 'foo.baz', op: '$gt', rhs: '4'}},
                {cmp: {lhs: 'foo.baz', op: '$lt', rhs: '9'}},
                {cmp: {lhs: 'bar.corge', op: '$gt', rhs: '1'}},
                {cmp: {lhs: 'bar.corge', op: '$lt', rhs: '6'}},
              ],
            },
          },
        },
        children: [
          {
            join: {
              condition: {cmp: {lhs: 'foo.baz', op: '$eq', rhs: 'bar.corge'}},
              left: {relation: 'foo'},
              right: {relation: 'bar'},
              type: 'inner',
            },
          },
        ],
      },
    },
  });
});

/** @test {relexp} */
it('converts a post-optimized select-join statement with multiple conditions', () => {
  const sql = parser.parse(
    'SELECT * FROM foo JOIN bar ON foo.baz = bar.corge WHERE foo.baz > 4 AND foo.baz < 9 AND bar.corge > 1 AND bar.corge < 6'
  );
  const action = exprFromSql(sql.value, {foo: ['baz'], bar: ['corge']});
  const draft = reducer({}, action);
  const optimizeAction = enableOptimization('join');
  expect(reducer(draft, optimizeAction)).toMatchObject({
    expr: {
      join: {
        condition: {cmp: {lhs: 'foo.baz', op: '$eq', rhs: 'bar.corge'}},
        left: {
          selection: {
            arguments: {
              select: {
                and: {
                  clauses: [
                    {cmp: {lhs: 'foo.baz', op: '$gt', rhs: '4'}},
                    {cmp: {lhs: 'foo.baz', op: '$lt', rhs: '9'}},
                  ],
                },
              },
            },
            children: [{relation: 'foo'}],
          },
        },
        right: {
          selection: {
            arguments: {
              select: {
                and: {
                  clauses: [
                    {cmp: {lhs: 'bar.corge', op: '$gt', rhs: '1'}},
                    {cmp: {lhs: 'bar.corge', op: '$lt', rhs: '6'}},
                  ],
                },
              },
            },
            children: [{relation: 'bar'}],
          },
        },
        type: 'inner',
      },
    },
    unoptimizedExpr: {
      selection: {
        arguments: {
          select: {
            and: {
              clauses: [
                {cmp: {lhs: 'foo.baz', op: '$gt', rhs: '4'}},
                {cmp: {lhs: 'foo.baz', op: '$lt', rhs: '9'}},
                {cmp: {lhs: 'bar.corge', op: '$gt', rhs: '1'}},
                {cmp: {lhs: 'bar.corge', op: '$lt', rhs: '6'}},
              ],
            },
          },
        },
        children: [
          {
            join: {
              condition: {cmp: {lhs: 'foo.baz', op: '$eq', rhs: 'bar.corge'}},
              left: {relation: 'foo'},
              right: {relation: 'bar'},
              type: 'inner',
            },
          },
        ],
      },
    },
    optimized: true,
  });
});

/** @test {relexp} */
it('checks if a select-join statement with mutiple condition converts back correctly after optimization', () => {
  const sql = parser.parse(
    'SELECT * FROM foo JOIN bar ON foo.baz = bar.corge WHERE foo.baz > 4 AND foo.baz < 9 AND bar.corge > 1 AND bar.corge < 6'
  );
  const action = exprFromSql(sql.value, {foo: ['baz'], bar: ['corge']});
  const preOptDraft = reducer({}, action);
  const optimizeAction = enableOptimization('join');
  const draft = reducer(preOptDraft, optimizeAction);
  const disableOptimizeAction = disableOptimization();
  expect(reducer(draft, disableOptimizeAction)).toMatchObject(preOptDraft);
});

/** @test {relexp} */
it('converts a default (ascending) sorting', () => {
  const sql = parser.parse('SELECT * FROM foo ORDER BY bar');
  const action = exprFromSql(sql.value, {foo: ['bar']});
  expect(reducer({}, action)).toStrictEqual({
    expr: {
      order_by: {
        arguments: {
          order_by: [
            {
              ascending: true,
              column_name: 'bar',
            },
          ],
        },
        children: [{relation: 'foo'}],
      },
    },
  });
});

/** @test {relexp} */
it('converts a descending sorting', () => {
  const sql = parser.parse('SELECT * FROM foo ORDER BY bar DESC');
  const action = exprFromSql(sql.value, {foo: ['bar']});
  expect(reducer({}, action)).toStrictEqual({
    expr: {
      order_by: {
        arguments: {
          order_by: [
            {
              ascending: false,
              column_name: 'bar',
            },
          ],
        },
        children: [{relation: 'foo'}],
      },
    },
  });
});

/** @test {relexp} */
it('converts a sorting on multiple column conditions', () => {
  const sql = parser.parse('SELECT * FROM foo ORDER BY bar DESC, baz ASC');
  const action = exprFromSql(sql.value, {foo: ['bar', 'baz']});
  expect(reducer({}, action)).toStrictEqual({
    expr: {
      order_by: {
        arguments: {
          order_by: [
            {
              ascending: false,
              column_name: 'bar',
            },
            {
              ascending: true,
              column_name: 'baz',
            },
          ],
        },
        children: [{relation: 'foo'}],
      },
    },
  });
});

/** @test {relexp} */
it('converts a selection', () => {
  const sql = parser.parse('SELECT * FROM foo WHERE bar > 1');
  const action = exprFromSql(sql.value, {foo: ['bar']});
  expect(reducer({}, action)).toMatchObject({
    expr: {
      selection: {
        arguments: {select: {cmp: {lhs: 'bar', op: '$gt', rhs: '1'}}},
        children: [{relation: 'foo'}],
      },
    },
  });
});

/** @test {relexp} */
it('converts a selection with a literal on the left', () => {
  const sql = parser.parse('SELECT * FROM foo WHERE 1 > bar');
  const action = exprFromSql(sql.value, {foo: ['bar']});
  expect(reducer({}, action)).toMatchObject({
    expr: {
      selection: {
        arguments: {select: {cmp: {lhs: '1', op: '$gt', rhs: 'bar'}}},
        children: [{relation: 'foo'}],
      },
    },
  });
});

/** @test {relexp} */
it.each(['and', 'or'])('converts a selection with %s', (op) => {
  const sql = parser.parse(
    'SELECT * FROM foo WHERE bar > 1 ' + op + ' baz < 3'
  );
  const action = exprFromSql(sql.value, {foo: ['bar', 'baz']});
  expect(reducer({}, action)).toMatchObject({
    expr: {
      selection: {
        arguments: {
          select: {
            [op]: {
              clauses: [
                {cmp: {lhs: 'bar', op: '$gt', rhs: '1'}},
                {cmp: {lhs: 'baz', op: '$lt', rhs: '3'}},
              ],
            },
          },
        },
        children: [{relation: 'foo'}],
      },
    },
  });
});

/** @test {relexp} */
it('converts a selection with BETWEEN', () => {
  const sql = parser.parse('SELECT * FROM foo WHERE bar BETWEEN 1 AND 3');
  const action = exprFromSql(sql.value, {foo: ['bar']});
  expect(reducer({}, action)).toStrictEqual({
    expr: {
      selection: {
        arguments: {
          select: {
            and: {
              clauses: [
                {cmp: {lhs: 'bar', op: '$gte', rhs: '1'}},
                {cmp: {lhs: 'bar', op: '$lte', rhs: '3'}},
              ],
            },
          },
        },
        children: [{relation: 'foo'}],
      },
    },
  });
});

/** @test {relexp} */
it("converts a basic selection with multiple 'AND's", () => {
  const sql = parser.parse(
    'SELECT * FROM foo WHERE bar > 1 and bar < 3 and baz > 1 and baz < 3'
  );
  const action = exprFromSql(sql.value, {foo: ['bar', 'baz']});
  expect(reducer({}, action)).toMatchObject({
    expr: {
      selection: {
        arguments: {
          select: {
            and: {
              clauses: [
                {cmp: {lhs: 'bar', op: '$gt', rhs: '1'}},
                {cmp: {lhs: 'bar', op: '$lt', rhs: '3'}},
                {cmp: {lhs: 'baz', op: '$gt', rhs: '1'}},
                {cmp: {lhs: 'baz', op: '$lt', rhs: '3'}},
              ],
            },
          },
        },
        children: [{relation: 'foo'}],
      },
    },
  });
});

/** @test {relexp} */
it("converts a basic selection with both 'AND's in 'OR'", () => {
  const sql = parser.parse(
    'SELECT * FROM foo WHERE bar > 1 and baz < 3 or baz > 1 and bar < 3'
  );
  const action = exprFromSql(sql.value, {foo: ['bar', 'baz']});
  expect(reducer({}, action)).toMatchObject({
    expr: {
      selection: {
        arguments: {
          select: {
            or: {
              clauses: [
                {
                  and: {
                    clauses: [
                      {cmp: {lhs: 'bar', op: '$gt', rhs: '1'}},
                      {cmp: {lhs: 'baz', op: '$lt', rhs: '3'}},
                    ],
                  },
                },
                {
                  and: {
                    clauses: [
                      {cmp: {lhs: 'baz', op: '$gt', rhs: '1'}},
                      {cmp: {lhs: 'bar', op: '$lt', rhs: '3'}},
                    ],
                  },
                },
              ],
            },
          },
        },
        children: [{relation: 'foo'}],
      },
    },
  });
});

/** @test {relexp} */
it("converts a basic selection with both 'OR's in 'AND'", () => {
  const sql = parser.parse(
    'SELECT * FROM foo WHERE bar > 1 or baz < 3 and baz > 1 or bar < 3'
  );
  const action = exprFromSql(sql.value, {foo: ['bar', 'baz']});
  expect(reducer({}, action)).toMatchObject({
    expr: {
      selection: {
        arguments: {
          select: {
            or: {
              clauses: [
                {
                  or: {
                    clauses: [
                      {cmp: {lhs: 'bar', op: '$gt', rhs: '1'}},
                      {
                        and: {
                          clauses: [
                            {cmp: {lhs: 'baz', op: '$lt', rhs: '3'}},
                            {cmp: {lhs: 'baz', op: '$gt', rhs: '1'}},
                          ],
                        },
                      },
                    ],
                  },
                },
                {cmp: {lhs: 'bar', op: '$lt', rhs: '3'}},
              ],
            },
          },
        },
        children: [{relation: 'foo'}],
      },
    },
  });
});

/** @test {relexp} */
it("converts a basic selection with both 'OR's in 'AND'", () => {
  const sql = parser.parse(
    'SELECT * FROM foo WHERE (bar > 1 or baz < 3) and (baz > 1 or bar < 3)'
  );
  const action = exprFromSql(sql.value, {foo: ['bar', 'baz']});
  expect(reducer({}, action)).toMatchObject({
    expr: {
      selection: {
        arguments: {
          select: {
            and: {
              clauses: [
                {
                  or: {
                    clauses: [
                      {cmp: {lhs: 'bar', op: '$gt', rhs: '1'}},
                      {cmp: {lhs: 'baz', op: '$lt', rhs: '3'}},
                    ],
                  },
                },
                {
                  or: {
                    clauses: [
                      {cmp: {lhs: 'baz', op: '$gt', rhs: '1'}},
                      {cmp: {lhs: 'bar', op: '$lt', rhs: '3'}},
                    ],
                  },
                },
              ],
            },
          },
        },
        children: [{relation: 'foo'}],
      },
    },
  });
});

/** @test {relexp} */
it("converts a selection with more than two 'AND' clauses", () => {
  const sql = parser.parse(
    'SELECT * FROM foo WHERE bar > 1 and baz < 3 and baz > 1'
  );
  const action = exprFromSql(sql.value, {foo: ['bar', 'baz']});
  expect(reducer({}, action)).toStrictEqual({
    expr: {
      selection: {
        arguments: {
          select: {
            and: {
              clauses: [
                {cmp: {lhs: 'bar', op: '$gt', rhs: '1'}},
                {cmp: {lhs: 'baz', op: '$lt', rhs: '3'}},
                {cmp: {lhs: 'baz', op: '$gt', rhs: '1'}},
              ],
            },
          },
        },
        children: [{relation: 'foo'}],
      },
    },
  });
});

/** @test {relexp} */
it('converts a selection with NOT', () => {
  const sql = parser.parse('SELECT * FROM foo WHERE NOT bar > 1');
  const action = exprFromSql(sql.value, {foo: ['bar', 'baz']});
  expect(reducer({}, action)).toMatchObject({
    expr: {
      selection: {
        arguments: {
          select: {
            not: {clause: {cmp: {lhs: 'bar', op: '$gt', rhs: '1'}}},
          },
        },
        children: [{relation: 'foo'}],
      },
    },
  });
});

/** @test {relexp} */
it('throws an error if a column is referenced in a table not joined', () => {
  const sql = parser.parse('SELECT baz.quux FROM foo');
  const action = exprFromSql(sql.value, {foo: ['bar'], baz: ['quux']});
  expect(() => reducer({}, action)).toThrow(
    'Table baz is not referenced in query'
  );
});

/** @test {relexp} */
it('throws an error if no FROM clause is given', () => {
  const sql = parser.parse('SELECT 0');
  const action = exprFromSql(sql.value, {});
  expect(() => reducer({}, action)).toThrow('A FROM clause must be specified.');
});

/** @test {relexp} */
it('should remove quotes from string literals', () => {
  const sql = parser.parse('SELECT * FROM foo WHERE bar = "baz"');
  const action = exprFromSql(sql.value, {foo: ['bar']});
  expect(reducer({}, action)).toMatchObject({
    expr: {
      selection: {
        arguments: {select: {cmp: {lhs: 'bar', op: '$eq', rhs: 'baz'}}},
        children: [{relation: 'foo'}],
      },
    },
  });
});

/** @test {relexp} */
it('should convert conditions with IN', () => {
  const sql = parser.parse('SELECT * FROM foo WHERE id IN (1, 2)');
  const action = exprFromSql(sql.value, {foo: ['id']});
  expect(reducer({}, action)).toMatchObject({
    expr: {
      selection: {
        arguments: {
          select: {
            or: {
              clauses: [
                {cmp: {lhs: 'id', op: '$eq', rhs: '1'}},
                {cmp: {lhs: 'id', op: '$eq', rhs: '2'}},
              ],
            },
          },
        },
        children: [{relation: 'foo'}],
      },
    },
  });
});

/** @test {relexp} */
it('should convert conditions with IN', () => {
  const sql = parser.parse('SELECT * FROM foo WHERE id NOT IN (1, 2)');
  const action = exprFromSql(sql.value, {foo: ['id']});
  expect(reducer({}, action)).toMatchObject({
    expr: {
      selection: {
        arguments: {
          select: {
            not: {
              clause: {
                or: {
                  clauses: [
                    {cmp: {lhs: 'id', op: '$eq', rhs: '1'}},
                    {cmp: {lhs: 'id', op: '$eq', rhs: '2'}},
                  ],
                },
              },
            },
          },
        },
        children: [{relation: 'foo'}],
      },
    },
  });
});
