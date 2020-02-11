// @flow
import {ConnectedRouter} from 'connected-react-router';
import {Provider} from 'react-redux';
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import store, {history} from './store';
import App from './App';
import CookiesProvider from "react-cookie/cjs/CookiesProvider";

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
