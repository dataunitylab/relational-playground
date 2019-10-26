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
import {resetAction} from './modules/data';
import ReactGA from 'react-ga';

import './Home.css';

import type {Data, State as DataState} from './modules/data';

type Props = {
  expr: {[string]: any},
  data: DataState,
  sources: {[string]: Data},
  element: HTMLElement,
  types: {[string]: Array<string>},

  changeExpr: typeof changeExpr,
  exprFromSql: typeof exprFromSql,
  resetAction: typeof resetAction,
};

/** Container for all components on the main page */
class Home extends Component<Props> {
  constructor() {
    super();
    switch (process.env.NODE_ENV) {
      case 'production':
        ReactGA.initialize('UA-143847373-2');
        break;
      case 'development':
        ReactGA.initialize('UA-143847373-1');
        break;
      default:
        ReactGA.initialize('UA-143847373-1', {testMode: true});
        break;
    }
    ReactGA.pageview('/');
  }

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
            sortable={false}
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
                  ReactGA={ReactGA}
                  defaultText="SELECT * FROM Doctor"
                  exprFromSql={this.props.exprFromSql}
                  resetAction={this.props.resetAction}
                  types={this.props.types}
                />

                {/* Relational algebra expression display */}
                <RelExpr
                  ReactGA={ReactGA}
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
          <MultiTable ReactGA={ReactGA} tables={this.props.sources} />
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
    resetAction: () => {
      dispatch(resetAction());
    },
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
