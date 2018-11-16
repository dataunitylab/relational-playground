// @flow
import React, { Component } from 'react';

import './Relation.css';

type Props = {
  name: string
};

class Relation extends Component<Props> {
  render() {
    return <span data-testid="span" className="Relation">{this.props.name}</span>;
  }
}

export default Relation;
