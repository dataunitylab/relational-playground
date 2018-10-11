import React, { Component } from 'react';
import ReactTable from 'react-table';
import 'react-table/react-table.css';

class Table extends Component {
  render() {
    let columns = [{
      Header: this.props.tableName,
      columns: this.props.columns.map(c => ({Header: c, accessor: c}))
    }];
    return (<ReactTable
      data={this.props.data}
      columns={columns}
      defaultPageSize={5}
      sortable={this.props.sortable}>
    </ReactTable>)
  }
}

export default Table;
