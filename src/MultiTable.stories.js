import React from 'react';

import MultiTable from '../src/MultiTable';

const MultiTableStories = {
  title: 'MultiTable',
  component: MultiTable,
};

export default MultiTableStories;

export const SeveralSources = () => (
  <MultiTable
    tables={{
      Doctor: {
        name: 'Doctor',
        columns: ['firstName', 'lastName', 'salary'],
        data: [
          {firstName: 'Alice', lastName: 'Yang', salary: 176000},
          {firstName: 'Bob', lastName: 'Smith', salary: 120000},
        ],
      },
      Patient: {
        name: 'Patient',
        columns: ['firstName', 'lastName'],
        data: [
          {firstName: 'Carlos', lastName: 'Vasquez'},
          {firstName: 'Xu', lastName: 'Xing'},
        ],
      },
    }}
  />
);
SeveralSources.storyName = 'with several sources';
