// @flow
import React, {Component} from 'react';
import type {Element, Node} from 'react';

import './RelOp.css';

type Props = {
  operator: Element<any>,
  children: Node,
};

type State = {
  isHovered: boolean
};

/** Base class for all relational algebra operators */
class RelOp extends Component<Props, State> {
  constructor() {
    super();
    this.state = {isHovered: false};
    (this: any).handleHover = this.handleHover.bind(this);

  }

  handleHover(e: SyntheticMouseEvent<HTMLElement>) {
    const hovering = e.type === 'mouseover';
    e.stopPropagation();
    this.setState(state => {
      return {...state, isHovered: hovering};
    });
  }

  render() {
    const hoverClass = 'RelOp ' + (this.state.isHovered ? 'hovering' : '');

    return (
        <span
            className={hoverClass}
            onMouseOver={this.handleHover}
            onMouseOut={this.handleHover}
        >
        {this.props.operator}({this.props.children})
      </span>
    );
  }
}

/** Projection relational algebra operator */
class Projection extends Component<{project: Array<string>}> {
  render() {
    return (
      <span>
        &pi;<sub>{this.props.project.join(',')}</sub>
      </span>
    );
  }
}

/** Selection relational algebra operator */
class Selection extends Component<{select: Array<string>}> {
  render() {
    return (
      <span>
          &sigma;<sub>{this.props.select.join(' ∧ ')}</sub>
      </span>
    );
  }
}

/** Rename relational algebra operator */
class Rename extends Component<{rename: {[string]: string}}> {
  render() {
    return (
        <span>
        &rho;
          <sub>
          {/* Loop over all columns to rename and combine them */}
            {Object.entries(this.props.rename)
                .map(([o, n]) => {
                  return o + '/' + ((n: any): string);
                })
                .join(',')}
        </sub>
      </span>
    );
  }
}

export {RelOp as default, Projection, Rename, Selection};