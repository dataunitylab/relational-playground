import reducer from './data';
import {changeExpr} from './data';

const sourceData = {
  foo: {
    name: 'foo',
    columns: ['bar', 'baz'],
    data: [
      {bar: 1, baz: 2},
      {bar: 3, baz: 4},
      {bar: 5, baz: 6},
    ],
  },
  corge: {
    name: 'corge',
    columns: ['grault'],
    data: [{grault: 7}, {grault: 8}],
  },
  garply: {
    name: 'garply',
    columns: ['waldo'],
    data: [{waldo: 7}, {waldo: 9}],
  },
  rome: {
    name: 'rome',
    columns: ['julius', 'marcus'],
    data: [
      {julius: 5, marcus: 4},
      {julius: 1, marcus: 8},
      {julius: 1, marcus: 6},
      {julius: 3, marcus: 2},
    ],
  },
};

/** @test {data} */
it('can evaluate a simple relation', () => {
  const expr = {relation: 'foo'};
  const action = changeExpr(expr);
  const current = reducer({sourceData: sourceData}, action).current;
  expect(current).toStrictEqual(sourceData.foo);
});

/** @test {data} */
it('can evaluate a projection', () => {
  const expr = {
    projection: {
      arguments: {project: ['bar']},
      children: [{relation: 'foo'}],
    },
  };
  const action = changeExpr(expr);
  const current = reducer({sourceData: sourceData}, action).current;

  expect(current.columns).toStrictEqual(['bar']);
  expect(current.data).toStrictEqual([{bar: 1}, {bar: 3}, {bar: 5}]);
});

/** @test {data} */
it('can evaluate a projection with dots', () => {
  const expr = {
    projection: {
      arguments: {project: ['foo.bar']},
      children: [{relation: 'foo'}],
    },
  };
  const action = changeExpr(expr);
  const current = reducer({sourceData: sourceData}, action).current;

  expect(current.columns).toStrictEqual(['bar']);
  expect(current.data).toStrictEqual([{bar: 1}, {bar: 3}, {bar: 5}]);
});

/** @test {data} */
it('can evaluate a rename', () => {
  const expr = {
    rename: {
      arguments: {rename: {columns: {bar: 'quux'}}},
      children: [{relation: 'foo'}],
    },
  };
  const action = changeExpr(expr);
  const current = reducer({sourceData: sourceData}, action).current;

  expect(current.columns).toStrictEqual(['quux', 'baz']);
  expect(current.data).toStrictEqual([
    {quux: 1, baz: 2},
    {quux: 3, baz: 4},
    {quux: 5, baz: 6},
  ]);
});
/** @test {data} */
it('can evaluate a difference', () => {
  const expr = {
    except: {
      left: {relation: 'corge'},
      right: {relation: 'garply'},
      distinct: true,
    },
  };
  const action = changeExpr(expr);
  const current = reducer({sourceData: sourceData}, action).current;

  expect(current.columns).toStrictEqual(['grault']);
  expect(current.data).toStrictEqual([{grault: 8}]);
});

/** @test {data} */
it('can evaluate an intersection', () => {
  const expr = {
    intersect: {
      left: {relation: 'corge'},
      right: {relation: 'garply'},
      distinct: true,
    },
  };
  const action = changeExpr(expr);
  const current = reducer({sourceData: sourceData}, action).current;

  expect(current.columns).toStrictEqual(['grault']);
  expect(current.data).toStrictEqual([{grault: 7}]);
});

/** @test {data} */
it('can evaluate a distinct union', () => {
  const expr = {
    union: {
      left: {relation: 'corge'},
      right: {relation: 'garply'},
      distinct: true,
    },
  };
  const action = changeExpr(expr);
  const current = reducer({sourceData: sourceData}, action).current;

  expect(current.columns).toStrictEqual(['grault']);
  expect(current.data).toStrictEqual([{grault: 7}, {grault: 8}, {grault: 9}]);
});

/** @test {data} */
it('can evaluate a union', () => {
  const expr = {
    union: {
      left: {relation: 'corge'},
      right: {relation: 'garply'},
      distinct: false,
    },
  };
  const action = changeExpr(expr);
  const current = reducer({sourceData: sourceData}, action).current;

  expect(current.columns).toStrictEqual(['grault']);
  expect(current.data).toStrictEqual([
    {grault: 7},
    {grault: 8},
    {grault: 7},
    {grault: 9},
  ]);
});

