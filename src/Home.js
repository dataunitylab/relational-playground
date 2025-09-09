// @flow
import * as React from 'react';
import {lazy, useEffect, Suspense} from 'react';
import CurrentRelExpr from './CurrentRelExpr';
import DataContainer from './DataContainer';
import EditorContainer from './EditorContainer';
import SourceMultiTable from './SourceMultiTable';
import SplitPane from 'react-split-pane';
import {BrowserView, MobileOnlyView} from 'react-device-detect';
import ReactGA from 'react-ga';
import {ReactGAProvider} from './contexts/ReactGAContext';

import './Home.css';

import type {StatelessFunctionalComponent} from 'react';

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
        <EditorContainer />
        <CurrentRelExpr />
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
    <ReactGAProvider reactGA={ReactGA}>
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
              <SourceMultiTable />
            </div>
          </SplitPane>
        </BrowserView>

        <MobileOnlyView>
          <div style={{padding: '0em 1em 1em 1em'}}>
            {editorContainer}
            <SourceMultiTable />
          </div>
          {dataContainer}
        </MobileOnlyView>
      </div>
    </ReactGAProvider>
  );
};

export default Home;
