import React from 'react';
import ReactDOM from 'react-dom';
import Tutorial from "./Tutorial";
import Cookies from "universal-cookie/cjs";
import {mount} from 'enzyme';
import renderer from 'react-test-renderer';
import JoyrideTooltipContainer from 'react-joyride';


/** @test {App} */
it('correctly renders tutorial', () => {
    const div = document.createElement('div');

    let cookies = new Cookies();

    ReactDOM.render(
        <Tutorial state={{run:false}} cookies={cookies}/>,
        div
    );

    const tree = renderer.create(<Tutorial state={{run:false}} cookies={cookies}/>).toJSON();
    expect(tree).toMatchSnapshot();
});

/** @test {Tutorial} */
it('correctly renders tutorial given no cookie', () => {
    let cookies = new Cookies();
    const wrapper = mount(
        <Tutorial state={{run:false}} cookies={cookies}/>
    );

    wrapper.setState({run: true});

    let tooltip = wrapper.find(JoyrideTooltipContainer);

    expect(tooltip).toBeDefined();
});

/** @test {Tutorial given cookie} */
it('cookie exists, no tutorial', () => {
    let cookies = new Cookies();
    cookies.set('tutorial', 'true', {path: '/'});

    const wrapper = mount(
        <Tutorial state={{run:false}} cookies={cookies}/>
    );

    wrapper.setState({run: true});

    let tooltip = wrapper.find(JoyrideTooltipContainer);

    expect(tooltip).toBeEmpty();
});

