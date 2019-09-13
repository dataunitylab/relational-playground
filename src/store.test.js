import {createStore, applyMiddleware, compose} from 'redux';

const OLD_ENV = process.env;

beforeEach(() => {
  jest.resetModules(); // this is important - it clears the cache
  process.env = {...OLD_ENV};
  delete process.env.NODE_ENV;
});

it('has a valid initial state', () => {
  const store = require('./store').default;
  const initialState = store.getState();
  expect(initialState).toHaveProperty('data');
  expect(initialState).toHaveProperty('relexp');
  expect(initialState).toHaveProperty('router');
});

it('initializes dev tools in development', () => {
  process.env.NODE_ENV = 'development';

  // Pretend the dev tools are installed
  const devTools = jest.fn((...args) => applyMiddleware(...args));
  global.__REDUX_DEVTOOLS_EXTENSION__ = devTools;

  const store = require('./store').default;
  expect(devTools.mock.calls.length).toBe(1);

  process.env.NODE_ENV = 'test';
});
