import React from 'react';
import {Provider} from 'react-redux';
import {produce} from 'immer';
import {configureStore} from '@reduxjs/toolkit';

import RelExpr from './RelExpr';

const initialState = {data: {expr: null}};
const mockStore = configureStore({
  reducer: {
    data: produce((state, action) => state, initialState),
  },
  preloadedState: initialState,
});

const MockedStore = ({children}) => (
  <Provider store={mockStore}>{children}</Provider>
);

const RelExprStories = {
  title: 'RelExpr',
  component: RelExpr,
  decorators: [(story) => <MockedStore>{story()}</MockedStore>],
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
