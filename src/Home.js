// @flow
import React, {Component} from 'react';
import {connect} from 'react-redux';
import fromEntries from 'fromentries';
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
  types: {[string]: Array<string>},
  element: HTMLElement,

  changeExpr: typeof changeExpr,
  exprFromSql: typeof exprFromSql,
};

/** Container for all components on the main page */
class Home extends Component<Props> {
  render() {
    let data = <div style={{padding: '2em'}}>Select an expression above.</div>;
    if (this.props.data.current) {
      data = (
        <div style={{width: '100%', margin: '1em'}}>
          <h4>Data for selected expression</h4>
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
            <div style={{padding: '0em 1em 1em 1em'}}>
              <div>
                {/* SQL query input */}
                <SqlEditor
                  defaultText="SELECT * FROM Doctor"
                  exprFromSql={this.props.exprFromSql}
                  types={this.props.types}
                />

                {/* Relational algebra expression display */}
                <RelExpr
                  expr={this.props.expr}
                  changeExpr={this.props.changeExpr}
                />
              </div>
            </div>
            {data}
          </SplitPane>
        </div>
        {/* Input dataset preview */}
        <div style={{margin: '2em'}}>
          <MultiTable tables={this.props.sources} />
        </div>
      </SplitPane>
    );
  }
}

const mapStateToProps = state => {
  // Get just the column names from the source data
  const types = fromEntries(
    Object.entries(state.data.sourceData).map(([name, data]) => {
      return [
        name,
        data != null && typeof data === 'object' ? data.columns : [],
      ];
    })
  );

  return {
    expr: state.relexp.expr,
    data: state.data,
    types: types,
    sources: state.data.sourceData,
    element: state.data.element,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    changeExpr: (data, element) => {
      dispatch(changeExpr(data, element));
    },
    exprFromSql: (sql, types) => {
      dispatch(exprFromSql(sql, types));
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Home);
