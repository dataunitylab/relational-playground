import React from 'react';
import {Provider} from 'react-redux';
import {mount} from 'enzyme';
import {produce} from 'immer';
import {configureStore} from '@reduxjs/toolkit';

import DataContainer from './DataContainer';
import Table from './Table';

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
    const mockStore = configureStore({
      reducer: {
        data: produce((state, action) => state, initialState),
      },
      preloadedState: initialState,
    });
    const wrapper = mount(
      <Provider store={mockStore}>
        <DataContainer />
      </Provider>
    );

    const table = wrapper.find(Table).first();
    expect(table).toHaveProp({
      tableName: 'foo',
      columns: ['bar', 'baz'],
      sortable: false,
    });
  });
});
