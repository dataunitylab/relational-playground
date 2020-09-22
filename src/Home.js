// @flow
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {withRouter} from 'react-router-dom';
import CurrentRelExpr from './CurrentRelExpr';
import DataContainer from './DataContainer';
import EditorContainer from './EditorContainer';
import SourceMultiTable from './SourceMultiTable';
import SplitPane from 'react-split-pane';
import {changeExpr} from './modules/data';
import {BrowserView, MobileOnlyView} from 'react-device-detect';
import Cookies from 'universal-cookie';
import ReactGA from 'react-ga';

import './Home.css';

import Tutorial from './Tutorial';

import type {ComponentType} from 'react';
import type {RouterHistory} from 'react-router-dom';

type State = {
  cookies: typeof Cookies,
};

type Props = {
  history: RouterHistory,
};

/** Container for all components on the main page */
class Home extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {cookies: new Cookies()};

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
    let editorContainer = (
      <div style={{padding: '0em 1em 1em 1em'}}>
        <h2>Relational Playground</h2>
        <div>
          {/* SQL query input */}
          <EditorContainer ReactGA={ReactGA} history={this.props.history} />
          <CurrentRelExpr ReactGA={ReactGA} />
        </div>
      </div>
    );

    let dataContainer = (
      <div className="bottomLeftContainer">
        <DataContainer />
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
              <SourceMultiTable ReactGA={ReactGA} />
            </div>
          </SplitPane>
        </BrowserView>

        <MobileOnlyView>
          <div style={{padding: '0em 1em 1em 1em'}}>
            {editorContainer}
            <SourceMultiTable ReactGA={ReactGA} />
          </div>
          {dataContainer}
        </MobileOnlyView>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    expr: state.relexp.expr,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    changeExpr: (data, element) => {
      dispatch(changeExpr(data, element));
    },
  };
};

const ConnectedHome: ComponentType<Props> = connect<_, {||}, _, _, _, _>(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(Home));
export default ConnectedHome;
