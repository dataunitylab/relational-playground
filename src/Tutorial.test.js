import React from 'react';
import Tutorial from './Tutorial';
import Cookies from 'universal-cookie/cjs';
import {shallow} from 'enzyme';
import JoyrideTooltipContainer from 'react-joyride';

/** @test {Tutorial} */
it('correctly renders tutorial given no cookie', () => {
  const wrapper = shallow(<Tutorial />);
  let tooltip = wrapper.find(JoyrideTooltipContainer);

  // expect(tooltip).toBeDefined();
  expect(tooltip).toMatchSnapshot();
});

/** @test {Tutorial} */
it('cookie exists, no tutorial', () => {
  let cookies = new Cookies();
  cookies.set('tutorial', 'true', {path: '/'});

  const wrapper = shallow(<Tutorial />);
  let button = wrapper.find('.button').text();

  expect(button).toContain('Redo tutorial');
});
