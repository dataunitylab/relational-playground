import React from 'react';
import {Provider} from 'react-redux';
import {render} from '@testing-library/react';
import {createStore} from 'redux';

import DataContainer from './DataContainer';

describe('DataContainer', () => {
  /** @test {DataContainer} */
  it('displays a table with the current data', () => {
    const initialState = {
      data: {
        current: {
          name: 'foo',
          columns: ['bar', 'baz'],
          data: [{bar: 1, baz: 2}],
        },
      },
    };
    const mockStore = createStore(() => initialState, initialState);
    const {container} = render(
      <Provider store={mockStore}>
        <DataContainer />
      </Provider>
    );

    // Check that the table is rendered with correct content
    expect(container.querySelector('.ReactTable')).toBeInTheDocument();
    expect(container).toHaveTextContent('Data for selected expression');
    expect(container).toHaveTextContent('bar');
    expect(container).toHaveTextContent('baz');
    expect(container).toHaveTextContent('1');
    expect(container).toHaveTextContent('2');
  });
});
