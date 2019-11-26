import React from 'react';

import {storiesOf} from '@storybook/react';

import {BinaryRelOp, Join, Projection, Rename, Selection, UnaryRelOp} from '../src/RelOp';
import RelExpr from '../src/RelExpr';
import Relation from '../src/Relation';
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

storiesOf('UnaryRelOp', module)
  .add('a simple projection', () => (
    <UnaryRelOp operator={<Projection project={['firstName', 'lastName']} />}>
      <Relation name='Doctor' />
    </UnaryRelOp>
  ))
  .add('a simple selection', () => (
    <UnaryRelOp operator={<Selection select={['salary > 100K']} />}>
      <Relation name='Doctor' />
    </UnaryRelOp>
  ))
  .add('a simple rename', () => (
    <UnaryRelOp operator={<Rename rename={{firstName: 'name'}} />}>
      <Relation name='Doctor' />
    </UnaryRelOp>
  ))
  .add('nested operations', () => (
    <UnaryRelOp operator={<Rename rename={{firstName: 'name'}} />}>
      <UnaryRelOp operator={<Projection project={['firstName', 'lastName']} />}>
        <UnaryRelOp operator={<Selection select={['salary > 100K']} />}>
          <Relation name='Doctor' />
        </UnaryRelOp>
      </UnaryRelOp>
    </UnaryRelOp>
  ));

storiesOf('BinaryRelOp', module)
  .add('a simple join', () => (
    <BinaryRelOp
      left={<Relation name='Doctor'/>}
      operator={<Join/>}
      right={<Relation name='Patient'/>}/>
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