/** @test {data} */
it('can evaluate a default (ascending) sorting', () => {
  const expr = {
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
  };
  const action = changeExpr(expr);
  const current = reducer({sourceData: sourceData}, action).current;

  expect(current.columns).toStrictEqual(['bar', 'baz']);
  expect(current.data).toStrictEqual([
    {bar: 1, baz: 2},
    {bar: 3, baz: 4},
    {bar: 5, baz: 6},
  ]);
});

/** @test {data} */
it('can evaluate a descending sorting', () => {
  const expr = {
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
  };
  const action = changeExpr(expr);
  const current = reducer({sourceData: sourceData}, action).current;

  expect(current.columns).toStrictEqual(['bar', 'baz']);
  expect(current.data).toStrictEqual([
    {bar: 5, baz: 6},
    {bar: 3, baz: 4},
    {bar: 1, baz: 2},
  ]);
});

/** @test {data} */
it('converts a sorting on multiple column conditions', () => {
  const expr = {
    order_by: {
      arguments: {
        order_by: [
          {
            ascending: false,
            column_name: 'julius',
          },
          {
            ascending: true,
            column_name: 'marcus',
          },
        ],
      },
      children: [{relation: 'rome'}],
    },
  };
  const action = changeExpr(expr);
  const current = reducer({sourceData: sourceData}, action).current;

  expect(current.columns).toStrictEqual(['julius', 'marcus']);
  expect(current.data).toStrictEqual([
    {julius: 5, marcus: 4},
    {julius: 3, marcus: 2},
    {julius: 1, marcus: 6},
    {julius: 1, marcus: 8},
  ]);
});

/** @test {data} */
it('can evaluate an inner join', () => {
  const expr = {
    join: {
      left: {relation: 'foo'},
      right: {relation: 'corge'},
      type: 'inner',
      condition: {cmp: {lhs: 'bar', op: '$gt', rhs: '1'}},
    },
  };
  const action = changeExpr(expr);
  const current = reducer({sourceData: sourceData}, action).current;

  expect(current.columns).toStrictEqual(['bar', 'baz', 'grault']);
  expect(current.data).toStrictEqual([
    {bar: 3, baz: 4, grault: 7},
    {bar: 3, baz: 4, grault: 8},
    {bar: 5, baz: 6, grault: 7},
    {bar: 5, baz: 6, grault: 8},
  ]);
});

/** @test {data} */
it('can project after multiple joins', () => {
  const expr = {
    projection: {
      arguments: {project: ['bar', 'waldo']},
      children: [
        {
          join: {
            left: {
              join: {
                left: {relation: 'foo'},
                right: {relation: 'corge'},
                type: 'inner',
                condition: {cmp: {lhs: 'bar', op: '$gt', rhs: '1'}},
              },
            },
            right: {relation: 'garply'},
            type: 'inner',
            condition: {cmp: {lhs: 'grault', op: '$eq', rhs: 'waldo'}},
          },
        },
      ],
    },
  };
  const action = changeExpr(expr);
  const current = reducer({sourceData: sourceData}, action).current;

  expect(current.columns).toStrictEqual(['bar', 'waldo']);
  expect(current.data).toStrictEqual([
    {bar: 3, waldo: 7},
    {bar: 5, waldo: 7},
  ]);
});

it('can evaluate an left join', () => {
  const expr = {
    join: {
      left: {relation: 'foo'},
      right: {relation: 'corge'},
      type: 'left',
      condition: {cmp: {lhs: 'bar', op: '$gt', rhs: '1'}},
    },
  };
  const action = changeExpr(expr);
  const current = reducer({sourceData: sourceData}, action).current;

  expect(current.columns).toStrictEqual(['bar', 'baz', 'grault']);
  expect(current.data).toStrictEqual([
    {bar: 1, baz: 2, grault: null},
    {bar: 3, baz: 4, grault: 7},
    {bar: 3, baz: 4, grault: 8},
    {bar: 5, baz: 6, grault: 7},
    {bar: 5, baz: 6, grault: 8},
  ]);
});

it('can evaluate an right join', () => {
  const expr = {
    join: {
      left: {relation: 'foo'},
      right: {relation: 'corge'},
      type: 'right',
      condition: {cmp: {lhs: 'grault', op: '$gt', rhs: '7'}},
    },
  };
  const action = changeExpr(expr);
  const current = reducer({sourceData: sourceData}, action).current;

  expect(current.columns).toStrictEqual(['bar', 'baz', 'grault']);
  expect(current.data).toStrictEqual([
    {bar: null, baz: null, grault: 7},
    {bar: 1, baz: 2, grault: 8},
    {bar: 3, baz: 4, grault: 8},
    {bar: 5, baz: 6, grault: 8},
  ]);
});

