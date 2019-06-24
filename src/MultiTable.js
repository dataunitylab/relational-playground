// @flow
import React, {Component} from 'react';
import Select from 'react-select';
import Table from './Table';

import type {Data} from './modules/data';

type Props = {
  tables: {[string]: Data},
};

type State = {
  selected: string,
};

class MultiTable extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {selected: Object.keys(this.props.tables)[0]};
  }

  // TODO: Fix type annotation below
  handleChange = (table: any) => {
    this.setState({selected: table.value});
  };

  render() {
    let table = <div>Select a table above.</div>;
    if (this.state.selected) {
      const data = this.props.tables[this.state.selected];
      table = (
        <Table tableName={data.name} columns={data.columns} data={data.data} />
      );
    }
    return (
      <div>
        <h4>Select a Table:</h4>
        <Select
          value={{value: this.state.selected, label: this.state.selected}}
          onChange={this.handleChange}
          options={Object.keys(this.props.tables).map(tbl => {
            return {value: tbl, label: tbl};
          })}
        />

        <h4>Your Selected Table: </h4>
        {table}
      </div>
    );
  }
}

export default MultiTable;
