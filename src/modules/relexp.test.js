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
    'SELECT * FROM Doctor JOIN Patient ON Doctor.id = Patient.primaryDoctor WHERE Patient.id = 1'
  );
  const action = exprFromSql(sql.value, {
    Doctor: ['id'],
    Patient: ['primaryDoctor', 'id'],
  });
  const draft = reducer({}, action);
  const optimizeAction = enableOptimization('join');
  expect(reducer(draft, optimizeAction)).toMatchObject({
    expr: {
      join: {
        condition: {
          cmp: {lhs: 'Doctor.id', op: '$eq', rhs: 'Patient.primaryDoctor'},
        },
        left: {
          selection: {
            arguments: {
              select: {cmp: {lhs: 'Patient.id', op: '$eq', rhs: '1'}},
            },
            children: [{relation: 'Patient'}],
          },
        },
        right: {relation: 'Doctor'},
        type: 'inner',
      },
    },
    unoptimizedExpr: {
      selection: {
        arguments: {
          select: {cmp: {lhs: 'Patient.id', op: '$eq', rhs: '1'}},
        },
        children: [
          {
            join: {
              condition: {
                cmp: {
                  lhs: 'Doctor.id',
                  op: '$eq',
                  rhs: 'Patient.primaryDoctor',
                },
              },
              left: {relation: 'Doctor'},
              right: {relation: 'Patient'},
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
    'SELECT * FROM Patient JOIN Doctor ON Patient.primaryDoctor = Doctor.id WHERE Patient.id = 1'
  );
  const action = exprFromSql(sql.value, {
    Patient: ['primaryDoctor', 'id'],
    Doctor: ['id'],
  });
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
    'SELECT * FROM Doctor JOIN Patient ON Doctor.id = Patient.primaryDoctor WHERE Doctor.id > 4 AND Doctor.id < 9 AND Patient.id > 1 AND Patient.id < 6'
  );
  const action = exprFromSql(sql.value, {
    Doctor: ['id'],
    Patient: ['id', 'primaryDoctor'],
  });
  const draft = reducer({}, action);
  const optimizeAction = enableOptimization('join');
  expect(reducer(draft, optimizeAction)).toMatchObject({
    expr: {
      join: {
        condition: {
          cmp: {lhs: 'Doctor.id', op: '$eq', rhs: 'Patient.primaryDoctor'},
        },
        left: {
          selection: {
            arguments: {
              select: {
                and: {
                  clauses: [
                    {cmp: {lhs: 'Doctor.id', op: '$gt', rhs: '4'}},
                    {cmp: {lhs: 'Doctor.id', op: '$lt', rhs: '9'}},
                  ],
                },
              },
            },
            children: [{relation: 'Doctor'}],
          },
        },
        right: {
          selection: {
            arguments: {
              select: {
                and: {
                  clauses: [
                    {cmp: {lhs: 'Patient.id', op: '$gt', rhs: '1'}},
                    {cmp: {lhs: 'Patient.id', op: '$lt', rhs: '6'}},
                  ],
                },
              },
            },
            children: [{relation: 'Patient'}],
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
                {cmp: {lhs: 'Doctor.id', op: '$gt', rhs: '4'}},
                {cmp: {lhs: 'Doctor.id', op: '$lt', rhs: '9'}},
                {cmp: {lhs: 'Patient.id', op: '$gt', rhs: '1'}},
                {cmp: {lhs: 'Patient.id', op: '$lt', rhs: '6'}},
              ],
            },
          },
        },
        children: [
          {
            join: {
              condition: {
                cmp: {
                  lhs: 'Doctor.id',
                  op: '$eq',
                  rhs: 'Patient.primaryDoctor',
                },
              },
              left: {relation: 'Doctor'},
              right: {relation: 'Patient'},
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
    'SELECT * FROM Doctor JOIN Patient ON Doctor.id = Patient.primaryDoctor WHERE Patient.id > 4 AND Doctor.id < 9 AND Patient.primaryDoctor > 1 AND Doctor.id < 6'
  );
  const action = exprFromSql(sql.value, {
    Doctor: ['id'],
    Patient: ['id', 'primaryDoctor'],
  });
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

/** @test {relexp} */
it('converts a GROUP BY with aggregate only', () => {
  const sql = parser.parse(
    'SELECT MIN(salary) FROM Doctor GROUP BY departmentId'
  );
  const action = exprFromSql(sql.value, {Doctor: ['salary', 'departmentId']});
  expect(reducer({}, action)).toMatchObject({
    expr: {
      group_by: {
        arguments: {
          groupBy: ['departmentId'],
          aggregates: [
            {
              aggregate: {
                function: 'MIN',
                column: 'salary',
              },
            },
          ],
          selectColumns: [],
        },
        children: [{relation: 'Doctor'}],
      },
    },
  });
});

/** @test {relexp} */
it('converts a GROUP BY with mixed columns and aggregates', () => {
  const sql = parser.parse(
    'SELECT departmentId, MAX(salary) FROM Doctor GROUP BY departmentId'
  );
  const action = exprFromSql(sql.value, {Doctor: ['salary', 'departmentId']});
  expect(reducer({}, action)).toMatchObject({
    expr: {
      group_by: {
        arguments: {
          groupBy: ['departmentId'],
          aggregates: [
            {
              aggregate: {
                function: 'MAX',
                column: 'salary',
              },
            },
          ],
          selectColumns: ['departmentId'],
        },
        children: [{relation: 'Doctor'}],
      },
    },
  });
});

/** @test {relexp} */
it('converts a GROUP BY with multiple aggregates', () => {
  const sql = parser.parse(
    'SELECT MIN(salary), MAX(salary), AVG(salary) FROM Doctor GROUP BY departmentId'
  );
  const action = exprFromSql(sql.value, {Doctor: ['salary', 'departmentId']});
  expect(reducer({}, action)).toMatchObject({
    expr: {
      group_by: {
        arguments: {
          groupBy: ['departmentId'],
          aggregates: [
            {
              aggregate: {
                function: 'MIN',
                column: 'salary',
              },
            },
            {
              aggregate: {
                function: 'MAX',
                column: 'salary',
              },
            },
            {
              aggregate: {
                function: 'AVG',
                column: 'salary',
              },
            },
          ],
          selectColumns: [],
        },
        children: [{relation: 'Doctor'}],
      },
    },
  });
});

/** @test {relexp} */
it('converts aggregate without GROUP BY (implicit grouping)', () => {
  const sql = parser.parse('SELECT MIN(salary) FROM Doctor');
  const action = exprFromSql(sql.value, {Doctor: ['salary']});
  expect(reducer({}, action)).toMatchObject({
    expr: {
      group_by: {
        arguments: {
          groupBy: [],
          aggregates: [
            {
              aggregate: {
                function: 'MIN',
                column: 'salary',
              },
            },
          ],
          selectColumns: [],
        },
        children: [{relation: 'Doctor'}],
      },
    },
  });
});

/** @test {relexp} */
it('converts GROUP BY with qualified column names', () => {
  const sql = parser.parse(
    'SELECT departmentId, MIN(Doctor.salary) FROM Doctor GROUP BY Doctor.departmentId'
  );
  const action = exprFromSql(sql.value, {Doctor: ['salary', 'departmentId']});
  expect(reducer({}, action)).toMatchObject({
    expr: {
      group_by: {
        arguments: {
          groupBy: ['Doctor.departmentId'],
          aggregates: [
            {
              aggregate: {
                function: 'MIN',
                column: 'Doctor.salary',
              },
            },
          ],
          selectColumns: ['departmentId'],
        },
        children: [{relation: 'Doctor'}],
      },
    },
  });
});

/** @test {relexp} */
it('supports all aggregate functions', () => {
  const sql = parser.parse(
    'SELECT SUM(salary) FROM Doctor GROUP BY departmentId'
  );
  const action = exprFromSql(sql.value, {Doctor: ['salary', 'departmentId']});
  expect(reducer({}, action)).toMatchObject({
    expr: {
      group_by: {
        arguments: {
          groupBy: ['departmentId'],
          aggregates: [
            {
              aggregate: {
                function: 'SUM',
                column: 'salary',
              },
            },
          ],
          selectColumns: [],
        },
        children: [{relation: 'Doctor'}],
      },
    },
  });
});

// GROUP BY Validation Tests
/** @test {relexp} */
it('throws error when non-aggregate column not in GROUP BY', () => {
  const sql = parser.parse(
    'SELECT id, MIN(salary) FROM Doctor GROUP BY departmentId'
  );
  const action = exprFromSql(sql.value, {
    Doctor: ['id', 'salary', 'departmentId'],
  });
  expect(() => reducer({}, action)).toThrow(
    "Column 'id' must appear in the GROUP BY clause or be used in an aggregate function"
  );
});

/** @test {relexp} */
it('throws error when ORDER BY column not in GROUP BY', () => {
  const sql = parser.parse(
    'SELECT departmentId, MIN(salary) FROM Doctor GROUP BY departmentId ORDER BY id'
  );
  const action = exprFromSql(sql.value, {
    Doctor: ['id', 'salary', 'departmentId'],
  });
  expect(() => reducer({}, action)).toThrow(
    "Column 'id' in ORDER BY clause must appear in the GROUP BY clause or be used in an aggregate function"
  );
});

/** @test {relexp} */
it('allows ORDER BY with GROUP BY column', () => {
  const sql = parser.parse(
    'SELECT departmentId, MIN(salary) FROM Doctor GROUP BY departmentId ORDER BY departmentId'
  );
  const action = exprFromSql(sql.value, {Doctor: ['salary', 'departmentId']});
  expect(reducer({}, action)).toMatchObject({
    expr: {
      order_by: {
        arguments: {
          order_by: [
            {
              ascending: true,
              column_name: 'departmentId',
            },
          ],
        },
        children: [
          {
            group_by: {
              arguments: {
                groupBy: ['departmentId'],
                aggregates: [
                  {
                    aggregate: {
                      function: 'MIN',
                      column: 'salary',
                    },
                  },
                ],
                selectColumns: ['departmentId'],
              },
              children: [{relation: 'Doctor'}],
            },
          },
        ],
      },
    },
  });
});

/** @test {relexp} */
it('handles qualified vs unqualified column name matching', () => {
  const sql = parser.parse(
    'SELECT departmentId, MIN(salary) FROM Doctor GROUP BY Doctor.departmentId'
  );
  const action = exprFromSql(sql.value, {Doctor: ['salary', 'departmentId']});
  expect(() => reducer({}, action)).not.toThrow();
});

/** @test {relexp} */
it('converts a GROUP BY with COUNT aggregate', () => {
  const sql = parser.parse(
    'SELECT COUNT(salary) FROM Doctor GROUP BY departmentId'
  );
  const action = exprFromSql(sql.value, {Doctor: ['salary', 'departmentId']});
  expect(reducer({}, action)).toMatchObject({
    expr: {
      group_by: {
        arguments: {
          groupBy: ['departmentId'],
          aggregates: [
            {
              aggregate: {
                function: 'COUNT',
                column: 'salary',
              },
            },
          ],
          selectColumns: [],
        },
      },
    },
  });
});

/** @test {relexp} */
it('converts a GROUP BY with STDEV aggregate', () => {
  const sql = parser.parse(
    'SELECT STDEV(salary) FROM Doctor GROUP BY departmentId'
  );
  const action = exprFromSql(sql.value, {Doctor: ['salary', 'departmentId']});
  expect(reducer({}, action)).toMatchObject({
    expr: {
      group_by: {
        arguments: {
          groupBy: ['departmentId'],
          aggregates: [
            {
              aggregate: {
                function: 'STDEV',
                column: 'salary',
              },
            },
          ],
          selectColumns: [],
        },
      },
    },
  });
});

// HAVING Clause Tests

/** @test {relexp} */
it('converts a GROUP BY with HAVING clause using aggregate function', () => {
  const sql = parser.parse(
    'SELECT departmentId, COUNT(*) FROM Doctor GROUP BY departmentId HAVING COUNT(*) > 5'
  );
  const action = exprFromSql(sql.value, {
    Doctor: ['id', 'salary', 'departmentId'],
  });
  expect(reducer({}, action)).toMatchObject({
    expr: {
      selection: {
        arguments: {
          select: {
            cmp: {
              lhs: 'COUNT(*)',
              op: '$gt',
              rhs: '5',
            },
          },
        },
        children: [
          {
            group_by: {
              arguments: {
                groupBy: ['departmentId'],
                aggregates: [
                  {
                    aggregate: {
                      function: 'COUNT',
                      column: '*',
                    },
                  },
                ],
                selectColumns: ['departmentId'],
              },
              children: [{relation: 'Doctor'}],
            },
          },
        ],
      },
    },
  });
});

/** @test {relexp} */
it('converts a GROUP BY with HAVING clause using multiple aggregate functions', () => {
  const sql = parser.parse(
    'SELECT departmentId, COUNT(*), AVG(salary) FROM Doctor GROUP BY departmentId HAVING COUNT(*) > 3 AND AVG(salary) > 50000'
  );
  const action = exprFromSql(sql.value, {
    Doctor: ['id', 'salary', 'departmentId'],
  });
  expect(reducer({}, action)).toMatchObject({
    expr: {
      selection: {
        arguments: {
          select: {
            and: {
              clauses: [
                {
                  cmp: {
                    lhs: 'COUNT(*)',
                    op: '$gt',
                    rhs: '3',
                  },
                },
                {
                  cmp: {
                    lhs: 'AVG(salary)',
                    op: '$gt',
                    rhs: '50000',
                  },
                },
              ],
            },
          },
        },
        children: [
          {
            group_by: {
              arguments: {
                groupBy: ['departmentId'],
                aggregates: [
                  {
                    aggregate: {
                      function: 'COUNT',
                      column: '*',
                    },
                  },
                  {
                    aggregate: {
                      function: 'AVG',
                      column: 'salary',
                    },
                  },
                ],
                selectColumns: ['departmentId'],
              },
              children: [{relation: 'Doctor'}],
            },
          },
        ],
      },
    },
  });
});

/** @test {relexp} */
it('converts a GROUP BY with HAVING clause using GROUP BY column', () => {
  const sql = parser.parse(
    'SELECT departmentId, COUNT(*) FROM Doctor GROUP BY departmentId HAVING departmentId = 1'
  );
  const action = exprFromSql(sql.value, {
    Doctor: ['id', 'salary', 'departmentId'],
  });
  expect(reducer({}, action)).toMatchObject({
    expr: {
      selection: {
        arguments: {
          select: {
            cmp: {
              lhs: 'departmentId',
              op: '$eq',
              rhs: '1',
            },
          },
        },
        children: [
          {
            group_by: {
              arguments: {
                groupBy: ['departmentId'],
                aggregates: [
                  {
                    aggregate: {
                      function: 'COUNT',
                      column: '*',
                    },
                  },
                ],
                selectColumns: ['departmentId'],
              },
              children: [{relation: 'Doctor'}],
            },
          },
        ],
      },
    },
  });
});

/** @test {relexp} */
it('throws error when HAVING clause references column not in GROUP BY', () => {
  const sql = parser.parse(
    'SELECT departmentId, COUNT(*) FROM Doctor GROUP BY departmentId HAVING salary > 50000'
  );
  const action = exprFromSql(sql.value, {
    Doctor: ['id', 'salary', 'departmentId'],
  });
  expect(() => reducer({}, action)).toThrow(
    "Column 'salary' in HAVING clause must appear in the GROUP BY clause or be used in an aggregate function"
  );
});

/** @test {relexp} */
it('throws error when HAVING clause uses non-aggregate function', () => {
  const sql = parser.parse(
    'SELECT departmentId, COUNT(*) FROM Doctor GROUP BY departmentId HAVING UPPER(departmentId) = "CARDIOLOGY"'
  );
  const action = exprFromSql(sql.value, {
    Doctor: ['id', 'salary', 'departmentId'],
  });
  expect(() => reducer({}, action)).toThrow(
    "Function 'UPPER' is not allowed in HAVING clause"
  );
});

/** @test {relexp} */
it('converts HAVING with BETWEEN predicate using aggregate', () => {
  const sql = parser.parse(
    'SELECT departmentId, AVG(salary) FROM Doctor GROUP BY departmentId HAVING AVG(salary) BETWEEN 40000 AND 80000'
  );
  const action = exprFromSql(sql.value, {
    Doctor: ['id', 'salary', 'departmentId'],
  });
  expect(reducer({}, action)).toMatchObject({
    expr: {
      selection: {
        arguments: {
          select: {
            and: {
              clauses: [
                {
                  cmp: {
                    lhs: 'AVG(salary)',
                    op: '$gte',
                    rhs: '40000',
                  },
                },
                {
                  cmp: {
                    lhs: 'AVG(salary)',
                    op: '$lte',
                    rhs: '80000',
                  },
                },
              ],
            },
          },
        },
      },
    },
  });
});

/** @test {relexp} */
it('converts HAVING with OR condition using aggregates', () => {
  const sql = parser.parse(
    'SELECT departmentId, COUNT(*), MAX(salary) FROM Doctor GROUP BY departmentId HAVING COUNT(*) < 2 OR MAX(salary) > 100000'
  );
  const action = exprFromSql(sql.value, {
    Doctor: ['id', 'salary', 'departmentId'],
  });
  expect(reducer({}, action)).toMatchObject({
    expr: {
      selection: {
        arguments: {
          select: {
            or: {
              clauses: [
                {
                  cmp: {
                    lhs: 'COUNT(*)',
                    op: '$lt',
                    rhs: '2',
                  },
                },
                {
                  cmp: {
                    lhs: 'MAX(salary)',
                    op: '$gt',
                    rhs: '100000',
                  },
                },
              ],
            },
          },
        },
      },
    },
  });
});

/** @test {relexp} */
it('adds projection when HAVING uses aggregates not in SELECT', () => {
  const sql = parser.parse(
    'SELECT departmentId, MIN(salary) FROM Doctor GROUP BY departmentId HAVING COUNT(*) > 3'
  );
  const action = exprFromSql(sql.value, {
    Doctor: ['id', 'salary', 'departmentId'],
  });
  expect(reducer({}, action)).toMatchObject({
    expr: {
      projection: {
        arguments: {
          project: ['departmentId', 'MIN(salary)'],
        },
        children: [
          {
            selection: {
              arguments: {
                select: {
                  cmp: {
                    lhs: 'COUNT(*)',
                    op: '$gt',
                    rhs: '3',
                  },
                },
              },
              children: [
                {
                  group_by: {
                    arguments: {
                      groupBy: ['departmentId'],
                      aggregates: [
                        {
                          aggregate: {
                            function: 'MIN',
                            column: 'salary',
                          },
                        },
                        {
                          aggregate: {
                            function: 'COUNT',
                            column: '*',
                          },
                        },
                      ],
                      selectColumns: ['departmentId'],
                    },
                    children: [{relation: 'Doctor'}],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });
});
