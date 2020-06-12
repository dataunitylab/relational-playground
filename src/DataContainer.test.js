import React from 'react';
import {Provider} from 'react-redux';
import {shallow} from 'enzyme';
import configureStore from 'redux-mock-store';

import DataContainer from './DataContainer';
import Table from './Table';

const mockStore = configureStore([]);

describe('DataContainer', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      data: {
        current: {
          name: 'foo',
          columns: ['bar', 'baz'],
          data: [{bar: 1, baz: 2}],
        },
      },
    });
  });

  /** @test {DataContainer} */
  it('displays a table with the current data', () => {
    const wrapper = shallow(<DataContainer store={store} />)
      .dive()
      .dive();

    const table = wrapper.find(Table).first();
    expect(table).toHaveProp({
      tableName: 'foo',
      columns: ['bar', 'baz'],
      sortable: false,
    });
  });
});
