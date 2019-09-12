import React from 'react';
import {render} from '@testing-library/react';

import SqlEditor from './SqlEditor';

it('can parse the initial query', () => {
  const types = {foo: ['bar', 'baz']};
  const mockAction = jest.fn(() => undefined);
  const {container} = render(
    <SqlEditor
      defaultText="SELECT * FROM foo"
      exprFromSql={mockAction}
      types={types}
    />
  );

  expect(mockAction.mock.calls.length).toBe(1);
  expect(mockAction.mock.calls[0][0].type).toBe('Select');
  expect(mockAction.mock.calls[0][1]).toEqual(types);
});