/** @test {data} */
it('can evaluate a cross-product', () => {
  const expr = {
    product: {
      left: {relation: 'foo'},
      right: {relation: 'corge'},
    },
  };
  const action = changeExpr(expr);
  const current = reducer({sourceData: sourceData}, action).current;

  expect(current.columns).toStrictEqual(['bar', 'baz', 'grault']);
  expect(current.data).toStrictEqual([
    {bar: 1, baz: 2, grault: 7},
    {bar: 1, baz: 2, grault: 8},
    {bar: 3, baz: 4, grault: 7},
    {bar: 3, baz: 4, grault: 8},
    {bar: 5, baz: 6, grault: 7},
    {bar: 5, baz: 6, grault: 8},
  ]);
});

// The test parameters below are the operator, the value for comparison,
// and finally the indexes of the rows which should be included
const operatorTests = [
  [{cmp: {lhs: 'bar', op: '$gt', rhs: '1'}}, [1, 2]],
  [{cmp: {lhs: 'bar', op: '$gte', rhs: '1'}}, [0, 1, 2]],
  [{cmp: {lhs: 'bar', op: '$lt', rhs: '1'}}, []],
  [{cmp: {lhs: 'bar', op: '$lte', rhs: '1'}}, [0]],
  [{cmp: {lhs: 'bar', op: '$eq', rhs: '1'}}, [0]],
  [{cmp: {lhs: 'bar', op: '$ne', rhs: '1'}}, [1, 2]],
  [{cmp: {lhs: '1', op: '$ne', rhs: 'bar'}}, [1, 2]],

  [
    {
      or: {
        clauses: [
          {cmp: {lhs: '1', op: '$ne', rhs: 'bar'}},
          {cmp: {lhs: 'bar', op: '$eq', rhs: '1'}},
        ],
      },
    },
    [0, 1, 2],
  ],

  [
    {
      and: {
        clauses: [
          {cmp: {lhs: 'bar', op: '$gte', rhs: '1'}},
          {cmp: {lhs: 'bar', op: '$eq', rhs: '1'}},
        ],
      },
    },
    [0],
  ],

  [
    {
      and: {
        clauses: [
          {
            or: {
              clauses: [
                {cmp: {lhs: '1', op: '$ne', rhs: 'bar'}},
                {cmp: {lhs: 'bar', op: '$eq', rhs: '1'}},
              ],
            },
          },
          {
            or: {
              clauses: [
                {cmp: {lhs: 'bar', op: '$eq', rhs: '1'}},
                {cmp: {lhs: 'bar', op: '$gt', rhs: '3'}},
              ],
            },
          },
        ],
      },
    },
    [0, 2],
  ],

  [
    {
      or: {
        clauses: [
          {
            and: {
              clauses: [
                {cmp: {lhs: 'bar', op: '$gte', rhs: '1'}},
                {cmp: {lhs: 'bar', op: '$ne', rhs: '1'}},
              ],
            },
          },
          {
            and: {
              clauses: [
                {cmp: {lhs: 'bar', op: '$gte', rhs: '1'}},
                {cmp: {lhs: 'bar', op: '$eq', rhs: '1'}},
              ],
            },
          },
        ],
      },
    },
    [0, 1, 2],
  ],

  [
    {
      not: {
        clause: {cmp: {lhs: 'bar', op: '$eq', rhs: '1'}},
      },
    },
    [1, 2],
  ],
];

/** @test {data} */
it.each(operatorTests)(
  'it can evaluate a selection with the condition %o',
  (condExpr, includeRows) => {
    const expr = {
      selection: {
        arguments: {select: condExpr},
        children: [{relation: 'foo'}],
      },
    };
    const action = changeExpr(expr);
    const current = reducer({sourceData: sourceData}, action).current;

    expect(current.columns).toStrictEqual(sourceData.foo.columns);
    expect(current.data).toStrictEqual(
      includeRows.map((i) => sourceData.foo.data[i])
    );
  }
);

