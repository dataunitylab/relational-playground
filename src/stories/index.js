import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { linkTo } from '@storybook/addon-links';

import RelOp, { Projection, Rename, Selection } from '../RelOp';
import Table from '../Table';

storiesOf('Table', module)
  .add('with some data', () => (
    <Table
      tableName="Doctor"
      columns={["firstName", "lastName", "salary"]}
      data={[
        {firstName: "Alice", lastName: "Yang", salary: 176000},
        {firstName: "Bob", lastName: "Smith", salary: 120000},
      ]}>
    </Table>
  ));

storiesOf('RelOp', module)
  .add('a simple projection', () => (
    <RelOp operator={<Projection project={['firstName', 'lastName']}/>}>Doctor</RelOp>
  ))
  .add('a simple selection', () => (
    <RelOp operator={<Selection select={['salary > 100K']}/>}>Doctor</RelOp>
  ))
  .add('a simple rename', () => (
    <RelOp operator={<Rename rename={{'firstName': 'name'}}/>}>Doctor</RelOp>
  ))
  .add('nested operations', () => (
    <RelOp operator={<Rename rename={{'firstName': 'name'}}/>}>
      <RelOp operator={<Projection project={['firstName', 'lastName']}/>}>
        <RelOp operator={<Selection select={['salary > 100K']}/>}>Doctor</RelOp>
      </RelOp>
    </RelOp>
  ));
