// @flow
import React, {Component} from 'react';
// $FlowFixMe
import Select from 'react-select';
import Table from './Table';
import {BrowserView, MobileView, isMobile} from 'react-device-detect';

import './MultiTable.css';

import type {Data} from './modules/data';

type Props = {
  tables: {[string]: Data},
  ReactGA: any,
  testIsMobile?: boolean,
};

type State = {
  showTableMobile: boolean,
  selected: string,
  isMobile: boolean,
  buttonText: string,
};

const tableHiddenText = 'Show Table';
const tableShownText = 'Hide Table';

/** Displays more than one table with a dropdown to choose */
class MultiTable extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isMobile: isMobile,
      showTableMobile: false,
      buttonText: tableHiddenText,
      selected: Object.keys(this.props.tables)[0],
    };
    (this: any).handleButtonPress = this.handleButtonPress.bind(this);
  }

  // TODO: Fix type annotation below
  handleChange = (table: any) => {
    this.setState({selected: table.value});
    this.props.ReactGA.event({
      category: 'User Selecting A Table',
      action: table.value,
    });
  };

  handleButtonPress() {
    this.setState({
      showTableMobile: !this.state.showTableMobile,
      buttonText:
        this.state.buttonText === tableShownText
          ? tableHiddenText
          : tableShownText,
    });
  }

  render() {
    // Render the selected table
    let table = <div>Select a table above.</div>;
    if (this.state.isMobile) {
      if (this.state.showTableMobile) {
        const data = this.props.tables[this.state.selected];
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
            <MobileView>
              <h4>Source relations</h4>

              <Select
                className="mobileSelect"
                value={{value: this.state.selected, label: this.state.selected}}
                onChange={this.handleChange}
                options={Object.keys(this.props.tables).map(tbl => {
                  return {value: tbl, label: tbl};
                })}
              />

              <div className="tableDiv">
                {table}
                <button className="mobileButton" onClick={this.handleButtonPress}>
                  {this.state.buttonText}
                </button>
              </div>
            </MobileView>
          </div>
      );
    } else if (this.state.selected) {
      const data = this.props.tables[this.state.selected];
      table = (
        <Table
          className="browserTable"
          columns={data.columns}
          data={data.data}
        />
      );
    }

    // Render the menu along with the table
    return (
        <div className="sourceTableContainer">
          <BrowserView>
            <h4>Source relations</h4>

            <Select
              className="browserSelect"
              value={{value: this.state.selected, label: this.state.selected}}
              onChange={this.handleChange}
              options={Object.keys(this.props.tables).map(tbl => {
                return {value: tbl, label: tbl};
              })}
            />

            {table}
          </BrowserView>
        </div>
    );
  }
}

export default MultiTable;
