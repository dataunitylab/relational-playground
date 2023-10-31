import React from 'react';
import renderer from 'react-test-renderer';
import {Provider} from 'react-redux';
import configureStore from 'redux-mock-store';

import RelExpr from './RelExpr';
import {Selection} from './RelOp';
import {mount} from 'enzyme';

const mockStore = configureStore([]);

describe('RelExpr', () => {
  let store;

  beforeEach(() => {
    store = mockStore({data: {expr: {}}});
  });

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
      .create(
        <Provider store={store}>
          <RelExpr expr={expr} changeExpr={jest.fn()} />
        </Provider>
      )
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
    const wrapper = mount(
      <Provider store={store}>
        <RelExpr expr={expr} changeExpr={jest.fn()} />
      </Provider>
    );
    expect(wrapper.find(Selection).text()).toContain(
      'salary ' + str + ' 130000'
    );
  });

  /** @test {RelExpr} */
  it('produces an error for an invalid expression', () => {
    const errorObject = console.error;
    console.error = jest.fn();

    expect(() => {
      renderer.create(
        <Provider store={store}>
          <RelExpr expr={{invalidExpr: 42}} changeExpr={jest.fn()} />
        </Provider>
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
      <Provider store={store}>
        <RelExpr
          ReactGA={{event: mockEvent}}
          expr={expr}
          changeExpr={mockAction}
        />
      </Provider>
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
      <Provider store={store}>
        <RelExpr
          ReactGA={{event: mockEvent}}
          expr={expr}
          changeExpr={mockAction}
        />
      </Provider>
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

  /** @test {RelExpr} */
  it('should add (and remove) a class on hover', () => {
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
      <Provider store={store}>
        <RelExpr
          ReactGA={{event: mockEvent}}
          expr={expr}
          changeExpr={mockAction}
        />
      </Provider>
    );

    // Hovering class should be off by default
    expect(wrapper.hasClass('hovering')).toBeFalsy();

    // Hovering should add the class and not propagate the event
    const mockStop = jest.fn();
    wrapper.simulate('mouseover', {
      type: 'mouseover',
      stopPropagation: mockStop,
    });
    expect(wrapper.exists('.hovering')).toBeTruthy();
    expect(mockStop.mock.calls.length).toBe(1);

    // Mouse out should remove the class
    wrapper.simulate('mouseout', {
      type: 'mouseout',
      stopPropagation: jest.fn(),
    });
    expect(wrapper.exists('.hovering')).toBeFalsy();
  });
});
