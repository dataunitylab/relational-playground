// @flow
import React, {Component} from 'react';
import {connect} from 'react-redux';
import MultiTable from './MultiTable';
import RelExpr from './RelExpr';
import SplitPane from 'react-split-pane';
import SqlEditor from './SqlEditor';
import Table from './Table';
import {changeExpr} from './modules/data';
import {exprFromSql} from './modules/relexp';

import './Home.css';

import type {Data, State as DataState} from './modules/data';

type Props = {
  expr: {[string]: any},
  data: DataState,
  sources: {[string]: Data},

  changeExpr: typeof changeExpr,
  exprFromSql: typeof exprFromSql,
};

class Home extends Component<Props> {
  render() {
    let data = <div style={{padding: '2em'}}>Select an expression above.</div>;
    if (this.props.data.current) {
      data = (
          <div style={{width: '100%', margin: '1em'}}>
            <h4>Table for your selected Relation: </h4>
            <Table
                tableName={this.props.data.current.name}
                columns={this.props.data.current.columns}
                data={this.props.data.current.data}
            />
          </div>

      );
    }

    return (
      <SplitPane split="vertical" primary="second" minSize={400}>
        <div>
          <SplitPane split="horizontal" primary="second" minSize={400}>
            <div style={{padding: '2em'}} className="topLeftContainer">
              <div>
                <SqlEditor
                  defaultText="SELECT * FROM Doctor"
                  exprFromSql={this.props.exprFromSql}
                />

                <RelExpr
                  expr={this.props.expr}
                  changeExpr={this.props.changeExpr}
                />
              </div>
            </div>
            {data}
          </SplitPane>
        </div>
        <div style={{margin: '2em'}}>
          <MultiTable tables={this.props.sources} />
        </div>
      </SplitPane>
    );
  }
}

const mapStateToProps = state => {
  return {
    expr: state.relexp.expr,
    data: state.data,
    sources: state.data.sourcedata,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    changeExpr: data => {
      dispatch(changeExpr(data));
    },
    exprFromSql: data => {
      dispatch(exprFromSql(data));
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Home);
