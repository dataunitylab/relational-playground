// @flow
import {createStore, combineReducers, applyMiddleware} from 'redux';
import {connectRouter, routerMiddleware} from 'connected-react-router';
import {createBrowserHistory} from 'history';

import data from './modules/data';
import relexp from './modules/relexp';

import type {BrowserHistory} from 'history';
import type {Action, Store, Reducer} from 'redux';

export const history: BrowserHistory = createBrowserHistory();

const rootReducer: Reducer<any, any> = combineReducers({
  router: connectRouter(history),
  data,
  relexp,
});

const store: Store<any, any> = createStore(
  rootReducer,
  (applyMiddleware(routerMiddleware(history)): any)
);

export default store;
