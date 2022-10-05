import {exprToString} from './util';

/** @test {and} */
it('renders an and', () => {
  const container = exprToString(
    {
      and: {
        clauses: [
          {cmp: {lhs: 'bar', op: '$gt', rhs: '1'}},
          {cmp: {lhs: 'baz', op: '$lt', rhs: '3'}},
        ],
      },
    },
    true
  );
  expect(container).toContain('bar > 1 ∧ baz < 3');
});

/** @test {or} */
it('renders an or', () => {
  const container = exprToString(
    {
      or: {
        clauses: [
          {cmp: {lhs: 'bar', op: '$gte', rhs: '1'}},
          {cmp: {lhs: 'baz', op: '$lte', rhs: '3'}},
        ],
      },
    },
    true
  );
  expect(container).toContain('bar >= 1 ∨ baz <= 3');
});

/** @test {or} */
it('renders a not', () => {
  const container = exprToString(
    {
      not: {
        clause: {cmp: {lhs: 'bar', op: '$eq', rhs: '1'}},
      },
    },
    true
  );
  expect(container).toContain('¬(bar = 1)');
});
