import React, { Component } from 'react';

import './RelOp.css';

class RelOp extends Component {
  constructor() {
    super();
    this.state = {isHovered: false};
    this.handleHover = this.handleHover.bind(this);
  }

  handleHover(e) {
    const hovering = e.type === 'mouseover';
    e.stopPropagation();
    this.setState((state) => {
      return {...state, isHovered: hovering};
    });
  }

  render() {
    const hoverClass = 'RelOp ' + (this.state.isHovered ? 'hovering' : '');
    return (
      <span className={hoverClass} onMouseOver={this.handleHover} onMouseOut={this.handleHover}>
        {this.props.operator}({this.props.children})
      </span>
    );
  }
}

class Projection extends Component {
  render() {
    return <span>&pi;<sub>{this.props.project.join(',')}</sub></span>;
  }
}

class Rename extends Component {
  render() {
    return <span>&rho;<sub>{Object.entries(this.props.rename).map(([o, n]) => o + '/' + n).join(',')}</sub></span>;
  }
}

class Selection extends Component {
  render() {
    return <span>&sigma;<sub>{this.props.select.join(' ∧ ')}</sub></span>;
  }
}

export { RelOp as default, Projection, Rename, Selection };
