import React from 'react';

import RelExprTree from './RelExprTree';

const RelExprTreeStories = {
  title: 'RelExprTree',
  component: RelExprTree,
};

export default RelExprTreeStories;

export const ComplexExpression = () => (
  <RelExprTree
    expr={{
      rename: {
        arguments: {rename: {firstName: 'name'}},
        children: [
          {
            projection: {
              arguments: {project: ['firstName', 'lastName']},
              children: [
                {
                  selection: {
                    arguments: {
                      select: {cmp: {lhs: 'salary', op: '$gt', rhs: 100000}},
                    },
                    children: [{relation: 'Doctor'}],
                  },
                },
              ],
            },
          },
        ],
      },
    }}
    changeExpr={(expr, element) => undefined}
  />
);
ComplexExpression.storyName = 'a complex expression';

export const SimpleJoin = () => (
  <RelExprTree
    expr={{join: {left: {relation: 'Doctor'}, right: {relation: 'Patient'}}}}
    changeExpr={(expr, element) => undefined}
  />
);
SimpleJoin.storyName = 'a simple join';

export const JustARelation = () => (
  <RelExprTree
    expr={{relation: 'Doctor'}}
    changeExpr={(expr, element) => undefined}
  />
);
JustARelation.storyName = 'just a relation';
