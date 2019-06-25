import reducer from './data';
import {changeExpr} from './data';

const sourceData = {
  foo: {
    name: 'foo',
    columns: ['bar', 'baz'],
    data: [{bar: 1, baz: 2}, {bar: 3, baz: 4}, {bar: 5, baz: 6}],
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

// The test parameters below are the operator, the value for comparison,
// and finally the indexes of the rows which should be included
const operatorTests = [
  ['$gt', '1', [1, 2]],
  ['$gte', '1', [0, 1, 2]],
  ['$lt', '1', []],
  ['$lte', '1', [0]],
  ['$eq', '1', [0]],
  ['$ne', '1', [1, 2]],
];

/** @test {data} */
it.each(operatorTests)(
  'it can evaluate a selection with the condition %s %s',
  (op, value, includeRows) => {
    const expr = {
      selection: {
        arguments: {select: [{bar: {[op]: value}}]},
        children: [{relation: 'foo'}],
      },
    };
    const action = changeExpr(expr);
    const current = reducer({sourceData: sourceData}, action).current;

    expect(current.columns).toStrictEqual(sourceData.foo.columns);
    expect(current.data).toStrictEqual(
      includeRows.map(i => sourceData.foo.data[i])
    );
  }
);
