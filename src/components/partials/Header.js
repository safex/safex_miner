import React from "react";
const remote = window.require("electron").remote;

export default class Header extends React.Component {
  constructor(props) {
    super(props);
    this.miner = null;
  }

  render() {
    return (
      <header>
        <img src="images/logo.png" className="animated fadeIn" alt="Logo" />
        <p className="animated fadeIn">
          {remote.app.getVersion()}
        </p>
      </header>
    );
  }
}
