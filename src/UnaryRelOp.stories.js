import React from 'react';

import {Projection, Rename, Selection, UnaryRelOp} from './RelOp';
import Relation from './Relation';

const UnaryRelOpStories = {
  title: 'UnaryRelOp',
  component: UnaryRelOp,
};

export default UnaryRelOpStories;

export const SimpleProjection = () => (
  <UnaryRelOp operator={<Projection project={['firstName', 'lastName']} />}>
    <Relation name="Doctor" />
  </UnaryRelOp>
);
SimpleProjection.storyName = 'a simple projection';

export const SimpleSelection = () => (
  <UnaryRelOp operator={<Selection select={'salary > 100K'} />}>
    <Relation name="Doctor" />
  </UnaryRelOp>
);
SimpleSelection.storyName = 'a simple selection';

export const SimpleRename = () => (
  <UnaryRelOp operator={<Rename rename={{columns: {firstName: 'name'}}} />}>
    <Relation name="Doctor" />
  </UnaryRelOp>
);
SimpleRename.storyName = 'a simple rename';

export const NestedOperations = () => (
  <UnaryRelOp operator={<Rename rename={{columns: {firstName: 'name'}}} />}>
    <UnaryRelOp operator={<Projection project={['firstName', 'lastName']} />}>
      <UnaryRelOp operator={<Selection select={'salary > 100K'} />}>
        <Relation name="Doctor" />
      </UnaryRelOp>
    </UnaryRelOp>
  </UnaryRelOp>
);
NestedOperations.storyName = 'nested operations';
