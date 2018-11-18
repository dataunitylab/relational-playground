import React from 'react';
import renderer from 'react-test-renderer';

import RelExpr from './RelExpr';

it('correctly renders a complex expression', () => {
  const expr = {
    rename: {
      arguments: {rename: {firstName: 'name'}},
      children: [
        {
          projection: {
            arguments: {project: ['firstName', 'lastName']},
            children: [
              {
                selection: {
                  arguments: {select: [{salary: {$gt: 130000}}]},
                  children: [{relation: 'Doctor'}],
                },
              },
            ],
          },
        },
      ],
    },
  };
  const tree = renderer.create(<RelExpr expr={expr} />).toJSON();
  expect(tree).toMatchSnapshot();
});
