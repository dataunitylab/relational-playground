// @flow
import React, {useState} from 'react';
// $FlowFixMe
import Table from './Table';
import {BrowserView, MobileOnlyView, isMobileOnly} from 'react-device-detect';

import './MultiTable.css';

import type {Data} from './modules/data';

type Props = {
  tables: {[string]: Data},
  ReactGA: any,
  testIsMobile?: boolean,
};

const tableHiddenText = 'Show Table';
const tableShownText = 'Hide Table';

/** Displays more than one table with a dropdown to choose */
function MultiTable(props: Props) {
  const [showTableMobile, setShowTableMobile] = useState(false);
  const [selected, setSelected] = useState(Object.keys(props.tables)[0]);
  const [isMobile] = useState(isMobileOnly);
  const [buttonText, setButtonText] = useState(tableHiddenText);

  // TODO: Fix type annotation below
  const handleChange = (e: any) => {
    if (e.target !== undefined) {
      setSelected(e.target.value);
      props.ReactGA.event({
        category: 'User Selecting A Table',
        action: e.target.value,
      });
    }
  };

  function handleButtonPress() {
    setShowTableMobile(!showTableMobile);
    setButtonText(
      buttonText === tableShownText ? tableHiddenText : tableShownText
    );
  }

  // Render the selected table
  let table = <div>Select a table above.</div>;
  if (isMobile) {
    if (showTableMobile) {
      const data = props.tables[selected];
      table = (
        <Table
          className="mobileTable"
          columns={data.columns}
          data={data.data}
        />
      );
    } else {
      table = <div>Select a table above.</div>;
    }

    return (
      <div className="sourceTableContainer">
        <MobileOnlyView>
          <h4>Source relations</h4>
          <select className="mobileSelect" onChange={handleChange}>
            {Object.keys(props.tables).map((tbl) => {
              return (
                <option
                  key={Object.keys(props.tables).indexOf(tbl)}
                  value={tbl}
                >
                  {' '}
                  {tbl}
                </option>
              );
            })}
          </select>

          <div className="tableDiv">
            {table}
            <button className="mobileButton" onClick={handleButtonPress}>
              {buttonText}
            </button>
          </div>
        </MobileOnlyView>
      </div>
    );
  } else if (selected) {
    const data = props.tables[selected];
    table = (
      <Table className="browserTable" columns={data.columns} data={data.data} />
    );
  }

  // Render the menu along with the table
  return (
    <div className="sourceTableContainer">
      <BrowserView>
        <h4>Source relations</h4>

        <select className="browserSelect" onChange={handleChange}>
          {Object.keys(props.tables).map((tbl) => {
            return (
              <option key={Object.keys(props.tables).indexOf(tbl)} value={tbl}>
                {tbl}
              </option>
            );
          })}
        </select>

        {table}
      </BrowserView>
    </div>
  );
}

export default MultiTable;
