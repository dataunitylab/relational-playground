import React from 'react';
import {shallow} from 'enzyme';
import Select from 'react-select';

import MultiTable from './MultiTable';
import Table from './Table';
import dataReducer from './modules/data';

it('can change tables', () => {
  const mockEvent = jest.fn();

  // Fake a reducer call to get the initial state
  const data = dataReducer(undefined, {}).sourceData;

  const wrapper = shallow(
    <MultiTable ReactGA={{event: mockEvent}} tables={data} />
  );

  // Change the table
  wrapper.find(Select).simulate('change', {value: 'Patient'});

  // An analytics event should be fired
  expect(mockEvent.mock.calls.length).toBe(1);
  expect(mockEvent.mock.calls[0][0].category).toBe('User Selecting A Table');
  expect(mockEvent.mock.calls[0][0].action).toBe('Patient');

  // The new table should be displayed
  expect(wrapper.find(Table).prop('columns')).toBe(data.Patient.columns);
  expect(wrapper.find(Table).prop('data')).toBe(data.Patient.data);
});
