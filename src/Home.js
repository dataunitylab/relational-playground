// @flow
import React, {Component} from 'react';

import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import fromEntries from 'fromentries';
import {withRouter} from 'react-router-dom';
import MultiTable from './MultiTable';
import RelExpr from './RelExpr';
import SplitPane from 'react-split-pane';
import SqlEditor from './SqlEditor';
import Table from './Table';
import {changeExpr} from './modules/data';
import {exprFromSql} from './modules/relexp';
import {resetAction} from './modules/data';
import {BrowserView, MobileView} from 'react-device-detect';
import Cookies from 'universal-cookie';
import ReactGA from 'react-ga';

import './Home.css';

import type {Data, State as DataState} from './modules/data';
import Tutorial from './Tutorial';

type State = {
  cookies: typeof Cookies,
};

type Props = {
  match: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
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
class Home extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      cookies: new Cookies(),
    };

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
    let data = (
      <div className="dataContainer" style={{padding: '2em'}}>
        Select an expression above.
      </div>
    );
    if (this.props.data.current) {
      data = (
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
    }

    let editorContainer = (
      <div style={{padding: '0em 1em 1em 1em'}}>
        <h2>Relational Playground</h2>
        <div>
          {/* SQL query input */}
          <SqlEditor
            history={this.props.history}
            ReactGA={ReactGA}
            defaultText="SELECT * FROM Doctor"
            exprFromSql={this.props.exprFromSql}
            resetAction={this.props.resetAction}
            types={this.props.types}
          />

          <div className="relExprContainer">
            {/* Relational algebra expression display */}
            <RelExpr
              ReactGA={ReactGA}
              expr={this.props.expr}
              changeExpr={this.props.changeExpr}
            />
          </div>
        </div>
      </div>
    );

    let dataContainer = (
      <div className="bottomLeftContainer">
        {data}
        <div className="footer">
          <Tutorial cookies={this.state.cookies} />
          <p className="email">
            For questions, please email{' '}
            <a href="mailto:mmior@cs.rit.edu">mmior@cs.rit.edu</a>
          </p>
        </div>
      </div>
    );

    return (
      <div>
        <BrowserView>
          <SplitPane split="vertical" primary="second" minSize={'30%'}>
            <div>
              <SplitPane split="horizontal" primary="second" minSize={'55%'}>
                {editorContainer}
                {dataContainer}
              </SplitPane>
            </div>
            {/* Input dataset preview */}
            <div style={{margin: '2em'}}>
              <MultiTable ReactGA={ReactGA} tables={this.props.sources} />
            </div>
          </SplitPane>
        </BrowserView>

        <MobileView>
          <div style={{padding: '0em 1em 1em 1em'}}>
            {editorContainer}
            <MultiTable ReactGA={ReactGA} tables={this.props.sources} />
          </div>
          {dataContainer}
        </MobileView>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
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
    cookies: ownProps.cookies,
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

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(Home));
