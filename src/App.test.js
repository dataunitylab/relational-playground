import React from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter} from 'react-router';
import {createStore} from 'redux';
import {Provider} from 'react-redux';
import App from './App';

/** @test {App} */
it('renders without crashing', () => {
  const div = document.createElement('div');
  const initialState = {
    relexp: {expr: {}},
    data: {sourceData: {}},
  };
  const store = createStore(() => initialState, initialState);
  const root = createRoot(div);
  root.render(
    <Provider store={store}>
      <MemoryRouter>
        <App />
      </MemoryRouter>
    </Provider>
  );
  root.unmount();
});
