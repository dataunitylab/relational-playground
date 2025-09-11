import React from 'react';
import {Provider} from 'react-redux';
import {render, screen, act, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import configureStore from 'redux-mock-store';

import CurrentRelExpr from './CurrentRelExpr';
import RelExpr from './RelExpr';
import RelExprTree from './RelExprTree';

const mockStore = configureStore([]);

describe('CurrentRelExpr', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      data: {expr: {}},
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
  it('changes the expression when clicked not relation', async () => {
    const user = userEvent.setup();
    const mockEvent = jest.fn();
    const {container, findByRole} = render(
      <Provider store={store}>
        <CurrentRelExpr ReactGA={{event: mockEvent}} />
      </Provider>
    );

    // Start with non-tree representation - check for RelExpr components
    expect(container.querySelectorAll('.RelExpr')).toHaveLength(2);
    expect(container.querySelector('.rstm-tree-item')).toBeNull();

    // Click the checkbox to toggle the tree view
    const treeViewCheckbox = screen.getByLabelText('Tree view');
    await act(async () => {
      await user.click(treeViewCheckbox);
    });

    // Wait for the tree view to appear and verify the change
    await waitFor(() => {
      expect(container.querySelectorAll('.RelExpr')).toHaveLength(0);
      expect(container.querySelector('.rstm-tree-item')).toBeInTheDocument();
    });

    // Click the checkbox again to toggle the tree view back
    await act(async () => {
      await user.click(treeViewCheckbox);
    });

    // Wait for RelExpr view to return
    await waitFor(() => {
      expect(container.querySelectorAll('.RelExpr')).toHaveLength(2);
      expect(container.querySelector('.rstm-tree-item')).toBeNull();
    });

    // Click the checkbox to toggle query optimization
    const optimizationCheckbox = screen.getByLabelText('Query Optimization');
    await act(async () => {
      await user.click(optimizationCheckbox);
    });

    // Click the checkbox again to toggle query optimization back
    await act(async () => {
      await user.click(optimizationCheckbox);
    });

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
