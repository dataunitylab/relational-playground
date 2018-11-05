import React, { Component } from 'react';
import { connect } from 'react-redux';
import SplitPane from 'react-split-pane';
import RelExpr from './RelExpr';
import Table from './Table';
import { changeExpr } from './modules/data';

import './Home.css';

class Home extends Component {
  render() {
    let data = <div>Select an expression above.</div>;
    if (this.props.data.current) {
      data=
        <Table
          tableName={this.props.data.current.name}
          columns={this.props.data.current.columns}
          data={this.props.data.current.data}>
        </Table>;
    }

    return (
      <SplitPane split="horizontal">
        <div><RelExpr expr={this.props.expr} changeExpr={this.props.changeExpr} /></div>
        <div>{data}</div>
      </SplitPane>
    )
  }
}

const mapStateToProps = (state) => {
  return {
    'expr': state.relexp.expr,
    'data': state.data
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    changeExpr: data => { dispatch(changeExpr(data)) }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Home);
