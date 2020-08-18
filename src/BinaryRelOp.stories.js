import React from 'react';

import {BinaryRelOp, Join} from './RelOp';
import Relation from '../src/Relation';

export default {
  title: 'BinaryRelOp',
  component: BinaryRelOp,
};

export const SimpleJoin = () => (
  <BinaryRelOp
    left={<Relation name="Doctor" />}
    operator={<Join />}
    right={<Relation name="Patient" />}
  />
);
SimpleJoin.storyName = 'a simple join';
