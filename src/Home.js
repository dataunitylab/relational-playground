import React, { Component } from 'react';
import { connect } from 'react-redux';
import MultiTable from './MultiTable';
import RelExpr from './RelExpr';
import SplitPane from 'react-split-pane';
import SqlEditor from './SqlEditor';
import Table from './Table';
import { changeExpr } from './modules/data';
import { exprFromSql } from './modules/relexp';

import './Home.css';

class Home extends Component {
  render() {
    let data = <div style={{padding: '2em'}}>Select an expression above.</div>;
    if (this.props.data.current) {
      data=
        <Table
          tableName={this.props.data.current.name}
          columns={this.props.data.current.columns}
          data={this.props.data.current.data}>
        </Table>;
    }

    return (
      <SplitPane split="vertical" primary="second" minSize={400}>
        <div>
          <SplitPane split="horizontal" primary="second" minSize={300}>
            <div style={{padding: '2em'}}>
              <div style={{marginBottom: '2em'}}><SqlEditor exprFromSql={this.props.exprFromSql}/></div>
              <RelExpr expr={this.props.expr} changeExpr={this.props.changeExpr} />
            </div>
            <div>{data}</div>
          </SplitPane>
        </div>
        <div>
          <MultiTable tables={this.props.sources}/>
        </div>
      </SplitPane>
    )
  }
}

const mapStateToProps = (state) => {
  return {
    'expr': state.relexp.expr,
    'data': state.data,
    'sources': state.data.sourcedata
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    changeExpr: data => { dispatch(changeExpr(data)) },
    exprFromSql: data => { dispatch(exprFromSql(data)) }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Home);
