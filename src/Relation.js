// @flow
import React from 'react';

import './Relation.css';

import type {StatelessFunctionalComponent} from 'react';

type Props = {
  name: string,
};

/** Simple component to display a relation name as part of an expression */
const Relation: StatelessFunctionalComponent<Props> = (props) => (
  <span data-testid="span" className="Relation">
    {props.name}
  </span>
);

export default Relation;
