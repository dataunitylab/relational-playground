import React from 'react';
import {Provider} from 'react-redux';
import {mount} from 'enzyme';
import {createStore} from 'redux';

import DataContainer from './DataContainer';
import Table from './Table';

describe('DataContainer', () => {
  /** @test {DataContainer} */
  it('displays a table with the current data', () => {
    const mockStore = createStore((state) => state, {
      data: {
        current: {
          name: 'foo',
          columns: ['bar', 'baz'],
          data: [{bar: 1, baz: 2}],
        },
      },
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
