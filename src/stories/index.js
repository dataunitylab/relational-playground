import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { linkTo } from '@storybook/addon-links';

import { Button, Welcome } from '@storybook/react/demo';
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
