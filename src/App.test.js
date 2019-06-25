import React from 'react';
import ReactDOM from 'react-dom';
import {MemoryRouter} from 'react-router';
import {createStore} from 'redux';
import {Provider} from 'react-redux';
import App from './App';

/** @test {App} */
it('renders without crashing', () => {
  const div = document.createElement('div');
  const store = createStore(() => ({
    relexp: {expr: {}},
    data: {sourceData: {}},
  }));
  ReactDOM.render(
    <Provider store={store}>
      <MemoryRouter>
        <App />
      </MemoryRouter>
    </Provider>,
    div
  );
  ReactDOM.unmountComponentAtNode(div);
});
