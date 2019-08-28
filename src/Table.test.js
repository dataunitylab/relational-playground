import React from 'react';
import {shallow} from 'enzyme';
import ReactTable from 'react-table';

import Table from './Table';

/** @test {Table} */
it('can render a table', () => {
  const data = [{bar: 1, baz: 2}];
  const wrapper = shallow(
    <Table tableName={'foo'} columns={['bar', 'baz']} data={data} />
  );
  const table = wrapper.find(ReactTable).first();
  expect(table).toHaveProp({
    data: data,
    sortable: true,
  });
  expect(table).toHaveProp('columns');
});

/** @test {Table} */
it('can disable sorting', () => {
  const wrapper = shallow(
    <Table tableName={'foo'} columns={[]} data={[]} sortable={false} />
  );
  const table = wrapper.find(ReactTable).first();
  expect(table).toHaveProp('sortable', false);
});
