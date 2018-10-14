import React, { Component } from 'react';

class RelOp extends Component {
  render() {
    return (<span>{this.props.operator}({this.props.children})</span>);
  }
}

class Projection extends Component {
  render() {
    return <span>&pi;<sub>{this.props.project.join(',')}</sub></span>;
  }
}

class Rename extends Component {
  render() {
    return <span>&rho;<sub>{Object.entries(this.props.rename).map(([o, n]) => o + '/' + n)}</sub></span>;
  }
}

class Selection extends Component {
  render() {
    return <span>&sigma;<sub>{this.props.select.join(' &#8743; ')}</sub></span>;
  }
}

export { RelOp as default, Projection, Rename, Selection };
