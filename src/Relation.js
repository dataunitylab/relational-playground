import React, { Component } from 'react';

import './Relation.css';

class Relation extends Component {
  render() {
    return <span data-testid="span" className="Relation">{this.props.name}</span>;
  }
}

export default Relation;
