import React from 'react';
import {shallow} from 'enzyme';
import {BrowserView, MobileView} from 'react-device-detect';
import MultiTable from './MultiTable';
import dataReducer from './modules/data';

it('can change tables browser', () => {
  const mockEvent = jest.fn();

  // Fake a reducer call to get the initial state
  const data = dataReducer(undefined, {}).sourceData;

  const wrapper = shallow(
    <MultiTable
      ReactGA={{event: mockEvent}}
      tables={data}
      testIsMobile={false}
    />
  );

  let browserSelect = wrapper.find('.browserSelect');

  // Change the table
  browserSelect.simulate('change', {value: 'Patient'});

  expect(mockEvent.mock.calls.length).toBe(1);
  expect(mockEvent.mock.calls[0][0].category).toBe('User Selecting A Table');
  expect(mockEvent.mock.calls[0][0].action).toBe('Patient');

  expect(wrapper.find('.browserTable').prop('columns')).toBe(
    data.Patient.columns
  );
  expect(wrapper.find('.browserTable').prop('data')).toBe(data.Patient.data);
});

it('can change tables mobile', () => {
  const mockEvent = jest.fn();
  // Fake a reducer call to get the initial state
  const data = dataReducer(undefined, {}).sourceData;

  const wrapper = shallow(
    <MultiTable
      ReactGA={{event: mockEvent}}
      tables={data}
      testIsMobile={true}
    />
  );

  wrapper.find(MultiTable).state.isMobile = true;

  let mobileSelect = wrapper.find('.mobileSelect');
  mobileSelect.simulate('change', {value: 'Patient'});

  expect(mockEvent.mock.calls.length).toBe(1);
  expect(mockEvent.mock.calls[0][0].category).toBe('User Selecting A Table');
  expect(mockEvent.mock.calls[0][0].action).toBe('Patient');

  let mobileButton = wrapper.find('.mobileButton');
  mobileButton.simulate('click');

  expect(wrapper.find('.mobileTable').prop('columns')).toBe(
    data.Patient.columns
  );
  expect(wrapper.find('.mobileTable').prop('data')).toBe(data.Patient.data);
});
