import React from 'react';

import RelExprTree from './RelExprTree';
import {SUPPORTED_AGGREGATE_FUNCTIONS} from './modules/relexp';

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

export const GroupByWithAggregates = ({aggregateFunction}) => (
  <RelExprTree
    expr={{
      group_by: {
        arguments: {
          groupBy: ['departmentId'],
          aggregates: [
            {
              aggregate: {
                function: aggregateFunction,
                column: 'salary',
              },
            },
          ],
          selectColumns: ['departmentId'],
        },
        children: [{relation: 'Doctor'}],
      },
    }}
    changeExpr={(expr, element) => undefined}
  />
);
GroupByWithAggregates.storyName = 'GROUP BY with aggregates';
GroupByWithAggregates.args = {
  aggregateFunction: 'AVG',
};
GroupByWithAggregates.argTypes = {
  aggregateFunction: {
    options: SUPPORTED_AGGREGATE_FUNCTIONS,
    control: {type: 'inline-radio'},
  },
};

export const GroupByMultipleAggregates = () => (
  <RelExprTree
    expr={{
      group_by: {
        arguments: {
          groupBy: ['departmentId'],
          aggregates: [
            {
              aggregate: {
                function: 'COUNT',
                column: 'salary',
              },
            },
            {
              aggregate: {
                function: 'AVG',
                column: 'salary',
              },
            },
            {
              aggregate: {
                function: 'STDEV',
                column: 'salary',
              },
            },
          ],
          selectColumns: ['departmentId'],
        },
        children: [{relation: 'Doctor'}],
      },
    }}
    changeExpr={(expr, element) => undefined}
  />
);
GroupByMultipleAggregates.storyName = 'GROUP BY with multiple aggregates';

export const GroupByWithHaving = ({aggregateFunction, threshold}) => (
  <RelExprTree
    expr={{
      selection: {
        arguments: {
          condition: {
            cmp: {
              lhs: `${aggregateFunction}(salary)`,
              op: '$gt',
              rhs: threshold.toString(),
            },
          },
        },
        children: [
          {
            group_by: {
              arguments: {
                groupBy: ['departmentId'],
                aggregates: [
                  {
                    aggregate: {
                      function: aggregateFunction,
                      column: 'salary',
                    },
                  },
                ],
                selectColumns: ['departmentId'],
              },
              children: [{relation: 'Doctor'}],
            },
          },
        ],
      },
    }}
    changeExpr={(expr, element) => undefined}
  />
);
GroupByWithHaving.storyName = 'GROUP BY with HAVING clause';
GroupByWithHaving.args = {
  aggregateFunction: 'AVG',
  threshold: 50000,
};
GroupByWithHaving.argTypes = {
  aggregateFunction: {
    options: SUPPORTED_AGGREGATE_FUNCTIONS,
    control: {type: 'inline-radio'},
  },
  threshold: {
    control: {type: 'number', min: 0, max: 200000, step: 5000},
  },
};

export const GroupByWithComplexHaving = () => (
  <RelExprTree
    expr={{
      selection: {
        arguments: {
          condition: {
            and: {
              clauses: [
                {
                  cmp: {
                    lhs: 'COUNT(*)',
                    op: '$gt',
                    rhs: '1',
                  },
                },
                {
                  cmp: {
                    lhs: 'AVG(salary)',
                    op: '$gt',
                    rhs: '80000',
                  },
                },
              ],
            },
          },
        },
        children: [
          {
            group_by: {
              arguments: {
                groupBy: ['departmentId'],
                aggregates: [
                  {
                    aggregate: {
                      function: 'COUNT',
                      column: '*',
                    },
                  },
                  {
                    aggregate: {
                      function: 'AVG',
                      column: 'salary',
                    },
                  },
                ],
                selectColumns: ['departmentId'],
              },
              children: [{relation: 'Doctor'}],
            },
          },
        ],
      },
    }}
    changeExpr={(expr, element) => undefined}
  />
);
GroupByWithComplexHaving.storyName =
  'GROUP BY with complex HAVING (COUNT and AVG)';
