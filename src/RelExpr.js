import React, { Component } from 'react';
import RelOp, { Projection, Rename, Selection } from './RelOp';

class RelExpr extends Component {
  conditionToString(select, conds = []) {
    if (select.length === 0) { return conds; }

    const field = Object.keys(select[0])[0];
    const op = Object.keys(select[0][field])[0];
    const opMap = {
      '$gte': '>=',
      '$gt': '>=',
      '$lt': '<',
      '$lte': '<=',
      '$ne': '!=',
      '$eq': '=',
    };
    conds.push(field + ' ' + opMap[op] + ' ' + select[0][field][op]);

    return conds;
  }

  buildExpr(expr) {
    switch(Object.keys(expr)[0]) {
      case 'projection':
        return (
          <RelOp operator={<Projection project={expr.projection.arguments.project}/>}>
            {this.buildExpr(expr.projection.children[0])}
          </RelOp>
        );
      case 'selection':
        return (
          <RelOp operator={<Selection select={this.conditionToString(expr.selection.arguments.select)}/>}>
            {this.buildExpr(expr.selection.children[0])}
          </RelOp>
        );
      case 'rename':
        return (
          <RelOp operator={<Rename rename={expr.rename.arguments.rename}/>}>
            {this.buildExpr(expr.rename.children[0])}
          </RelOp>
        );
      case 'relation':
        return expr.relation;
      default:
        return Object.keys(expr)[0];
    }
  }

  render() {
    return this.buildExpr(this.props.expr);
  }
}

export default RelExpr;
