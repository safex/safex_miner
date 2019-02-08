import React from "react";

export default class ExitModal extends React.Component {
  render() {
    return (
      <div>
        <div
          className={`modal exitModal ${this.props.exitModal ? "active" : ""}`}
        >
          <span className="close" onClick={this.props.closeExitModal}>
            X
          </span>
          <h3>Are you sure you want to exit?</h3>
          <div className="btns-wrap">
            <button className="cancel-btn" onClick={this.props.closeExitModal}>
              Cancel
            </button>
            <button className="confirm-btn" onClick={this.props.closeApp}>
              Exit
            </button>
          </div>
        </div>

        <div
          className={`backdrop ${this.props.exitModal ? "active" : ""}`}
          onClick={this.props.closeExitModal}
        />
      </div>
    );
  }
}
