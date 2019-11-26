import React from 'react';

import {storiesOf} from '@storybook/react';

import {Projection, Rename, Selection, UnaryRelOp} from '../src/RelOp';
import RelExpr from '../src/RelExpr';
import MultiTable from '../src/MultiTable';
import Table from '../src/Table';

storiesOf('Table', module).add('with some data', () => (
  <Table
    tableName="Doctor"
    columns={['firstName', 'lastName', 'salary']}
    data={[
      {firstName: 'Alice', lastName: 'Yang', salary: 176000},
      {firstName: 'Bob', lastName: 'Smith', salary: 120000},
    ]}
  />
));

storiesOf('MultiTable', module).add('with several sources', () => (
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
));

storiesOf('RelOp', module)
  .add('a simple projection', () => (
    <UnaryRelOp operator={<Projection project={['firstName', 'lastName']} />}>
      Doctor
    </UnaryRelOp>
  ))
  .add('a simple selection', () => (
    <UnaryRelOp operator={<Selection select={['salary > 100K']} />}>Doctor</UnaryRelOp>
  ))
  .add('a simple rename', () => (
    <UnaryRelOp operator={<Rename rename={{firstName: 'name'}} />}>Doctor</UnaryRelOp>
  ))
  .add('nested operations', () => (
    <UnaryRelOp operator={<Rename rename={{firstName: 'name'}} />}>
      <UnaryRelOp operator={<Projection project={['firstName', 'lastName']} />}>
        <UnaryRelOp operator={<Selection select={['salary > 100K']} />}>
          Doctor
        </UnaryRelOp>
      </UnaryRelOp>
    </UnaryRelOp>
  ));

storiesOf('RelExpr', module).add('a complex expression', () => (
  <RelExpr
    expr={{
      rename: {
        arguments: {rename: {firstName: 'name'}},
        children: [
          {
            projection: {
              arguments: {project: ['firstName', 'lastName']},
              children: [
                {
                  selection: {
                    arguments: {select: [{salary: {$gt: 100000}}]},
                    children: [{relation: 'Doctor'}],
                  },
                },
              ],
            },
          },
        ],
      },
    }}
    changeExpr={(expr, element) => undefined}
  />
));
