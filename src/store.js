// @flow
import {createStore, combineReducers, applyMiddleware} from 'redux';
import {createReduxHistoryContext, reachify} from 'redux-first-history';
import {createBrowserHistory} from 'history';

import data from './modules/data';
import relexp from './modules/relexp';

import type {BrowserHistory} from 'history';
import type {Action, Store, Reducer} from 'redux';

const {createReduxHistory, routerMiddleware, routerReducer} =
  createReduxHistoryContext({
    history: createBrowserHistory(),
  });

const rootReducer: Reducer<any, any> = combineReducers({
  router: routerReducer,
  data,
  relexp,
});

const store: Store<any, any> = createStore(
  rootReducer,
  (applyMiddleware(routerMiddleware): any)
);

export const history: BrowserHistory = createReduxHistory(store);

export default store;
