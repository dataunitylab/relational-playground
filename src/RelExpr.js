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

type Props = {
  changeExpr?: typeof changeExpr,
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
   * @param select - an array of objects representing conditions
   * @param conds - an array of conditions to be added to
   * @return a string representing a query condition
   */
  conditionToString(select: Array<{[string]: any}>, conds: Array<string> = []) {
    if (select.length === 0) {
      return conds;
    }
    const opMap = {
      $gte: '>=',
      $gt: '>',
      $lt: '<',
      $lte: '<=',
      $ne: '!=',
      $eq: '=',
    };
    const field = Object.keys(select[0])[0];
    for (let i = 0; i < select.length; i++) {
      const op = Object.keys(select[i][field])[0];
      conds.push(field + ' ' + opMap[op] + ' ' + select[i][field][op]);
    }
    return conds;
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
          <span onClick={this.handleExprClick}>
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
          <span onClick={this.handleExprClick}>
            <UnaryRelOp
              operator={
                <Selection
                  select={this.conditionToString(
                    expr.selection.arguments.select
                  )}
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
          <span onClick={this.handleExprClick}>
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
          <span onClick={this.handleExprClick}>
            <BinaryRelOp
              operator={operator}
              left={
                <RelExpr expr={expr[type].left} ReactGA={this.props.ReactGA} />
              }
              right={
                <RelExpr expr={expr[type].right} ReactGA={this.props.ReactGA} />
              }
            />
          </span>
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
    if (this.props.changeExpr) {
      const target = e.target instanceof HTMLElement ? e.target : undefined;

      if (target.className.includes('RelOp')) {
        const element =
          target && target.parentElement instanceof HTMLElement
            ? target.parentElement.parentElement.parentElement
            : undefined;
        this.props.changeExpr(this.props.expr, element);
      } else {
        const element =
          target && target.parentElement instanceof HTMLElement
            ? target.parentElement
            : undefined;
        this.props.changeExpr(this.props.expr, element);
      }

      this.props.ReactGA.event({
        category: 'User Selecting Relational Algebra Enclosure',
        action: Object.keys(this.props.expr)[0],
      });
    }
  }

  render() {
    return (
      <span style={{margin: '.4em'}}>{this.buildExpr(this.props.expr)}</span>
    );
  }
}

export default RelExpr;
