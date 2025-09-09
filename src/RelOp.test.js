import React from 'react';
import {render} from '@testing-library/react';

import {
  Projection,
  Rename,
  Selection,
  Except,
  Intersect,
  Product,
  Join,
  Union,
  GroupBy,
} from './RelOp';

/** @test {Projection} */
it('renders a projection', () => {
  const {container} = render(<Projection project={['foo', 'bar']} />);
  expect(container).toContainHTML('π<sub>foo,bar</sub>');
});

/** @test {Rename} */
it('renders a Rename', () => {
  const {container} = render(<Rename rename={{columns: {foo: 'bar'}}} />);
  expect(container).toContainHTML('ρ<sub>foo/bar</sub>');
});

/** @test {Rename} */
it('renders a Rename with multiple fields', () => {
  const {container} = render(
    <Rename rename={{columns: {foo: 'bar', baz: 'quux'}}} />
  );
  expect(container).toContainHTML('ρ<sub>foo/bar,baz/quux</sub>');
});

/** @test {Selection} */
it('renders a Selection with single predicate', () => {
  const {container} = render(<Selection select={'foo=3'} />);
  expect(container).toContainHTML('σ<sub>foo=3</sub>');
});

/** @test {Selection} */
it('renders a Selection with multiple predicates', () => {
  const {container} = render(<Selection select={'foo=3 ∧ bar=2'} />);
  expect(container).toContainHTML('σ<sub>foo=3 ∧ bar=2</sub>');
});

/** @test {Except} */
it('renders a Except', () => {
  const {container} = render(<Except />);
  expect(container).toContainHTML('−');
});

/** @test {Intersect} */
it('renders a Intersect', () => {
  const {container} = render(<Intersect />);
  expect(container).toContainHTML('∩');
});

/** @test {Product} */
it('renders a Product', () => {
  const {container} = render(<Product />);
  expect(container).toContainHTML('×');
});

/** @test {Join} */
it('renders an inner Join', () => {
  const {container} = render(
    <Join type={'inner'} left={'A'} condition={'foo=3 ∧ bar=2'} right={'B'} />
  );
  expect(container).toContainHTML('A ⋈<sub>foo=3 ∧ bar=2</sub> B');
});

/** @test {Join} */
it('renders a left outer Join', () => {
  const {container} = render(
    <Join type={'left'} left={'A'} condition={'foo=3 ∧ bar=2'} right={'B'} />
  );
  expect(container).toContainHTML('A ⟕<sub>foo=3 ∧ bar=2</sub> B');
});

/** @test {Join} */
it('renders a right outer Join', () => {
  const {container} = render(
    <Join type={'right'} left={'A'} condition={'foo=3 ∧ bar=2'} right={'B'} />
  );
  expect(container).toContainHTML('⟖<sub>foo=3 ∧ bar=2</sub>');
});

/** @test {Union} */
it('renders a Union', () => {
  const {container} = render(<Union />);
  expect(container).toContainHTML('∪');
});

/** @test {GroupBy} */
it('renders GROUP BY with aggregate only (no grouping columns)', () => {
  const {container} = render(
    <GroupBy groupBy={[]} aggregates={['MIN(salary)']} selectColumns={[]} />
  );

  expect(container.textContent).toBe('γMIN(salary)');
});

/** @test {GroupBy} */
it('renders GROUP BY with grouping columns and aggregate', () => {
  const {container} = render(
    <GroupBy
      groupBy={['departmentId']}
      aggregates={['MAX(salary)']}
      selectColumns={[]}
    />
  );

  expect(container.textContent).toBe('departmentIdγMAX(salary)');
});

/** @test {GroupBy} */
it('renders GROUP BY with selected columns and aggregates', () => {
  const {container} = render(
    <GroupBy
      groupBy={['departmentId']}
      aggregates={['MIN(salary)']}
      selectColumns={['departmentId']}
    />
  );

  expect(container.textContent).toBe('departmentIdγdepartmentId,MIN(salary)');
});

/** @test {GroupBy} */
it('renders GROUP BY with multiple grouping columns', () => {
  const {container} = render(
    <GroupBy
      groupBy={['departmentId', 'category']}
      aggregates={['AVG(salary)']}
      selectColumns={['departmentId']}
    />
  );

  expect(container.textContent).toBe(
    'departmentId,categoryγdepartmentId,AVG(salary)'
  );
});

/** @test {GroupBy} */
it('renders GROUP BY with multiple aggregates', () => {
  const {container} = render(
    <GroupBy
      groupBy={['departmentId']}
      aggregates={['MIN(salary)', 'MAX(salary)', 'AVG(salary)']}
      selectColumns={[]}
    />
  );

  expect(container.textContent).toBe(
    'departmentIdγMIN(salary),MAX(salary),AVG(salary)'
  );
});

/** @test {GroupBy} */
it('renders GROUP BY with mixed select columns and aggregates', () => {
  const {container} = render(
    <GroupBy
      groupBy={['departmentId', 'category']}
      aggregates={['SUM(salary)']}
      selectColumns={['departmentId', 'category']}
    />
  );

  expect(container.textContent).toBe(
    'departmentId,categoryγdepartmentId,category,SUM(salary)'
  );
});

/** @test {GroupBy} */
it('handles qualified column names', () => {
  const {container} = render(
    <GroupBy
      groupBy={['Doctor.departmentId']}
      aggregates={['MIN(Doctor.salary)']}
      selectColumns={['departmentId']}
    />
  );

  expect(container.textContent).toBe(
    'Doctor.departmentIdγdepartmentId,MIN(Doctor.salary)'
  );
});

/** @test {GroupBy} */
it('renders correctly without selectColumns prop', () => {
  const {container} = render(
    <GroupBy groupBy={['departmentId']} aggregates={['MAX(salary)']} />
  );

  expect(container.textContent).toBe('departmentIdγMAX(salary)');
});
