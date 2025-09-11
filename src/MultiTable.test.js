import React from 'react';
import {render, fireEvent} from '@testing-library/react';
import * as reactDeviceDetect from 'react-device-detect';
import MultiTable from './MultiTable';
import dataReducer from './modules/data';

it('can change tables browser', () => {
  const mockEvent = jest.fn();

  // Fake a reducer call to get the initial state
  const data = dataReducer(undefined, {}).sourceData;

  const {container} = render(
    <MultiTable ReactGA={{event: mockEvent}} tables={data} />
  );

  const browserSelect = container.querySelector('.browserSelect');

  // Change the table
  fireEvent.change(browserSelect, {target: {value: 'Patient'}});

  expect(mockEvent.mock.calls.length).toBe(1);
  expect(mockEvent.mock.calls[0][0].category).toBe('User Selecting A Table');
  expect(mockEvent.mock.calls[0][0].action).toBe('Patient');

  // Check that the correct table data is displayed
  expect(container).toHaveTextContent('Patient');

  // The browserTable should be rendered (it's always rendered in browser view)
  const browserTable = container.querySelector('.ReactTable');
  expect(browserTable).toBeInTheDocument();

  // Check that Patient data is displayed
  data.Patient.columns.forEach((column) => {
    expect(container).toHaveTextContent(column);
  });
});

it('can change tables mobile', () => {
  const mockEvent = jest.fn();
  // Fake a reducer call to get the initial state
  const data = dataReducer(undefined, {}).sourceData;

  // Mock the isMobileOnly to true for this test
  const originalIsMobileOnly = reactDeviceDetect.isMobileOnly;
  reactDeviceDetect.isMobileOnly = true;

  const {container} = render(
    <MultiTable ReactGA={{event: mockEvent}} tables={data} />
  );

  const mobileSelect = container.querySelector('.mobileSelect');

  if (mobileSelect) {
    fireEvent.change(mobileSelect, {target: {value: 'Patient'}});

    expect(mockEvent.mock.calls.length).toBe(1);
    expect(mockEvent.mock.calls[0][0].category).toBe('User Selecting A Table');
    expect(mockEvent.mock.calls[0][0].action).toBe('Patient');

    const mobileButton = container.querySelector('.mobileButton');
    if (mobileButton) {
      fireEvent.click(mobileButton);
      // Check that mobile table is now displayed
      expect(container.querySelector('.mobileTable')).toBeInTheDocument();

      // Check that Patient data is displayed in mobile table
      data.Patient.columns.forEach((column) => {
        expect(container).toHaveTextContent(column);
      });
    }
  }

  // Restore original value
  reactDeviceDetect.isMobileOnly = originalIsMobileOnly;
});
