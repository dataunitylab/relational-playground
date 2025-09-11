import React from 'react';
import Tutorial from './Tutorial';
import Cookies from 'universal-cookie/cjs';
import {render, act, waitFor} from '@testing-library/react';
import Joyride from 'react-joyride';
import {CookiesProvider} from 'react-cookie';

// Mock Joyride to capture props passed to it
jest.mock('react-joyride', () => {
  return jest.fn(() => <div data-testid="mocked-joyride" />);
});

/** @test {Tutorial} */
it('correctly renders tutorial given no cookie', async () => {
  let result;

  await act(async () => {
    result = render(
      <CookiesProvider defaultSetOptions={{path: '/'}}>
        <Tutorial />
      </CookiesProvider>
    );
  });

  // Wait for any async state updates to complete
  await waitFor(() => {
    expect(result.container.firstChild).toBeInTheDocument();
  });

  // Test that Joyride is rendered with correct props
  expect(Joyride).toHaveBeenCalledWith(
    expect.objectContaining({
      continuous: true,
      scrollToFirstStep: true,
      showProgress: true,
      showSkipButton: true,
      run: true,
      steps: expect.arrayContaining([
        expect.objectContaining({
          content: expect.any(Object),
          placement: 'center',
          target: 'body',
        }),
        expect.objectContaining({
          content: expect.any(Object),
          target: '.SqlEditor',
          spotlightPadding: 4,
        }),
        expect.objectContaining({
          content: expect.any(Object),
          target: '.sourceTableContainer',
          spotlightPadding: 4,
        }),
        expect.objectContaining({
          content: expect.any(Object),
          target: '.relExprContainer',
          spotlightPadding: 4,
        }),
        expect.objectContaining({
          content: expect.any(Object),
          target: '.dataContainer',
          spotlightPadding: 4,
        }),
        expect.objectContaining({
          content: expect.any(Object),
          target: '.relExprContainer .toggle',
          spotlightPadding: 4,
        }),
      ]),
      styles: expect.objectContaining({
        options: expect.objectContaining({
          zIndex: 10000,
        }),
      }),
      callback: expect.any(Function),
    }),
    {}
  );

  // Snapshot the steps content for detailed verification
  const joyrideCall = Joyride.mock.calls[0][0];
  expect(joyrideCall.steps).toMatchSnapshot('joyride-steps');

  // Test snapshot of rendered DOM structure
  expect(result.container.firstChild).toMatchSnapshot('dom-structure');
});

/** @test {Tutorial} */
it('cookie exists, no tutorial', async () => {
  let cookies = new Cookies();
  cookies.set('tutorial', 'true', {path: '/'});

  // Clear previous mock calls
  Joyride.mockClear();

  let container;

  const rendered = render(
    <CookiesProvider defaultSetOptions={{path: '/'}}>
      <Tutorial />
    </CookiesProvider>
  );
  container = rendered.container;

  await waitFor(() => {
    expect(container).toHaveTextContent('Redo tutorial');
  });

  // Verify Joyride is called with run=false when cookie exists
  expect(Joyride).toHaveBeenCalledWith(
    expect.objectContaining({
      run: false,
    }),
    {}
  );
});
