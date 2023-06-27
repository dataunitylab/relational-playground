import React from 'react';
import renderer from 'react-test-renderer';

import RelExpr from './RelExpr';
import {Selection} from './RelOp';
import {mount} from 'enzyme';

/** @test {RelExpr} */
it('correctly renders a complex expression', () => {
  const expr = {
    rename: {
      arguments: {rename: {columns: {firstName: 'name'}}},
      children: [
        {
          projection: {
            arguments: {project: ['firstName', 'lastName']},
            children: [
              {
                selection: {
                  arguments: {
                    select: {cmp: {lhs: 'salary', op: '$gt', rhs: 130000}},
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
  const tree = renderer
    .create(<RelExpr expr={expr} changeExpr={jest.fn()} />)
    .toJSON();
  expect(tree).toMatchSnapshot();
});

const condTests = [
  ['$gte', '>='],
  ['$gt', '>'],
  ['$lt', '<'],
  ['$lte', '<='],
  ['$ne', '!='],
  ['$eq', '='],
];

/** @test {RelExpr} */
it.each(condTests)('it correctly renders a %s condition as %s', (op, str) => {
  const expr = {
    selection: {
      arguments: {select: {cmp: {lhs: 'salary', op: op, rhs: 130000}}},
      children: [{relation: 'Doctor'}],
    },
  };
  const wrapper = mount(<RelExpr expr={expr} changeExpr={jest.fn()} />);
  expect(wrapper.find(Selection).text()).toContain('salary ' + str + ' 130000');
});

/** @test {RelExpr} */
it('produces an error for an invalid expression', () => {
  const errorObject = console.error;
  console.error = jest.fn();

  expect(() => {
    renderer.create(
      <RelExpr expr={{invalidExpr: 42}} changeExpr={jest.fn()} />
    );
  }).toThrow();

  console.error = errorObject;
});

/** @test {RelExpr} */
it('doesnt change the expression when clicked and relation', () => {
  const mockAction = jest.fn();
  const mockEvent = jest.fn();
  const expr = {relation: 'foo'};
  const wrapper = mount(
    <RelExpr ReactGA={{event: mockEvent}} expr={expr} changeExpr={mockAction} />
  );

  // Click on the expression
  wrapper.simulate('click', {stopPropagation: jest.fn()});

  // An action changing the expression should fire
  // Should not have action attached when type relation
  expect(mockAction.mock.calls.length).toBe(0);

  // Don't expect analytics on a relation
  expect(mockEvent.mock.calls.length).toBe(0);
});

/** @test {RelExpr} */
it('changes the expression when clicked not relation', () => {
  const mockAction = jest.fn();
  const mockEvent = jest.fn();
  const expr = {
    selection: {
      arguments: {
        select: 'foo',
      },
      children: [{relation: 'bar'}],
    },
  };
  const wrapper = mount(
    <RelExpr ReactGA={{event: mockEvent}} expr={expr} changeExpr={mockAction} />
  );

  // Click on the expression
  wrapper.simulate('click', {stopPropagation: jest.fn()});

  // An action changing the expression should fire
  expect(mockAction.mock.calls.length).toBe(1);
  expect(mockAction.mock.calls[0][0]).toBe(expr);

  // And also an analytics event
  expect(mockEvent.mock.calls.length).toBe(1);
  expect(mockEvent.mock.calls[0][0].category).toBe(
    'User Selecting Relational Algebra Enclosure'
  );
  expect(mockEvent.mock.calls[0][0].action).toBe('selection');
});
