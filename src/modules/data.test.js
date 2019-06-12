import reducer from './data';
import {changeExpr} from './data';

const sourceData = {
  foo: {
    name: 'foo',
    columns: ['bar', 'baz'],
    data: [{bar: 1, baz: 2}, {bar: 3, baz: 4}],
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
  expect(current.data).toStrictEqual([{bar: 1}, {bar: 3}]);
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
  expect(current.data).toStrictEqual([{quux: 1, baz: 2}, {quux: 3, baz: 4}]);
});

/** @test {data} */
it('can evaluate a selection', () => {
  const expr = {
    selection: {
      arguments: {select: [{bar: {$gt: '1'}}]},
      children: [{relation: 'foo'}],
    },
  };
  const action = changeExpr(expr);
  const current = reducer({sourceData: sourceData}, action).current;

  expect(current.columns).toStrictEqual(sourceData.foo.columns);
  expect(current.data).toStrictEqual([{bar: 3, baz: 4}]);
});
