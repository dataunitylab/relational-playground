import React from 'react';

import RelExpr from './RelExpr';

const RelExprStories = {
  title: 'RelExpr',
  component: RelExpr,
};

export default RelExprStories;

export const ComplexExpression = () => (
  <RelExpr
    expr={{
      rename: {
        arguments: {rename: {columns: {firstName: 'name'}}},
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
