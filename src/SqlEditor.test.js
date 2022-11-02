import React from 'react';
import {shallow} from 'enzyme';

import Editor from 'react-simple-code-editor';
import SqlEditor from './SqlEditor';

it('can parse the initial query', () => {
  const types = {foo: ['bar', 'baz']};
  const mockAction = jest.fn();
  const mockEvent = jest.fn();
  const mockResetAction = jest.fn(() => undefined);

  // eslint-disable-next-line no-native-reassign
  window = Object.create(window);

  Object.defineProperty(window, 'location', {
    value: new URL('http://localhost:3000/'),
  });

  shallow(
    <SqlEditor
      defaultText="SELECT * FROM foo"
      ReactGA={{event: mockEvent}}
      exprFromSql={mockAction}
      types={types}
      resetAction={mockResetAction}
    />
  );

  // A redux action should fire with the parsed query
  expect(mockAction.mock.calls.length).toBe(1);
  expect(mockAction.mock.calls[0][0].type).toBe('Select');
  expect(mockAction.mock.calls[0][1]).toEqual(types);

  // No events should be recorded
  expect(mockEvent.mock.calls.length).toBe(0);
  expect(mockResetAction.mock.calls.length).toBe(0);
});

it('can parse modified query and fire an event', () => {
  jest.useFakeTimers();
  const types = {foo: ['bar', 'baz']};
  const mockAction = jest.fn(() => undefined);
  const mockEvent = jest.fn(() => undefined);
  const mockResetAction = jest.fn(() => undefined);
  const wrapper = shallow(
    <SqlEditor
      defaultText="SELECT * FROM foo"
      ReactGA={{event: mockEvent}}
      exprFromSql={mockAction}
      types={types}
      resetAction={mockResetAction}
    />
  );

  const query = 'SELECT 1 FROM quux';

  // The valueChange event is specific to this component,
  // but triggering it is the easiest way to simulate
  // typing to the underlying textarea
  wrapper.find(Editor).first().simulate('valueChange', query);

  // No events should be recorded yet
  expect(mockEvent.mock.calls.length).toBe(0);

  // The new query should not be parsed yet
  expect(mockAction.mock.calls.length).toBe(1);

  jest.runAllTimers();

  // Now an event should be fire with the new query and an action created
  expect(mockEvent.mock.calls.length).toBe(1);
  expect(mockResetAction.mock.calls.length).toBe(1);
  expect(mockEvent.mock.calls[0][0].category).toBe('User Typing SQL Statement');
  expect(mockEvent.mock.calls[0][0].action).toBe(query);
  expect(mockAction.mock.calls.length).toBe(2);
});
