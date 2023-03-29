// @flow
import React from 'react';
import Table from './Table';
import {useSelector} from 'react-redux';

import type {StatelessFunctionalComponent} from 'react';

import type {State} from './modules/data';

const DataContainer: StatelessFunctionalComponent<{||}> = () => {
  const data = useSelector<{data: State}, _>((state) => state.data);
  if (data.current) {
    return (
      <div className="dataContainer" style={{margin: '1em'}}>
        <h4>Data for selected expression</h4>
        <Table
          tableName={data.current.name}
          columns={data.current.columns}
          data={data.current.data}
          sortable={false}
        />
      </div>
    );
  } else {
    return (
      <div className="dataContainer" style={{padding: '2em'}}>
        Select an expression above.
      </div>
    );
  }
};

export default DataContainer;
