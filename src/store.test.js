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
