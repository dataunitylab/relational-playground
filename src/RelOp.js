// @flow
import React, {Component} from 'react';

import type {Element, Node} from 'react';

import './RelOp.css';

type Props = {
  operator: Element<any>,
  children: Node,
};

type State = {
  isHovered: boolean,
  isClicked: boolean
};

/** Base class for all relational algebra operators */
class RelOp extends Component<Props, State> {
  constructor() {
    super();
    this.state = {isHovered: false, isClicked: false};
    (this: any).handleHover = this.handleHover.bind(this);
    (this: any).handleClick = this.handleClick.bind(this);

  }

  handleHover(e: SyntheticMouseEvent<HTMLElement>) {
    const hovering = e.type === 'mouseover';
    e.stopPropagation();
    this.setState(state => {
      return {...state, isHovered: hovering};
    });
  }

  handleClick(e: SyntheticMouseEvent<HTMLElement>){
    const clicked = e.type === 'click';
    if(this.state.isClicked){
      this.setState(state => {
        return {...state, isClicked: false && clicked};
      });
    }else{
      this.setState(state => {
        return {...state, isClicked: clicked};
      });
    }
  }

  render() {
    const hoverClass = 'RelOp ' + (this.state.isHovered ? 'hovering' : '');
    const clickedClass = 'RelOp ' + (this.state.isClicked ? 'clicked' : '');
    return (
        <span
            className={(clickedClass === 'RelOp ') ? hoverClass : clickedClass}
            onMouseOver={this.handleHover}
            onMouseOut={this.handleHover}
            onClick={this.handleClick}
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

export {RelOp as default, Projection, Rename, Selection};