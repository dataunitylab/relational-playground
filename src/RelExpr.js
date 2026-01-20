// @flow
import React, {useEffect, useRef, useState} from 'react';
import {
  Alias,
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
  GroupBy,
} from './RelOp';
import Relation from './Relation';
import {exprToString} from './util';
import {changeExpr} from './modules/data';
import {useReactGA} from './contexts/ReactGAContext';

import './RelExpr.css';

import type {Node, StatelessFunctionalComponent} from 'react';
import {useSelector} from 'react-redux';
import type {State} from './modules/relexp';

type Props = {
  changeExpr: typeof changeExpr,
  expr: {[string]: any},
  ReactGA?: any, // For backwards compatibility with tests
};

/** A graphical representation of a relational algebra expression */
const RelExpr: StatelessFunctionalComponent<Props> = (props) => {
  const nodeRef = useRef<?HTMLSpanElement>();
  const currentNode = useSelector<{data: State}, _>((state) => state.data.expr);
  const [isHovering, setIsHovering] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const contextReactGA = useReactGA();
  const ReactGA = props.ReactGA || contextReactGA;

  useEffect(() => {
    // Adjust 'clicked' highlighting based on any changes to currentNode selected
    const clicked = props.expr === currentNode;
    if (!clicked) {
      setIsSelected(false);
      setIsHovering(false);
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
              />
            </UnaryRelOp>
          </span>
        );

      case 'relation':
        return <Relation name={expr.relation} />;

      case 'alias':
        return (
          <Alias
            value={expr.alias.value}
            alias_value={expr.alias.alias_value}
          />
        );

      case 'order_by':
        return (
          <OrderBy
            columns={expr.order_by.arguments.order_by}
            relation={buildExpr(expr.order_by.children[0])}
          />
        );

      case 'group_by':
        return (
          <span>
            <UnaryRelOp
              operator={
                <GroupBy
                  groupBy={expr.group_by.arguments.groupBy}
                  aggregates={expr.group_by.arguments.aggregates.map(
                    (agg) =>
                      `${agg.aggregate.function}(${agg.aggregate.column})`
                  )}
                  selectColumns={expr.group_by.arguments.selectColumns}
                />
              }
            >
              <RelExpr
                expr={expr.group_by.children[0]}
                changeExpr={props.changeExpr}
              />
            </UnaryRelOp>
          </span>
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
              <RelExpr expr={expr[type].left} changeExpr={props.changeExpr} />
            }
            right={
              <RelExpr expr={expr[type].right} changeExpr={props.changeExpr} />
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
    const node = nodeRef.current;

    const clicked = e.type === 'click' && !isSelected;

    if (props.changeExpr && node instanceof HTMLElement) {
      if (clicked) {
        props.changeExpr(props.expr, node);
      } else {
        props.changeExpr({}, node);
      }

      setIsHovering(false);
      setIsSelected(clicked);
    }

    if (ReactGA) {
      ReactGA.event({
        category: 'User Selecting Relational Algebra Enclosure',
        action: Object.keys(props.expr)[0],
      });
    }
  };

  const handleExprHover = (e: SyntheticMouseEvent<HTMLElement>): void => {
    e.stopPropagation();
    setIsHovering(e.type === 'mouseover');
  };

  if (!props.expr || Object.keys(props.expr).length === 0) {
    return '';
  }
  const type = Object.keys(props.expr)[0];
  let className = 'RelExpr';
  if (isHovering) {
    className += ' hovering';
  }
  if (isSelected) {
    className += ' clicked';
  }
  if (type === 'relation') {
    return (
      <span className="RelExpr" style={{margin: '.4em'}}>
        {buildExpr(props.expr)}
      </span>
    );
  } else {
    return (
      <span
        className={className}
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
