// @flow
import React from 'react';

import './Relation.css';

type Props = {
  name: string,
};

/** Simple component to display a relation name as part of an expression */
function Relation(props: Props) {
  return (
    <span data-testid="span" className="Relation">
      {props.name}
    </span>
  );
}

export default Relation;
