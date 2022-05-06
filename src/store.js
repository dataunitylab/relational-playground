// @flow
import {configureStore} from '@reduxjs/toolkit';
import {connectRouter, routerMiddleware} from 'connected-react-router';
import thunk from 'redux-thunk';
import {createBrowserHistory} from 'history';

import data from './modules/data';
import relexp from './modules/relexp';

import type {BrowserHistory} from 'history';
import type {Action, Store} from 'redux';

export const history: BrowserHistory = createBrowserHistory();

const enhancers = [];
const middleware = [thunk, routerMiddleware(history)];

// Enable Redux dev tools in development mode
if (process.env.NODE_ENV === 'development') {
  const devToolsExtension = window.__REDUX_DEVTOOLS_EXTENSION__;

  if (typeof devToolsExtension === 'function') {
    enhancers.push(devToolsExtension());
  }
}

const store: Store<{}, Action<{}>> = configureStore({
  reducer: {
    router: connectRouter(history),

    data,
    relexp,
  },
  middleware: middleware,
  enhancers: enhancers,
});

export default store;
