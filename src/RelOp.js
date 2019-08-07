// @flow
import React, {Component} from 'react';

import type {Element, Node} from 'react';

import './RelOp.css';

type Props = {
  operator: Element<any>,
};

type State = {
  isHovered: boolean,
};

/** Base class for all relational algebra operators */
class RelOp<T> extends Component<T, State> {
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
}

type UnaryProps = Props & {
  children: Node,
};

class UnaryRelOp extends RelOp<UnaryProps> {
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

type BinaryProps = Props & {
  left: Node,
  right: Node,
};

class BinaryRelOp extends RelOp<BinaryProps> {
  render() {
    const hoverClass = 'RelOp ' + (this.state.isHovered ? 'hovering' : '');
    return (
      <span
        className={hoverClass}
        onMouseOver={this.handleHover}
        onMouseOut={this.handleHover}
      >
        {this.props.left}{this.props.operator}{this.props.right}
      </span>
    );
  }
}

class Join extends Component<{}> {
  render() {
    return <span>&times;</span>;
  }
}

export {
  RelOp as default,
  UnaryRelOp,
  Projection,
  Rename,
  Selection,
  BinaryRelOp,
  Join,
};
