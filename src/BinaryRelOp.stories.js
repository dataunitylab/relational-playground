import React from 'react';

import {BinaryRelOp, Product, Join} from './RelOp';
import Relation from '../src/Relation';

const BinaryRelOpStories = {
  title: 'BinaryRelOp',
  component: BinaryRelOp,
};

export default BinaryRelOpStories;

export const SimpleProduct = () => (
  <BinaryRelOp
    left={<Relation name="Doctor" />}
    operator={<Product />}
    right={<Relation name="Patient" />}
  />
);
SimpleProduct.storyName = 'a simple product';

export const SimpleJoin = ({joinType}) => (
  <BinaryRelOp
    left={<Relation name="Doctor" />}
    operator={
      <Join type={joinType} condition={'Doctor.id=patient.primaryDoctor'} />
    }
    right={<Relation name="Patient" />}
  />
);
SimpleJoin.storyName = 'a simple join';
SimpleJoin.args = {
  joinType: 'left',
};
SimpleJoin.argTypes = {
  joinType: {
    options: ['left', 'right', 'inner'],
    control: {type: 'inline-radio'},
  },
};
