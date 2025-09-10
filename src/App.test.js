import React from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter} from 'react-router';
import {configureStore} from '@reduxjs/toolkit';
import {Provider} from 'react-redux';
import {produce} from 'immer';
import App from './App';

/** @test {App} */
it('renders without crashing', () => {
  const div = document.createElement('div');
  const initialState = {
    relexp: {expr: {}},
    data: {sourceData: {}},
  };
  const store = configureStore({
    reducer: {
      data: produce((state, action) => state, initialState),
      relexp: produce((state, action) => state, initialState),
    },
    preloadedState: initialState,
  });
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