// Test data for GROUP BY operations
const groupSourceData = {
  Doctor: {
    name: 'Doctor',
    columns: ['id', 'name', 'salary', 'departmentId'],
    data: [
      {id: 1, name: 'Alice', salary: 100000, departmentId: 1},
      {id: 2, name: 'Bob', salary: 120000, departmentId: 1},
      {id: 3, name: 'Charlie', salary: 90000, departmentId: 2},
      {id: 4, name: 'Diana', salary: 110000, departmentId: 2},
      {id: 5, name: 'Eve', salary: 95000, departmentId: 3},
    ],
  },
  Department: {
    name: 'Department',
    columns: ['id', 'name'],
    data: [
      {id: 1, name: 'Cardiology'},
      {id: 2, name: 'Neurology'},
      {id: 3, name: 'Orthopedics'},
    ],
  },
};

// GROUP BY Data Execution Tests
/** @test {data} */
it('can evaluate GROUP BY with aggregate only', () => {
  const expr = {
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
  };
  const action = changeExpr(expr);
  const current = reducer({sourceData: groupSourceData}, action).current;

  expect(current.columns).toStrictEqual(['MIN(salary)']);
  expect(current.data).toHaveLength(3); // 3 departments
  expect(current.data).toEqual(
    expect.arrayContaining([
      expect.objectContaining({'MIN(salary)': 100000}), // dept 1
      expect.objectContaining({'MIN(salary)': 90000}), // dept 2
      expect.objectContaining({'MIN(salary)': 95000}), // dept 3
    ])
  );
});

/** @test {data} */
it('can evaluate GROUP BY with mixed columns and aggregates', () => {
  const expr = {
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
  };
  const action = changeExpr(expr);
  const current = reducer({sourceData: groupSourceData}, action).current;

  expect(current.columns).toStrictEqual(['departmentId', 'MAX(salary)']);
  expect(current.data).toHaveLength(3);
  expect(current.data).toEqual(
    expect.arrayContaining([
      {departmentId: '1', 'MAX(salary)': 120000},
      {departmentId: '2', 'MAX(salary)': 110000},
      {departmentId: '3', 'MAX(salary)': 95000},
    ])
  );
});

/** @test {data} */
it('can evaluate GROUP BY with multiple aggregates', () => {
  const expr = {
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
  };
  const action = changeExpr(expr);
  const current = reducer({sourceData: groupSourceData}, action).current;

  expect(current.columns).toStrictEqual([
    'MIN(salary)',
    'MAX(salary)',
    'AVG(salary)',
  ]);
  expect(current.data).toHaveLength(3);

  // Check department 1 (Alice: 100000, Bob: 120000)
  const dept1 = current.data.find(
    (row) => row['MIN(salary)'] === 100000 && row['MAX(salary)'] === 120000
  );
  expect(dept1).toBeDefined();
  expect(dept1['AVG(salary)']).toBe(110000); // (100000 + 120000) / 2
});

/** @test {data} */
it('can evaluate aggregate without GROUP BY (implicit grouping)', () => {
  const expr = {
    group_by: {
      arguments: {
        groupBy: [],
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
  };
  const action = changeExpr(expr);
  const current = reducer({sourceData: groupSourceData}, action).current;

  expect(current.columns).toStrictEqual(['SUM(salary)']);
  expect(current.data).toHaveLength(1); // Single group for entire table
  expect(current.data[0]['SUM(salary)']).toBe(515000); // Sum of all salaries
});

/** @test {data} */
it('can evaluate GROUP BY with qualified column names', () => {
  const expr = {
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
  };
  const action = changeExpr(expr);
  const current = reducer({sourceData: groupSourceData}, action).current;

  expect(current.columns).toStrictEqual(['departmentId', 'MIN(Doctor.salary)']);
  expect(current.data).toHaveLength(3);
  expect(current.data).toEqual(
    expect.arrayContaining([
      {departmentId: '1', 'MIN(Doctor.salary)': 100000},
      {departmentId: '2', 'MIN(Doctor.salary)': 90000},
      {departmentId: '3', 'MIN(Doctor.salary)': 95000},
    ])
  );
});

/** @test {data} */
it('handles all aggregate functions correctly', () => {
  const functions = ['MIN', 'MAX', 'AVG', 'SUM'];
  const expectedResults = {
    MIN: 90000, // Charlie's salary
    MAX: 120000, // Bob's salary
    AVG: 103000, // (100000 + 120000 + 90000 + 110000 + 95000) / 5
    SUM: 515000, // Sum of all salaries
  };

  for (const func of functions) {
    const expr = {
      group_by: {
        arguments: {
          groupBy: [],
          aggregates: [
            {
              aggregate: {
                function: func,
                column: 'salary',
              },
            },
          ],
          selectColumns: [],
        },
        children: [{relation: 'Doctor'}],
      },
    };
    const action = changeExpr(expr);
    const current = reducer({sourceData: groupSourceData}, action).current;

    expect(current.data).toHaveLength(1);
    expect(current.data[0][`${func}(salary)`]).toBe(expectedResults[func]);
  }
});

/** @test {data} */
it('maintains correct group separation', () => {
  const expr = {
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
        selectColumns: ['departmentId'],
      },
      children: [{relation: 'Doctor'}],
    },
  };
  const action = changeExpr(expr);
  const current = reducer({sourceData: groupSourceData}, action).current;

  expect(current.data).toHaveLength(3);
  expect(current.data).toEqual(
    expect.arrayContaining([
      {departmentId: '1', 'SUM(salary)': 220000}, // Alice + Bob
      {departmentId: '2', 'SUM(salary)': 200000}, // Charlie + Diana
      {departmentId: '3', 'SUM(salary)': 95000}, // Eve only
    ])
  );
});

