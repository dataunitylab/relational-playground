import React from 'react';
import {shallow} from 'enzyme';

import SqlEditor from './SqlEditor';

it('can parse the initial query', () => {
  const types = {foo: ['bar', 'baz']};
  const mockAction = jest.fn();
  const mockEvent = jest.fn();
  const mockChangeAction = jest.fn(() => undefined);
  const wrapper = shallow(
    <SqlEditor
      defaultText="SELECT * FROM foo"
      ReactGA={{event: mockEvent}}
      exprFromSql={mockAction}
      types={types}
      changeAction={mockChangeAction}
    />
  );

  // A redux action should fire with the parsed query
  expect(mockAction.mock.calls.length).toBe(1);
  expect(mockAction.mock.calls[0][0].type).toBe('Select');
  expect(mockAction.mock.calls[0][1]).toEqual(types);

  // No events should be recorded
  expect(mockEvent.mock.calls.length).toBe(0);
  expect(mockChangeAction.mock.calls.length).toBe(0);
});

it('can parse modified query and fire an event', () => {
  jest.useFakeTimers();
  const types = {foo: ['bar', 'baz']};
  const mockAction = jest.fn(() => undefined);
  const mockEvent = jest.fn(() => undefined);
  const mockChangeAction = jest.fn(() => undefined);
  const wrapper = shallow(
    <SqlEditor
      defaultText="SELECT * FROM foo"
      ReactGA={{event: mockEvent}}
      exprFromSql={mockAction}
      types={types}
      changeAction={mockChangeAction}
    />
  );

  const query = 'SELECT 1 FROM quux';
  wrapper
    .find('textarea')
    .first()
    .simulate('change', {target: {value: query}});

  // No events should be recorded yet
  expect(mockEvent.mock.calls.length).toBe(0);

  // The new query should not be parsed yet
  expect(mockAction.mock.calls.length).toBe(1);

  jest.runAllTimers();

  // Now an event should be fire with the new query and an action created
  expect(mockEvent.mock.calls.length).toBe(1);
  expect(mockChangeAction.mock.calls.length).toBe(1);
  expect(mockEvent.mock.calls[0][0].category).toBe('User Typing SQL Statement');
  expect(mockEvent.mock.calls[0][0].action).toBe(query);
  expect(mockAction.mock.calls.length).toBe(2);
});
