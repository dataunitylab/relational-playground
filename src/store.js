// @flow
import {createStore, applyMiddleware, compose} from 'redux';
import {routerMiddleware} from 'connected-react-router';
import thunk from 'redux-thunk';
import {createBrowserHistory} from 'history';
import createRootReducer from './modules';

import type {BrowserHistory} from 'history';
import type {Action, Store} from 'redux';

export const history: BrowserHistory = createBrowserHistory();

const initialState = {};
const enhancers = [];
const middleware = [thunk, routerMiddleware(history)];

// Enable Redux dev tools in development mode
if (process.env.NODE_ENV === 'development') {
  const devToolsExtension = window.__REDUX_DEVTOOLS_EXTENSION__;

  if (typeof devToolsExtension === 'function') {
    enhancers.push(devToolsExtension());
  }
}

const composedEnhancers = compose(applyMiddleware(...middleware), ...enhancers);

const store: Store<{}, Action<{}>> = createStore(
  createRootReducer(history),
  initialState,
  composedEnhancers
);

export default store;
