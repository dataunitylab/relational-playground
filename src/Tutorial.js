import Joyride, {CallBackProps, STATUS, StoreHelpers} from 'react-joyride';
import React, {Component} from 'react';

type Props = {
  state: {[string]: any},
  cookies: any,
};

type State = {
  run: boolean,
  helpers?: StoreHelpers,
  buttonText?: String,
};

const redoText = 'Redo tutorial';
const stepStyle = {tooltipContainer: {textAlign: 'left'}};

/** Container for all components of the tutorial */
class Tutorial extends Component<State, Props> {
  constructor(props: Props) {
    super(props);
    const cookies = this.props.cookies;
    if (cookies.get('tutorial') === undefined) {
      this.state = {
        buttonText: 'Tutorial',
        run: true,
      };
      cookies.set('tutorial', 'true', {path: '/'});
    } else {
      this.state = {
        buttonText: redoText,
        run: false,
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
    const {status} = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      this.setState({buttonText: redoText, run: false});
    }
  };

  getHelpers = (helpers: StoreHelpers) => {
    this.helpers = helpers;
  };

  render() {
    const steps = [
      {
        content: <h2>Welcome to Relational Playground!</h2>,
        locale: {skip: <strong aria-label="skip">Skip tutorial</strong>},
        placement: 'center',
        target: 'body',
      },
      {
        content: (
          <div>
            <h2>Enter SQL queries here</h2>
            <p>
              Note that not all SQL queries are supported (e.g. aggregation,
              arithmetic, and function calls).
            </p>
          </div>
        ),
        spotlightPadding: 4,
        target: '.SqlEditor',
        styles: stepStyle,
      },
      {
        content: (
          <div>
            <h4>Source relations are displayed here</h4>,
            <p>Any of these relations can be used in your SQL queries.</p>
          </div>
        ),
        spotlightPadding: 4,
        target: '.sourceTableContainer',
        styles: stepStyle,
      },
      {
        content: (
          <div>
            <h4>Relational algebra expressions</h4>
            <p>
              The expression is generated from the SQL queries entered above.
              The expression will automatically be updated based on the query.
              You can select any subexpression to view the data the relation
              contains below.
            </p>
          </div>
        ),
        spotlightPadding: 4,
        target: '.relExprContainer',
        styles: stepStyle,
      },
      {
        content: (
          <div>
            <h4>Relation algebra expressions data</h4>
            <p>
              When you select an expression above, the data contained in that
              expression will be displayed here. You can select the top-level
              expression to see the final results of the query or any
              intermediate expression to see what relations result from each
              step.
            </p>
          </div>
        ),
        spotlightPadding: 4,
        target: '.dataContainer',
        styles: stepStyle,
      },
      {
        content: (
          <div>
            <h4>Tree view</h4>
            <p>
              Toggling this checkbox will enable a tree view for relational
              algebra expressions. You can switch back to a linear view by
              unchecking the box.
            </p>
          </div>
        ),
        spotlightPadding: 4,
        target: '.relExprContainer .toggle',
        styles: stepStyle,
      },
    ];

    return (
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
          steps={steps}
        />
        <button className="button" onClick={this.handleClickStart}>
          {this.state.buttonText}
        </button>
      </div>
    );
  }
}

export default Tutorial;
