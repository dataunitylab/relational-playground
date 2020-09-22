// @flow
import React from 'react';
import ReactTable from 'react-table';
import 'react-table/react-table.css';

import './Table.css';

import type {StatelessFunctionalComponent} from 'react';

type Props = {
  tableName?: string,
  columns: Array<string>,
  data: Array<{[string]: any}>,
  sortable?: boolean,
};

/** A wrapper for {ReactTable} which sets some default options */
const Table: StatelessFunctionalComponent<Props> = (props) => {
  let columns = [
    {
      Header: props.tableName,

      // Define the column with a default accessor to ignore the
      // default behaviour of asking nested properties via dots
      columns: props.columns.map((c) => ({
        id: c,
        Header: c,
        accessor: (d) => d[c],
      })),
    },
  ];

  return (
    <ReactTable
      className={props.tableName ? '' : 'no-header'}
      data={props.data}
      columns={columns}
      defaultPageSize={5}
      showPageSizeOptions={false}
      sortable={props.sortable}
      width={500}
    />
  );
};

export default Table;
