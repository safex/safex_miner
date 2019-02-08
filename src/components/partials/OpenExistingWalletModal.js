import React from "react";
import BalanceAlert from "./BalanceAlert";

export default class OpenExistingWalletModal extends React.Component {
  render() {
    return (
      <div>
        <div
          className={`modal openFromExistingModal ${
            this.props.openFromExistingModal ? "active" : ""
          }`}
        >
          <div className="sendModalInner">
            <span className="close" onClick={this.props.closeFromExistingModal}>
              X
            </span>
            <h3>Open Wallet File</h3>
            <button
              className="button-shine browse-btn"
              onClick={this.props.browseFile}
            >
              Browse File
            </button>
            <form onSubmit={this.props.openFromWalletFile}>
              <label htmlFor="path">Wallet File</label>
              <input
                name="filepath"
                value={this.props.filepath}
                placeholder="Wallet File"
                readOnly
              />

              <label htmlFor="path">Wallet Password</label>
              <input
                type="password"
                name="pass"
                placeholder="Wallet Password"
              />

              <button type="submit" className="button-shine new-wallet-btn">
                Open Wallet File
              </button>
            </form>
          </div>

          <BalanceAlert
            balanceAlert={this.props.balanceAlert}
            balanceAlertText={this.props.balanceAlertText}
            closeBalanceAlert={this.props.closeBalanceAlert}
          />
        </div>

        <div
          className={`backdrop ${
            this.props.openFromExistingModal ? "active" : "b"
          }`}
          onClick={this.props.closeFromExistingModal}
        />
      </div>
    );
  }
}
