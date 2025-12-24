import React from 'react';
import {render, fireEvent} from '@testing-library/react';

import RelExprTree from './RelExprTree';
import {Selection} from './RelOp';

/** @test {RelExprTree} */
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
  const {asFragment} = render(
    <RelExprTree expr={expr} changeExpr={jest.fn()} />
  );
  expect(asFragment()).toMatchSnapshot();
});

const condTests = [
  ['$gte', '>='],
  ['$gt', '>'],
  ['$lt', '<'],
  ['$lte', '<='],
  ['$ne', '!='],
  ['$eq', '='],
];

/** @test {RelExprTree} */
it.each(condTests)('it correctly renders a %s condition as %s', (op, str) => {
  const expr = {
    selection: {
      arguments: {select: {cmp: {lhs: 'salary', op: op, rhs: 130000}}},
      children: [{relation: 'Doctor'}],
    },
  };
  const {container} = render(
    <RelExprTree expr={expr} changeExpr={jest.fn()} />
  );
  expect(container).toHaveTextContent('salary ' + str + ' 130000');
});

/** @test {RelExprTree} */
it('produces an error for an invalid expression', () => {
  const errorObject = console.error;
  console.error = jest.fn();

  expect(() => {
    render(<RelExprTree expr={{invalidExpr: 42}} changeExpr={jest.fn()} />);
  }).toThrow();

  console.error = errorObject;
});

/** @test {RelExprTree} */
it('doesnt change the expression when clicked and relation', () => {
  const mockAction = jest.fn();
  const mockEvent = jest.fn();
  const expr = {relation: 'foo'};
  const {container} = render(
    <RelExprTree
      ReactGA={{event: mockEvent}}
      expr={expr}
      changeExpr={mockAction}
    />
  );

  // Click on the expression
  fireEvent.click(container.firstChild);

  // An action changing the expression should fire
  // Should not have action attached when type relation
  expect(mockAction.mock.calls.length).toBe(0);

  // Don't expect analytics on a relation
  expect(mockEvent.mock.calls.length).toBe(0);
});

/** @test {RelExprTree} */
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
  const {container} = render(
    <RelExprTree
      ReactGA={{event: mockEvent}}
      expr={expr}
      changeExpr={mockAction}
    />
  );

  // Click on the first li element (tree structure)
  const firstLi = container.querySelector('li');
  fireEvent.click(firstLi);

  // An action changing the expression should fire
  expect(mockAction.mock.calls.length).toBe(1);
  expect(mockAction.mock.calls[0][0]).toBe(expr);

  // And also an analytics event
  expect(mockEvent.mock.calls.length).toBe(1);
  expect(mockEvent.mock.calls[0][0].category).toBe(
    'User Selecting Relational Algebra Tree'
  );
  expect(mockEvent.mock.calls[0][0].action).toBe('selection');
});
