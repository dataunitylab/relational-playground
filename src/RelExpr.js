// @flow
import React, {Component} from 'react';
import RelOp, {Projection, Rename, Selection} from './RelOp';
import Relation from './Relation';
import {changeExpr} from './modules/data';
import ReactGA from 'react-ga';

type Props = {
  changeExpr?: typeof changeExpr,
  expr: {[string]: any},
};

/** A graphical representation of a relational algebra expression */
class RelExpr extends Component<Props> {
  constructor() {
    super();
    ReactGA.initialize('UA-143847373-1', {testMode: true});
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
    switch (Object.keys(expr)[0]) {
      case 'projection':
        return (
          <RelOp
            operator={
              <Projection project={expr.projection.arguments.project} />
            }
          >
            <RelExpr
              expr={expr.projection.children[0]}
              changeExpr={this.props.changeExpr}
            />
          </RelOp>
        );

      case 'selection':
        return (
          <RelOp
            operator={
              <Selection
                select={this.conditionToString(expr.selection.arguments.select)}
              />
            }
          >
            <RelExpr
              expr={expr.selection.children[0]}
              changeExpr={this.props.changeExpr}
            />
          </RelOp>
        );

      case 'rename':
        return (
          <RelOp operator={<Rename rename={expr.rename.arguments.rename} />}>
            <RelExpr
              expr={expr.rename.children[0]}
              changeExpr={this.props.changeExpr}
            />
          </RelOp>
        );

      case 'relation':
        return <Relation name={expr.relation} />;

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
      const target =
        e.target instanceof HTMLInputElement ? e.target : undefined;
      const parent =
        target && target.parentElement instanceof HTMLElement
          ? target.parentElement
          : undefined;
      this.props.changeExpr(this.props.expr, parent);
      ReactGA.event({
        category: 'User Selecting Relational Algebra Enclosure',
        action: Object.keys(this.props.expr)[0],
      });
    }
  }

  render() {
    return (
      <span onClick={e => this.handleExprClick(e)} style={{margin: '.4em'}}>
        {this.buildExpr(this.props.expr)}
      </span>
    );
  }
}

export default RelExpr;
