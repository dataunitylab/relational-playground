// @flow
import React, {Component} from 'react';
import ReactDOM from 'react-dom';

import type {Element, Node} from 'react';

type Props = {
  children: Node,
};

type State = {
  hoverClass: string,
};

/** Base class for all relational algebra operators */
class RelOp extends Component<Props, State> {
  constructor() {
    super();
    this.state = {
      hoverClass: '',
    };
    (this: any).handleHover = this.handleHover.bind(this);
  }

  handleHover(e: SyntheticMouseEvent<HTMLElement>) {
    const hovering = e.type === 'mouseover';
    e.stopPropagation();

    const node = ReactDOM.findDOMNode(this);

    if (node) {
      let newClassName = node instanceof HTMLElement ? node.className : '';

      newClassName = newClassName.replace(' RelOp', '');
      newClassName = newClassName.replace(' hovering', '');
      newClassName += ' RelOp' + (hovering ? ' hovering' : '');

      this.setState({hoverClass: newClassName});
      if (node instanceof HTMLElement) node.className = newClassName;
    }
  }

  render() {
    return (
      <span
        className={this.state.hoverClass}
        onMouseOver={this.handleHover}
        onMouseOut={this.handleHover}
      >
        {this.props.children}
      </span>
    );
  }
}

type UnaryProps = {
  operator: Element<any>,
  children: Node,
};

class UnaryRelOpInternal extends Component<UnaryProps> {
  render() {
    return (
      <span>
        {this.props.operator}({this.props.children})
      </span>
    );
  }
}

class UnaryRelOp extends Component<UnaryProps> {
  render() {
    return (
      <RelOp>
        <UnaryRelOpInternal
          operator={this.props.operator}
          children={this.props.children}
        />
      </RelOp>
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

type BinaryProps = {
  operator: Element<any>,
  left: Node,
  right: Node,
};

class BinaryRelOpInternal extends Component<BinaryProps> {
  render() {
    return (
      <span>
        {this.props.left}
        {this.props.operator}
        {this.props.right}
      </span>
    );
  }
}

class BinaryRelOp extends Component<BinaryProps> {
  render() {
    return (
      <RelOp>
        <BinaryRelOpInternal
          left={this.props.left}
          operator={this.props.operator}
          right={this.props.right}
        />
      </RelOp>
    );
  }
}

class Except extends Component<{}> {
  render() {
    return <span>&minus;</span>;
  }
}
class Intersect extends Component<{}> {
  render() {
    return <span>&cap;</span>;
  }
}

class Join extends Component<{}> {
  render() {
    return <span>&times;</span>;
  }
}

class Union extends Component<{}> {
  render() {
    return <span>&cup;</span>;
  }
}

export {
  RelOp as default,
  UnaryRelOp,
  Projection,
  Rename,
  Selection,
  BinaryRelOp,
  Except,
  Intersect,
  Join,
  Union,
};
