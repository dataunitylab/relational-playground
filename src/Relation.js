import React, { Component } from 'react';

import './Relation.css';

class Relation extends Component {
  render() {
    return <span className="Relation">{this.props.name}</span>;
  }
}

export default Relation;
