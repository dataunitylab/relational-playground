// @flow
import './wydr';

import {BrowserRouter} from 'react-router';
import {Provider} from 'react-redux';
import React from 'react';
import {createRoot} from 'react-dom/client';
import * as Sentry from '@sentry/browser';
import {CookiesProvider} from 'react-cookie';
import './index.css';
import store from './store';
import App from './App';

let sentryConfig = {
  dsn: 'https://496d372d00a24c57af7967ac2ff5dacd@sentry.io/2445886',
  environment: process.env.NODE_ENV,
  release: (null: ?string),
};

if (process.env.REACT_APP_GIT_SHA) {
  sentryConfig.release =
    'relational-playground@' + process.env.REACT_APP_GIT_SHA;
}
Sentry.init(sentryConfig);

const container = ((document.getElementById('root'): any): HTMLElement);
const root = createRoot(container);
root.render(
  <Provider store={store}>
    <BrowserRouter>
      <div>
        <CookiesProvider defaultSetOptions={{path: '/'}}>
          <App />
        </CookiesProvider>
      </div>
    </BrowserRouter>
  </Provider>
);
