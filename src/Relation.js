// @flow
import React, {Component} from 'react';

import './Relation.css';

type Props = {
  name: string,
};

/** Simple component to display a relation name as part of an expression */
class Relation extends Component<Props> {
  render() {
    return (
      <span data-testid="span" className="Relation">
        {this.props.name}
      </span>
    );
  }
}

export default Relation;
