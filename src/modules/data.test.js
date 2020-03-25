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
      arguments: {rename: {bar: 'quux'}},
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
it('can evaluate a join', () => {
  const expr = {
    join: {
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
