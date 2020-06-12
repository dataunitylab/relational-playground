// @flow
import React, {Component} from 'react';
import Table from './Table';
import {connect} from 'react-redux';

import type {State} from './modules/data';

type Props = {
  data: State,
};

class DataContainer extends Component<Props> {
  render() {
    if (this.props.data.current) {
      return (
        <div className="dataContainer" style={{margin: '1em'}}>
          <h4>Data for selected expression</h4>
          <Table
            tableName={this.props.data.current.name}
            columns={this.props.data.current.columns}
            data={this.props.data.current.data}
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
  }
}

const mapStateToProps = (state, ownProps) => {
  return {data: state.data};
};

export default connect(mapStateToProps)(DataContainer);
