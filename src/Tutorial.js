// @flow
import Joyride, {STATUS} from 'react-joyride';
import React, {useState} from 'react';
import {useCookies} from 'react-cookie';

import type {StatelessFunctionalComponent} from 'react';

type CallBackProps = {
  status: string,
};

const redoText = 'Redo tutorial';
const stepStyle = {tooltipContainer: {textAlign: 'left'}};

/** Container for all components of the tutorial */
const Tutorial: StatelessFunctionalComponent<{}> = (props) => {
  let initialText, shouldRun;
  const [cookies, setCookie] = useCookies(['tutorial']);
  if (cookies.tutorial === undefined) {
    initialText = 'Tutorial';
    shouldRun = true;
    setCookie('tutorial', 'true', {path: '/', sameSite: 'strict'});
  } else {
    initialText = redoText;
    shouldRun = false;
  }

  const [buttonText, setButtonText] = useState(initialText);
  const [runTutorial, setRunTutorial] = useState(shouldRun);

  const handleClickStart = (e: SyntheticMouseEvent<HTMLElement>) => {
    e.preventDefault();
    setRunTutorial(true);
  };

  const handleJoyrideCallback = (data: CallBackProps) => {
    const {status} = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setButtonText(redoText);
      setRunTutorial(false);
    }
  };

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
            The expression is generated from the SQL queries entered above. The
            expression will automatically be updated based on the query. You can
            select any subexpression to view the data the relation contains
            below.
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
            expression to see the final results of the query or any intermediate
            expression to see what relations result from each step.
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
        callback={handleJoyrideCallback}
        continuous
        scrollToFirstStep
        showProgress
        showSkipButton
        styles={{
          options: {
            zIndex: 10000,
          },
        }}
        run={runTutorial}
        steps={steps}
      />
      <button className="button" onClick={handleClickStart}>
        {buttonText}
      </button>
    </div>
  );
};

export default Tutorial;
