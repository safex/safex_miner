import React from "react";
const remote = window.require("electron").remote;

export default class Header extends React.Component {
  constructor(props) {
    super(props);
    this.miner = null;
    this.state = {};
  }

  minimizeApp = () => {
    let window = remote.getCurrentWindow();
    window.minimize();
  };

  maximizeApp = () => {
    let window = remote.getCurrentWindow();

    if (window.isMaximized()) {
      window.unmaximize();
    } else {
      window.maximize();
    }
  };

  render() {
    return (
      <header>
        <img src="images/logo.png" className="animated fadeIn" alt="Logo" />
        <div className="win-buttons-wrap">
          <button
            className="minimize animated fadeIn"
            title="Minimize"
            onClick={this.minimizeApp}
          />
          <button
            className="maximize animated fadeIn"
            title="Maximize"
            onClick={this.maximizeApp}
          />
          <button
            className="close animated fadeIn"
            title="Close App"
            onClick={this.props.closeApp}
          >
            X
          </button>
        </div>
        <p className="animated fadeIn">{remote.app.getVersion()}</p>
      </header>
    );
  }
}
