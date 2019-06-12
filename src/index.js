// @flow
import {ConnectedRouter} from 'connected-react-router';
import {Provider} from 'react-redux';
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import store, {history} from './store';
import App from './App';
import * as serviceWorker from './serviceWorker';

ReactDOM.render(
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <div>
        <App />
      </div>
    </ConnectedRouter>
  </Provider>,
  ((document.getElementById('root'): any): HTMLElement)
);

serviceWorker.register();
