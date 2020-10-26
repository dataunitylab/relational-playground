import React from 'react';

import {BinaryRelOp, Join} from './RelOp';
import Relation from '../src/Relation';

const BinaryRelOpStories = {
  title: 'BinaryRelOp',
  component: BinaryRelOp,
};

export default BinaryRelOpStories;

export const SimpleJoin = () => (
  <BinaryRelOp
    left={<Relation name="Doctor" />}
    operator={<Join />}
    right={<Relation name="Patient" />}
  />
);
SimpleJoin.storyName = 'a simple join';
