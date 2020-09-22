// @flow
import React, {Component} from 'react';
import TreeMenu, {ItemComponent} from 'react-simple-tree-menu';
import {v4 as uuidv4} from 'uuid';
import {
  Projection,
  Rename,
  Selection,
  Except,
  Join,
  Intersect,
  Union,
} from './RelOp';
import {exprToString} from './util';
import {changeExpr} from './modules/data';

import '../node_modules/react-simple-tree-menu/dist/main.css';
import './RelExprTree.css';

import type {Node} from 'react';

type Props = {
  changeExpr: typeof changeExpr,
  expr: {[string]: any},
  ReactGA: any,
};

/** A graphical representation of a relational algebra expression */
class RelExprTree extends Component<Props> {
  /**
   * @param expr - a relational algebra expression object to render
   * @param keys - an array where all created paths should be saved
   * @param path - the path to the current node
   * @return a tree structure representing the exppression
   */
  buildTree(
    expr: {[string]: any},
    keys: Array<string>,
    path: Array<string> = []
  ): {} {
    // Don't try to render empty expressions
    if (!expr || Object.keys(expr).length === 0) {
      return {};
    }

    // Save the constructed path so we can set this open later
    const key = uuidv4();
    const newPath = [...path, key];
    keys.push(newPath.join('/'));

    const type = Object.keys(expr)[0];
    switch (type) {
      case 'projection':
      case 'selection':
      case 'rename':
        return {
          key: key,
          expr: expr,
          nodes: [this.buildTree(expr[type].children[0], keys, newPath)],
        };
      case 'relation':
        return {
          key: key,
          expr: expr,
        };
      case 'except':
      case 'intersect':
      case 'join':
      case 'union':
        return {
          key: key,
          expr: expr,
          nodes: [
            this.buildTree(expr[type].left, keys, newPath),
            this.buildTree(expr[type].right, keys, newPath),
          ],
        };
      default:
        throw new Error('Invalid expression ' + JSON.stringify(expr) + '.');
    }
  }

  getLabel(expr: {[string]: any}): Node {
    if (!expr || Object.keys(expr).length === 0) {
      return '';
    }

    const type = Object.keys(expr)[0];
    switch (type) {
      case 'projection':
        return <Projection project={expr.projection.arguments.project} />;
      case 'selection':
        return (
          <Selection select={exprToString(expr.selection.arguments.select)} />
        );
      case 'rename':
        return <Rename rename={expr.rename.arguments.rename} />;
      case 'relation':
        return expr.relation;
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
        return operator;
      default:
        throw new Error('Invalid expression ' + JSON.stringify(expr) + '.');
    }
  }

  render(): Node {
    const keys = [];
    const data = [this.buildTree(this.props.expr, keys)];
    return (
      <div className="RelExprTree">
        <TreeMenu
          data={data}
          initialOpenNodes={keys}
          hasSearch={false}
          disableKeyboard={true}
          onClickItem={(props) => {
            this.props.changeExpr(props.expr, null);

            this.props.ReactGA.event({
              category: 'User Selecting Relational Algebra Tree',
              action: Object.keys(props.expr)[0],
            });
          }}
        >
          {({search, items}) => (
            <div>
              {items.map(({key, ...props}) => {
                const newProps = {label: this.getLabel(props.expr)};
                Object.assign(props, newProps);
                return <ItemComponent key={key} {...props} />;
              })}
            </div>
          )}
        </TreeMenu>
      </div>
    );
  }
}

export default RelExprTree;
