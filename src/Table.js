// @flow
import React from 'react';
import {Grid} from 'gridjs-react';
import 'gridjs/dist/theme/mermaid.css';

import type {StatelessFunctionalComponent} from 'react';

type Props = {
  tableName?: string,
  columns: Array<string>,
  data: Array<{[string]: any}>,
  sortable?: boolean,
};

/** A wrapper for {Grid} which sets some default options */
const Table: StatelessFunctionalComponent<Props> = (props) => {
  return (
    <Grid
      data={props.data}
      columns={props.columns}
      pagination={{
        enabled: true,
        limit: 5,
      }}
      sort={props.sortable}
      width={500}
    />
  );
};

export default Table;
