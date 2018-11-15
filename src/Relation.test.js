import React from 'react';
import { render, fireEvent } from 'react-testing-library';
import 'jest-dom/extend-expect';

import Relation from './Relation';

it('renders a simple label', () => {
  const { container, getByTestId } = render(<Relation name="Test"/>);
  expect(container).toHaveTextContent('Test');

  const inner = getByTestId('span');
  expect(inner).toHaveClass('Relation');
});
