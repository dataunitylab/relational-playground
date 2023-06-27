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

export const SimpleJoin = ({joinType}) => (
  <RelExprTree
    expr={{
      join: {
        type: joinType,
        left: {relation: 'Doctor'},
        right: {relation: 'Patient'},
        condition: {
          cmp: {lhs: 'Doctor.id', op: '$eq', rhs: 'Patient.primaryDoctor'},
        },
      },
    }}
    changeExpr={(expr, element) => undefined}
  />
);
SimpleJoin.storyName = 'a simple join';
SimpleJoin.args = {
  joinType: 'left',
};
SimpleJoin.argTypes = {
  joinType: {
    options: ['left', 'right', 'inner'],
    control: {type: 'inline-radio'},
  },
};

export const JustARelation = () => (
  <RelExprTree
    expr={{relation: 'Doctor'}}
    changeExpr={(expr, element) => undefined}
  />
);
JustARelation.storyName = 'just a relation';
