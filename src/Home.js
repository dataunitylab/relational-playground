// @flow
import * as React from 'react';
import {lazy, useEffect, Suspense} from 'react';
import {connect} from 'react-redux';
import CurrentRelExpr from './CurrentRelExpr';
import DataContainer from './DataContainer';
import EditorContainer from './EditorContainer';
import SourceMultiTable from './SourceMultiTable';
import SplitPane from 'react-split-pane';
import {changeExpr} from './modules/data';
import {BrowserView, MobileOnlyView} from 'react-device-detect';
import ReactGA from 'react-ga';

import './Home.css';

import type {ComponentType, StatelessFunctionalComponent} from 'react';

const Tutorial = lazy(() => import('./Tutorial'));

type Props = {};

/** Container for all components on the main page */
const Home: StatelessFunctionalComponent<Props> = (props) => {
  useEffect(() => {
    // If GA is no longer used, remove preconnect from index.html
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
  }, []);

  let editorContainer = (
    <div style={{padding: '0em 1em 1em 1em'}}>
      <h2>Relational Playground</h2>
      <div>
        {/* SQL query input */}
        <EditorContainer ReactGA={ReactGA} />
        <CurrentRelExpr ReactGA={ReactGA} />
      </div>
    </div>
  );

  let dataContainer = (
    <div className="bottomLeftContainer">
      <DataContainer />
      <div className="footer">
        <Suspense fallback={<React.Fragment />}>
          <Tutorial />
        </Suspense>
        <p className="email">
          For questions, please email{' '}
          <a href="mailto:mmior@mail.rit.edu">mmior@mail.rit.edu</a>
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
};

const mapStateToProps = (state: {[string]: any}): {[string]: any} => {
  return {
    expr: state.relexp.expr,
  };
};

const mapDispatchToProps = (dispatch: (any) => void) => {
  return {
    changeExpr: (data: {[string]: any}, element: ?HTMLElement) => {
      dispatch(changeExpr(data, element));
    },
  };
};

const ConnectedHome: ComponentType<Props> = connect<
  {expr: {[string]: any}},
  {||},
  _,
  _,
  _,
  _
>(
  mapStateToProps,
  mapDispatchToProps
)(Home);
export default ConnectedHome;
