// @flow
import './wydr';

import {ConnectedRouter} from 'connected-react-router';
import {Provider} from 'react-redux';
import React from 'react';
import ReactDOM from 'react-dom';
import * as Sentry from '@sentry/browser';
import './index.css';
import store, {history} from './store';
import App from './App';
import CookiesProvider from 'react-cookie/cjs/CookiesProvider';

let sentryConfig = {};
sentryConfig.dsn = 'https://496d372d00a24c57af7967ac2ff5dacd@sentry.io/2445886';
sentryConfig.environment = process.env.NODE_ENV;
if (process.env.REACT_APP_GIT_SHA) {
  sentryConfig.release =
    'relational-playground@' + process.env.REACT_APP_GIT_SHA;
}
Sentry.init(sentryConfig);

ReactDOM.render(
  <CookiesProvider>
    <Provider store={store}>
      <ConnectedRouter history={history}>
        <div>
          <App />
        </div>
      </ConnectedRouter>
    </Provider>
  </CookiesProvider>,
  ((document.getElementById('root'): any): HTMLElement)
);
