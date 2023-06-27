import React from 'react';
import {mount} from 'enzyme';
import {render} from '@testing-library/react';
import each from 'jest-each';

import {
  UnaryRelOp,
  Projection,
  Rename,
  Selection,
  BinaryRelOp,
  Except,
  Intersect,
  Product,
  Join,
  Union,
} from './RelOp';

each([
  ['unary operators', <UnaryRelOp />],
  ['binary operators', <BinaryRelOp />],
]).test('%s should add (and remove) a class on hover', (opType, relOp) => {
  const wrapper = mount(relOp);

  // Hovering class should be off by default
  expect(wrapper.hasClass('hovering')).toBeFalsy();

  // Hovering should add the class and not propagate the event
  const mockStop = jest.fn();
  wrapper.simulate('mouseover', {type: 'mouseover', stopPropagation: mockStop});
  expect(wrapper.exists('.hovering')).toBeTruthy();
  expect(mockStop.mock.calls.length).toBe(1);

  // Mouse out should remove the class
  wrapper.simulate('mouseout', {type: 'mouseout', stopPropagation: jest.fn()});
  expect(wrapper.exists('.hovering')).toBeFalsy();
});

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
