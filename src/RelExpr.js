// @flow
import React, {Component} from 'react';
import {
  UnaryRelOp,
  Projection,
  Rename,
  Selection,
  BinaryRelOp,
  Except,
  Join,
  Intersect,
  Union,
} from './RelOp';
import Relation from './Relation';
import {exprToString} from './util';
import {changeExpr} from './modules/data';
import ReactDOM from 'react-dom';

import './RelExpr.css';

import type {Node} from 'react';

type Props = {
  changeExpr: typeof changeExpr,
  expr: {[string]: any},
  ReactGA: any,
};

/** A graphical representation of a relational algebra expression */
class RelExpr extends Component<Props> {
  constructor() {
    super();
    (this: any).handleExprClick = this.handleExprClick.bind(this);
  }

  /**
   * @param expr - a relational algebra expression object to render
   * @return a component representing the top-most expression
   */
  buildExpr(expr: {[string]: any}): Node {
    // Don't try to render empty expressions
    if (!expr || Object.keys(expr).length === 0) {
      return '';
    }
    const type = Object.keys(expr)[0];
    switch (type) {
      case 'projection':
        return (
          <span>
            <UnaryRelOp
              operator={
                <Projection project={expr.projection.arguments.project} />
              }
            >
              <RelExpr
                expr={expr.projection.children[0]}
                changeExpr={this.props.changeExpr}
                ReactGA={this.props.ReactGA}
              />
            </UnaryRelOp>
          </span>
        );

      case 'selection':
        return (
          <span>
            <UnaryRelOp
              operator={
                <Selection
                  select={exprToString(expr.selection.arguments.select)}
                />
              }
            >
              <RelExpr
                expr={expr.selection.children[0]}
                changeExpr={this.props.changeExpr}
                ReactGA={this.props.ReactGA}
              />
            </UnaryRelOp>
          </span>
        );

      case 'rename':
        return (
          <span>
            <UnaryRelOp
              operator={<Rename rename={expr.rename.arguments.rename} />}
            >
              <RelExpr
                expr={expr.rename.children[0]}
                changeExpr={this.props.changeExpr}
                ReactGA={this.props.ReactGA}
              />
            </UnaryRelOp>
          </span>
        );

      case 'relation':
        return <Relation name={expr.relation} />;

      case 'except':
      case 'intersect':
      case 'join':
      case 'union':
        const operator = {
          except: <Except />,
          intersect: <Intersect />,
          join: <Join />,
          union: <Union />,
        }[type];
        return (
          <BinaryRelOp
            operator={operator}
            left={
              <RelExpr
                expr={expr[type].left}
                ReactGA={this.props.ReactGA}
                changeExpr={this.props.changeExpr}
              />
            }
            right={
              <RelExpr
                expr={expr[type].right}
                ReactGA={this.props.ReactGA}
                changeExpr={this.props.changeExpr}
              />
            }
          />
        );

      default:
        throw new Error('Invalid expression ' + JSON.stringify(expr) + '.');
    }
  }

  /**
   * @param e - the event object which generated the click
   */
  handleExprClick(e: SyntheticMouseEvent<HTMLElement>): void {
    e.stopPropagation();
    const node =
      ReactDOM.findDOMNode(this) instanceof HTMLElement
        ? ReactDOM.findDOMNode(this)
        : undefined;

    if (node instanceof HTMLElement && this.props.changeExpr) {
      this.props.changeExpr(this.props.expr, node);
    }

    this.props.ReactGA.event({
      category: 'User Selecting Relational Algebra Enclosure',
      action: Object.keys(this.props.expr)[0],
    });
  }

  render(): Node {
    if (!this.props.expr || Object.keys(this.props.expr).length === 0) {
      return '';
    }
    const type = Object.keys(this.props.expr)[0];
    if (type === 'relation') {
      return (
        <span className="RelExpr" style={{margin: '.4em'}}>
          {this.buildExpr(this.props.expr)}
        </span>
      );
    } else {
      return (
        <span
          className="RelExpr"
          onClick={this.handleExprClick}
          style={{margin: '.4em'}}
        >
          {this.buildExpr(this.props.expr)}
        </span>
      );
    }
  }
}

export default RelExpr;
