import React from 'react';
import {shallow} from 'enzyme';

import SqlEditor from './SqlEditor';

it('can parse the initial query', () => {
  const types = {foo: ['bar', 'baz']};
  const mockAction = jest.fn(() => undefined);
  const mockEvent = jest.fn(() => undefined);
  const wrapper = shallow(
    <SqlEditor
      defaultText="SELECT * FROM foo"
      ReactGA={{event: mockEvent}}
      exprFromSql={mockAction}
      types={types}
    />
  );

  // A redux action should fire with the parsed query
  expect(mockAction.mock.calls.length).toBe(1);
  expect(mockAction.mock.calls[0][0].type).toBe('Select');
  expect(mockAction.mock.calls[0][1]).toEqual(types);

  // No events should be recorded
  expect(mockEvent.mock.calls.length).toBe(0);
});
