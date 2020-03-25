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
import {changeExpr} from './modules/data';
import ReactDOM from 'react-dom';

import './RelExpr.css';

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
   * @param expr - an object representing an expression
   * @param top - whether this is a top-level expression - to avoid unneccessary ()
   * @return a string representing a query condition
   */
  exprToString(expr: {[string]: any}, top: boolean = true): string {
    // We have reached a simple value
    if (typeof expr !== 'object') {
      return expr.toString();
    }

    const opMap = {
      $gte: '>=',
      $gt: '>',
      $lt: '<',
      $lte: '<=',
      $ne: '!=',
      $eq: '=',
    };

    const type = Object.keys(expr)[0];
    let exprString;
    switch (type) {
      case 'cmp':
        exprString =
          expr.cmp.lhs + ' ' + opMap[expr.cmp.op] + ' ' + expr.cmp.rhs;
        break;

      case 'and':
        exprString = expr.and.clauses
          .map((c) => this.exprToString(c, false))
          .join(' ∧ ');
        break;

      case 'or':
        exprString = expr.or.clauses
          .map((c) => this.exprToString(c, false))
          .join(' ∨ ');
        break;

      case 'not':
        exprString = '¬' + this.exprToString(expr.not.clause, false);
        break;

      default:
        throw new Error('Unhandled expression object');
    }

    // Parenthesize if we're not at the top level
    if (top) {
      return exprString;
    } else {
      return '(' + exprString + ')';
    }
  }

  /**
   * @param expr - a relational algebra expression object to render
   * @return a component representing the top-most expression
   */
  buildExpr(expr: {[string]: any}) {
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
                  select={this.exprToString(expr.selection.arguments.select)}
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
  handleExprClick(e: SyntheticMouseEvent<HTMLElement>) {
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

  render() {
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
