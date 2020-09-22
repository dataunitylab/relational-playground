// @flow
import React, {useRef, useState} from 'react';

import './RelOp.css';

import type {Element, Node, StatelessFunctionalComponent} from 'react';

type Props = {
  children: Node,
};

/** Base for all relational algebra operators */
const RelOp: StatelessFunctionalComponent<Props> = (props) => {
  const [hoverClass, setHoverClass] = useState('');
  const elementRef = useRef(null);

  function handleHover(e: SyntheticMouseEvent<HTMLElement>) {
    const hovering = e.type === 'mouseover';
    e.stopPropagation();

    const node = elementRef.current;

    if (node) {
      let newClassName = node instanceof HTMLElement ? node.className : '';

      newClassName = newClassName.replace(' RelOp', '');
      newClassName = newClassName.replace(' hovering', '');
      newClassName += ' RelOp' + (hovering ? ' hovering' : '');

      setHoverClass(newClassName);
      if (node instanceof HTMLElement) node.className = newClassName;
    }
  }

  return (
    <span
      ref={elementRef}
      className={hoverClass}
      onMouseOver={handleHover}
      onMouseOut={handleHover}
    >
      {props.children}
    </span>
  );
};

export default RelOp;

type UnaryProps = {
  operator: Element<any>,
  children: Node,
};

const UnaryRelOpInternal: StatelessFunctionalComponent<UnaryProps> = (
  props
) => (
  <span>
    {props.operator}({props.children})
  </span>
);

export const UnaryRelOp: StatelessFunctionalComponent<UnaryProps> = (props) => (
  <RelOp>
    <UnaryRelOpInternal operator={props.operator} children={props.children} />
  </RelOp>
);

/** Projection relational algebra operator */
export const Projection: StatelessFunctionalComponent<{
  project: Array<string>,
}> = (props) => (
  <span>
    &pi;<sub>{props.project.join(',')}</sub>
  </span>
);

/** Rename relational algebra operator */
export const Rename: StatelessFunctionalComponent<{
  rename: {[string]: string},
}> = (props) => (
  <span>
    &rho;
    <sub>
      {/* Loop over all columns to rename and combine them */}
      {Object.entries(props.rename)
        .map(([o, n]) => {
          return o + '/' + ((n: any): string);
        })
        .join(',')}
    </sub>
  </span>
);

/** Selection relational algebra operator */
export const Selection: StatelessFunctionalComponent<{select: string}> = (
  props
) => (
  <span>
    &sigma;<sub>{props.select}</sub>
  </span>
);

type BinaryProps = {
  operator: Element<any>,
  left: Node,
  right: Node,
};

const BinaryRelOpInternal: StatelessFunctionalComponent<BinaryProps> = (
  props
) => (
  <span>
    {props.left}
    {props.operator}
    {props.right}
  </span>
);

export const BinaryRelOp: StatelessFunctionalComponent<BinaryProps> = (
  props
) => (
  <RelOp>
    <BinaryRelOpInternal
      left={props.left}
      operator={props.operator}
      right={props.right}
    />
  </RelOp>
);

export const Except: StatelessFunctionalComponent<{||}> = () => (
  <span>&minus;</span>
);

export const Intersect: StatelessFunctionalComponent<{||}> = () => (
  <span>&cap;</span>
);

export const Join: StatelessFunctionalComponent<{||}> = () => (
  <span>&times;</span>
);

export const Union: StatelessFunctionalComponent<{||}> = () => (
  <span>&cup;</span>
);
