// @flow
import React, {Component} from 'react';
// $FlowFixMe
import Select from 'react-select';
import Table from './Table';

import type {Data} from './modules/data';

type Props = {
  tables: {[string]: Data},
  ReactGA: any,
};

type State = {
  selected: string,
};

/** Displays more than one table with a dropdown to choose */
class MultiTable extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {selected: Object.keys(this.props.tables)[0]};
  }

  // TODO: Fix type annotation below
  handleChange = (table: any) => {
    this.setState({selected: table.value});
    this.props.ReactGA.event({
      category: 'User Selecting A Table',
      action: table.value,
    });
  };

  render() {
    // Render the selected table
    let table = <div>Select a table above.</div>;
    if (this.state.selected) {
      const data = this.props.tables[this.state.selected];
      table = <Table columns={data.columns} data={data.data} />;
    }

    // Render the menu along with the table
    return (
      <div>
        <h4>Source relations</h4>
        <Select
          value={{value: this.state.selected, label: this.state.selected}}
          onChange={this.handleChange}
          options={Object.keys(this.props.tables).map(tbl => {
            return {value: tbl, label: tbl};
          })}
        />

        {table}
      </div>
    );
  }
}

export default MultiTable;
