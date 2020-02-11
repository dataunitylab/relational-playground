import Joyride, {CallBackProps, STATUS, StoreHelpers} from 'react-joyride';
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
    constructor(props: Props) {
        super(props);
        const cookies = this.props.cookies;

        if(cookies.get('tutorial') === undefined){
            this.state = {
                buttonText: "Tutorial",
                run: true,
                steps: [
                    {
                        content: <h2>Welcome to Relational Playground!</h2>,
                        locale: { skip: <strong aria-label="skip">Skip Tutorial</strong> },
                        placement: 'center',
                        target: 'body',
                    },
                    {
                        content: <div><h2>Enter SQL queries here:</h2><p>Example: Select firstName from Patient</p></div>,
                        spotlightPadding: 4,
                        target: '.SqlEditor',
                    },
                    {
                        content: <h4>Relational Algebra expression displayed here</h4>,
                        spotlightPadding: 4,
                        target: '.relExprContainer',
                    },
                    {
                        content: <h4>Source tables for SQL queries are displayed here</h4>,
                        spotlightPadding: 4,
                        target: '.sourceTableContainer',
                    },
                    {
                        content: <h4>Resulting tables for selected relation displayed here</h4>,
                        spotlightPadding: 4,
                        target: '.dataContainer',
                    },
                ]
            };
            cookies.set('tutorial', 'true', { path: '/' });
        }else{
            this.state = {
                buttonText: "Re-do Tutorial",
                run: false,
                steps: [
                    {
                        content: <h2>Welcome to Relational Playground!</h2>,
                        locale: { skip: <strong aria-label="skip">Skip Tutorial</strong> },
                        placement: 'center',
                        target: 'body',
                    },
                    {
                        content: <div><h2>Enter SQL queries here:</h2><p>Example: Select firstName from Patient</p></div>,
                        spotlightPadding: 4,
                        target: '.SqlEditor',
                    },
                    {
                        content: <h4>Relational Algebra expression displayed here</h4>,
                        spotlightPadding: 4,
                        target: '.relExprContainer',
                    },
                    {
                        content: <h4>Source tables for SQL queries are displayed here</h4>,
                        spotlightPadding: 4,
                        target: '.sourceTableContainer',
                    },
                    {
                        content: <h4>Resulting tables for selected relation displayed here</h4>,
                        spotlightPadding: 4,
                        target: '.dataContainer',
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
        const { status } = data;
        const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            this.setState({ buttonText: "Re-do Tutorial", run: false });
        }
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

export default Tutorial;