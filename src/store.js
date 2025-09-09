// @flow
import {configureStore} from '@reduxjs/toolkit';
import {connectRouter, routerMiddleware} from 'connected-react-router';
import {createBrowserHistory} from 'history';

import data from './modules/data';
import relexp from './modules/relexp';

import type {BrowserHistory} from 'history';
import type {Action} from 'redux';
import type {Store} from '@reduxjs/toolkit';

export const history: BrowserHistory = createBrowserHistory();

const store: Store<{}, Action<{}>> = configureStore({
  reducer: {
    router: connectRouter(history),

    data,
    relexp,
  },
  middleware: [routerMiddleware(history)],
});

export default store;
