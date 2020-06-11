import React from 'react';
import {Provider} from 'react-redux';
import {mount} from 'enzyme';
import configureStore from 'redux-mock-store';

import CurrentRelExpr from './CurrentRelExpr';
import RelExpr from './RelExpr';
import RelExprTree from './RelExprTree';

const mockStore = configureStore([]);

describe('CurrentRelExpr', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      relexp: {
        expr: {
          selection: {
            arguments: {
              select: 'foo',
            },
            children: [{relation: 'bar'}],
          },
        },
      },
    });
  });

  /** @test {CurrentRelExpr} */
  it('changes the expression when clicked not relation', () => {
    const mockAction = jest.fn();
    const mockEvent = jest.fn();
    const wrapper = mount(
      <Provider store={store}>
        <CurrentRelExpr ReactGA={{event: mockEvent}} />
      </Provider>
    );

    // Start with non-tree representation
    expect(wrapper.find(RelExpr).length).toBe(2);
    expect(wrapper.find(RelExprTree).length).toBe(0);

    // Click the checkbox to toggle the tree view
    wrapper.find('input').simulate('change', {target: {checked: true}});

    // Now only the tree view should display
    expect(wrapper.find(RelExpr).length).toBe(0);
    expect(wrapper.find(RelExprTree).length).toBe(1);

    // Click the checkbox again to toggle back
    wrapper.find('input').simulate('change', {target: {checked: false}});

    // We should have analytics events for the checkbox
    expect(mockEvent.mock.calls.length).toBe(2);

    expect(mockEvent.mock.calls[0][0].category).toBe(
      'Toggle Expression Display'
    );
    expect(mockEvent.mock.calls[0][0].action).toBe('tree');

    expect(mockEvent.mock.calls[1][0].category).toBe(
      'Toggle Expression Display'
    );
    expect(mockEvent.mock.calls[1][0].action).toBe('linear');
  });
});
