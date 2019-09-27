import React from 'react';
import renderer from 'react-test-renderer';

import RelExpr from './RelExpr';
import {mount} from 'enzyme';

/** @test {RelExpr} */
it('correctly renders a complex expression', () => {
  const expr = {
    rename: {
      arguments: {rename: {firstName: 'name'}},
      children: [
        {
          projection: {
            arguments: {project: ['firstName', 'lastName']},
            children: [
              {
                selection: {
                  arguments: {select: [{salary: {$gt: 130000}}]},
                  children: [{relation: 'Doctor'}],
                },
              },
            ],
          },
        },
      ],
    },
  };
  const tree = renderer.create(<RelExpr expr={expr} />).toJSON();
  expect(tree).toMatchSnapshot();
});

/** @test {RelExpr} */
it('produces an error for an invalid expression', () => {
  expect(() => {
    renderer.create(<RelExpr expr={{invalidExpr: 42}} />);
  }).toThrow();
});

/** @test {RelExpr} */
it('changes the expression when clicked', () => {
  const mockAction = jest.fn();
  const mockEvent = jest.fn();
  const expr = {relation: 'foo'};
  const wrapper = mount(
    <RelExpr ReactGA={{event: mockEvent}} expr={expr} changeExpr={mockAction} />
  );

  // Click on the expression
  wrapper.simulate('click', {stopPropagation: jest.fn()});

  // An action changing the expression should fire
  //expect(mockAction.mock.calls.length).toBe(1);
  //expect(mockAction.mock.calls[0][0]).toBe(expr);

  // And also an analytics event
  expect(mockEvent.mock.calls.length).toBe(1);
  expect(mockEvent.mock.calls[0][0].category).toBe(
    'User Selecting Relational Algebra Enclosure'
  );
  expect(mockEvent.mock.calls[0][0].action).toBe('relation');
});
