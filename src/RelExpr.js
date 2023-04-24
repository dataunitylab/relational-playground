// @flow
import React, {useEffect, useRef} from 'react';
import {
  UnaryRelOp,
  Projection,
  Rename,
  Selection,
  BinaryRelOp,
  Except,
  OrderBy,
  Product,
  Join,
  Intersect,
  Union,
} from './RelOp';
import Relation from './Relation';
import {exprToString} from './util';
import {changeExpr} from './modules/data';
import ReactDOM from 'react-dom';

import './RelExpr.css';

import type {Node, StatelessFunctionalComponent} from 'react';
import {useSelector} from 'react-redux';
import type {State} from './modules/relexp';

type Props = {
  changeExpr: typeof changeExpr,
  expr: {[string]: any},
  ReactGA: any,
};

/** A graphical representation of a relational algebra expression */
const RelExpr: StatelessFunctionalComponent<Props> = (props) => {
  const nodeRef = useRef<?HTMLSpanElement>();
  const currentNode = useSelector<{data: State}, _>((state) => state.data.expr);

  useEffect(() => {
    // Adjust 'clicked' highlighting based on any changes to currentNode selected
    const node =
      ReactDOM.findDOMNode(nodeRef.current) instanceof HTMLElement
        ? ReactDOM.findDOMNode(nodeRef.current)
        : undefined;
    if (node instanceof HTMLElement) {
      const clicked = props.expr === currentNode;
      let newClassName = node.className;
      if (!clicked) {
        newClassName = newClassName.replace(' clicked', '');
        newClassName = newClassName.replace(' hovering', '');
      }
      node.className = newClassName;
    }
  }, [currentNode, props.expr]);

  /**
   * @param expr - a relational algebra expression object to render
   * @return a component representing the top-most expression
   */
  const buildExpr = (expr: {[string]: any}): Node => {
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
                changeExpr={props.changeExpr}
                ReactGA={props.ReactGA}
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
                changeExpr={props.changeExpr}
                ReactGA={props.ReactGA}
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
                changeExpr={props.changeExpr}
                ReactGA={props.ReactGA}
              />
            </UnaryRelOp>
          </span>
        );

      case 'relation':
        return <Relation name={expr.relation} />;

      case 'order_by':
        return (
          <OrderBy
            columns={expr.order_by.arguments.order_by}
            relation={buildExpr(expr.order_by.children[0])}
          />
        );

      case 'join':
        return (
          <Join
            type={expr.join.type}
            condition={exprToString(expr.join.condition)}
            left={buildExpr(expr.join.left)}
            right={buildExpr(expr.join.right)}
          />
        );

      case 'except':
      case 'intersect':
      case 'product':
      case 'union':
        const operator = {
          except: <Except />,
          intersect: <Intersect />,
          product: <Product />,
          union: <Union />,
        }[type];
        return (
          <BinaryRelOp
            operator={operator}
            left={
              <RelExpr
                expr={expr[type].left}
                ReactGA={props.ReactGA}
                changeExpr={props.changeExpr}
              />
            }
            right={
              <RelExpr
                expr={expr[type].right}
                ReactGA={props.ReactGA}
                changeExpr={props.changeExpr}
              />
            }
          />
        );

      default:
        throw new Error('Invalid expression ' + JSON.stringify(expr) + '.');
    }
  };

  /**
   * @param e - the event object which generated the click
   */
  const handleExprClick = (e: SyntheticMouseEvent<HTMLElement>): void => {
    e.stopPropagation();
    const node =
      ReactDOM.findDOMNode(nodeRef.current) instanceof HTMLElement
        ? ReactDOM.findDOMNode(nodeRef.current)
        : undefined;
    if (node instanceof HTMLElement) {
      let newClassName = node.className;
      const clicked = e.type === 'click' && !newClassName.includes(' clicked');

      if (props.changeExpr) {
        if (clicked) {
          props.changeExpr(props.expr, node);
        } else {
          props.changeExpr({}, node);
        }
      }

      newClassName = newClassName.replace(' clicked', '');
      newClassName = newClassName.replace(' hovering', '');
      newClassName += clicked ? ' clicked' : '';

      node.className = newClassName;
    }

    props.ReactGA.event({
      category: 'User Selecting Relational Algebra Enclosure',
      action: Object.keys(props.expr)[0],
    });
  };

  const handleExprHover = (e: SyntheticMouseEvent<HTMLElement>): void => {
    e.stopPropagation();
    const node =
      ReactDOM.findDOMNode(nodeRef.current) instanceof HTMLElement
        ? ReactDOM.findDOMNode(nodeRef.current)
        : undefined;

    if (node instanceof HTMLElement) {
      const hovering = e.type === 'mouseover';
      let newClassName = node.className;
      newClassName = newClassName.replace(' hovering', '');
      newClassName += hovering ? ' hovering' : '';

      node.className = newClassName;
    }
  };

  if (!props.expr || Object.keys(props.expr).length === 0) {
    return '';
  }
  const type = Object.keys(props.expr)[0];
  if (type === 'relation') {
    return (
      <span className="RelExpr" style={{margin: '.4em'}}>
        {buildExpr(props.expr)}
      </span>
    );
  } else {
    return (
      <span
        className="RelExpr"
        onMouseOver={handleExprHover}
        onMouseOut={handleExprHover}
        onClick={handleExprClick}
        style={{margin: '.4em'}}
        ref={nodeRef}
      >
        {buildExpr(props.expr)}
      </span>
    );
  }
};

export default RelExpr;