// HAVING Clause Data Execution Tests

/** @test {data} */
it('can evaluate HAVING clause with COUNT aggregate', () => {
  const expr = {
    selection: {
      arguments: {
        select: {
          cmp: {
            lhs: 'COUNT(*)',
            op: '$gt',
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
  };
  const action = changeExpr(expr);
  const current = reducer({sourceData: groupSourceData}, action).current;

  expect(current.columns).toStrictEqual(['departmentId', 'COUNT(*)']);
  expect(current.data).toHaveLength(2); // Only departments with > 1 doctor
  expect(current.data).toEqual(
    expect.arrayContaining([
      {departmentId: '1', 'COUNT(*)': 2}, // dept 1 has Alice and Bob
      {departmentId: '2', 'COUNT(*)': 2}, // dept 2 has Charlie and Diana
      // dept 3 (Eve) excluded because COUNT(*) = 1
    ])
  );
});

/** @test {data} */
it('can evaluate HAVING clause with AVG aggregate', () => {
  const expr = {
    selection: {
      arguments: {
        select: {
          cmp: {
            lhs: 'AVG(salary)',
            op: '$gt',
            rhs: '100000',
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
  };
  const action = changeExpr(expr);
  const current = reducer({sourceData: groupSourceData}, action).current;

  expect(current.columns).toStrictEqual(['departmentId', 'AVG(salary)']);
  expect(current.data).toHaveLength(1); // Only department with AVG(salary) > 100000
  expect(current.data).toEqual([
    {departmentId: '1', 'AVG(salary)': 110000}, // dept 1: (100000 + 120000) / 2 = 110000
    // dept 2: (90000 + 110000) / 2 = 100000 (not > 100000)
    // dept 3: 95000 (not > 100000)
  ]);
});

/** @test {data} */
it('can evaluate HAVING clause with complex condition using AND', () => {
  const expr = {
    selection: {
      arguments: {
        select: {
          and: {
            clauses: [
              {
                cmp: {
                  lhs: 'COUNT(*)',
                  op: '$gt',
                  rhs: '1',
                },
              },
              {
                cmp: {
                  lhs: 'MAX(salary)',
                  op: '$gt',
                  rhs: '110000',
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
      ],
    },
  };
  const action = changeExpr(expr);
  const current = reducer({sourceData: groupSourceData}, action).current;

  expect(current.columns).toStrictEqual([
    'departmentId',
    'COUNT(*)',
    'MAX(salary)',
  ]);
  expect(current.data).toHaveLength(1); // Only departments with COUNT(*) > 1 AND MAX(salary) > 110000
  expect(current.data).toEqual([
    {departmentId: '1', 'COUNT(*)': 2, 'MAX(salary)': 120000}, // dept 1: COUNT=2, MAX=120000
    // dept 2: COUNT=2, MAX=110000 (not > 110000)
    // dept 3: COUNT=1 (not > 1)
  ]);
});

/** @test {data} */
it('can evaluate HAVING with extra aggregates not in SELECT', () => {
  const expr = {
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
  };
  const action = changeExpr(expr);
  const current = reducer({sourceData: groupSourceData}, action).current;

  expect(current.columns).toStrictEqual(['departmentId', 'MIN(salary)']);
  expect(current.data).toHaveLength(2); // Only departments with COUNT(*) > 1
  expect(current.data).toEqual(
    expect.arrayContaining([
      {departmentId: '1', 'MIN(salary)': 100000}, // dept 1 min salary
      {departmentId: '2', 'MIN(salary)': 90000}, // dept 2 min salary
      // dept 3 (Eve) excluded because COUNT(*) = 1
    ])
  );
});
