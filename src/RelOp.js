// @flow
import React, {useRef, useState} from 'react';

import './RelOp.css';

import type {Element, Node} from 'react';

type Props = {
  children: Node,
};

/** Base for all relational algebra operators */
function RelOp(props: Props) {
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
}

type UnaryProps = {
  operator: Element<any>,
  children: Node,
};

function UnaryRelOpInternal(props: UnaryProps) {
  return (
    <span>
      {props.operator}({props.children})
    </span>
  );
}

function UnaryRelOp(props: UnaryProps) {
  return (
    <RelOp>
      <UnaryRelOpInternal operator={props.operator} children={props.children} />
    </RelOp>
  );
}

/** Projection relational algebra operator */
function Projection(props: {project: Array<string>}) {
  return (
    <span>
      &pi;<sub>{props.project.join(',')}</sub>
    </span>
  );
}

/** Rename relational algebra operator */
function Rename(props: {rename: {[string]: string}}) {
  return (
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
}

/** Selection relational algebra operator */
function Selection(props: {select: string}) {
  return (
    <span>
      &sigma;<sub>{props.select}</sub>
    </span>
  );
}

type BinaryProps = {
  operator: Element<any>,
  left: Node,
  right: Node,
};

function BinaryRelOpInternal(props: BinaryProps) {
  return (
    <span>
      {props.left}
      {props.operator}
      {props.right}
    </span>
  );
}

function BinaryRelOp(props: BinaryProps) {
  return (
    <RelOp>
      <BinaryRelOpInternal
        left={props.left}
        operator={props.operator}
        right={props.right}
      />
    </RelOp>
  );
}

function Except() {
  return <span>&minus;</span>;
}

function Intersect() {
  return <span>&cap;</span>;
}

function Join() {
  return <span>&times;</span>;
}

function Union() {
  return <span>&cup;</span>;
}

export {
  RelOp as default,
  UnaryRelOp,
  Projection,
  Rename,
  Selection,
  BinaryRelOp,
  Except,
  Intersect,
  Join,
  Union,
};
