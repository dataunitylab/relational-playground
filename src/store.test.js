import store from './store';
console.log(store);

it('has a valid initial state', () => {
  const initialState = store.getState();
  expect(initialState).toHaveProperty('data');
  expect(initialState).toHaveProperty('relexp');
  expect(initialState).toHaveProperty('router');
});
