import Joyride, {CallBackProps, STATUS, StoreHelpers} from 'react-joyride';
import {connect} from 'react-redux';
import React, {Component} from 'react';

type Props = {
    state: {[string]: any},
    cookies: any,
}

type State = {
    steps?: any,
    run: boolean,
    helpers?: StoreHelpers,
    buttonText?: String,
}

/** Container for all components of the tutorial */
class Tutorial extends Component<State, Props> {
    constructor() {
        super();
        const { cookies } = this.props.cookies;
        console.log(cookies);
        if(cookies.get('tutorial') === undefined){
            this.state = {
                buttonText: "Tutorial",
                run: true,
                steps: [
                    {
                        content: <h2>Welcome to Relational Playground!</h2>,
                        locale: { skip: <strong aria-label="skip">S-K-I-P</strong> },
                        placement: 'center',
                        target: 'body',
                    },
                    {
                        content: <h2>Sticky elements</h2>,
                        floaterProps: {
                            disableAnimation: true,
                        },
                        spotlightPadding: 20,
                        target: '.SqlEditor',
                    },
                ]
            };
            cookies.set('tutorial', true, { path: '/' });
        }else{
            this.state = {
                buttonText: "Tutorial",
                run: false,
                steps: [
                    {
                        content: <h2>Welcome to Relational Playground!</h2>,
                        locale: { skip: <strong aria-label="skip">S-K-I-P</strong> },
                        placement: 'center',
                        target: 'body',
                    },
                    {
                        content: <h2>Sticky elements</h2>,
                        floaterProps: {
                            disableAnimation: true,
                        },
                        spotlightPadding: 20,
                        target: '.SqlEditor',
                    },
                ]
            };
        }



        (this: any).handleClickStart = this.handleClickStart.bind(this);
        (this: any).handleJoyrideCallback = this.handleJoyrideCallback.bind(this);
    }

    handleClickStart = (e: SyntheticMouseEvent<HTMLElement>) => {
        e.preventDefault();

        this.setState({
            run: true,
        });
    };

    handleJoyrideCallback = (data: CallBackProps) => {
        const { status, type } = data;
        const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            this.setState({ buttonText: "Re-do Tutorial", run: false });
        }

        // tslint:disable:no-console
        console.groupCollapsed(type);
        console.log(data);
        console.groupEnd();
        // tslint:enable:no-console
    };

    getHelpers = (helpers: StoreHelpers) => {
        this.helpers = helpers;
    };

    render(){

        return(
            <div>
                <Joyride
                    callback={this.handleJoyrideCallback}
                    continuous={true}
                    getHelpers={this.getHelpers}
                    scrollToFirstStep={true}
                    showProgress={true}
                    showSkipButton={true}
                    styles={{
                        options: {
                            zIndex: 10000,
                        },
                    }}
                    run={this.state.run}
                    steps={this.state.steps}
                />
                <button className="button" onClick={this.handleClickStart}>{this.state.buttonText}</button>
            </div>
        )
    };


}

const mapStateToProps = (state, ownProps) => {
    return({
        state: state,
        cookies: ownProps.cookies,
    });
};

export const TutorialContainer = connect(
    mapStateToProps,
    null
)(Tutorial);

export default TutorialContainer;