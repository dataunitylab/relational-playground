// @flow
import React, {useRef} from 'react';
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

import type {Node, StatelessFunctionalComponent} from 'react';

type Props = {
  changeExpr: typeof changeExpr,
  expr: {[string]: any},
  ReactGA: any,
};

/** A graphical representation of a relational algebra expression */
const RelExpr: StatelessFunctionalComponent<Props> = (props) => {
  const nodeRef = useRef();

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

    if (node instanceof HTMLElement && props.changeExpr) {
      props.changeExpr(props.expr, node);
    }

    props.ReactGA.event({
      category: 'User Selecting Relational Algebra Enclosure',
      action: Object.keys(props.expr)[0],
    });
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
