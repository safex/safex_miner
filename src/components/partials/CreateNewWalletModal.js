import React from "react";
import BalanceAlert from "./BalanceAlert";

export default class CreateNewWalletModal extends React.Component {
  render() {
    return (
      <div>
        <div
          className={`modal createNewWalletModal ${
            this.props.createNewWalletModal ? "active" : ""
          }`}
        >
          <div className="sendModalInner">
            <span className="close" onClick={this.props.closeNewWalletModal}>
              X
            </span>
            <h3>Create New Wallet File</h3>

            <form onSubmit={this.props.createNewWallet}>
              <label htmlFor="pass1">Enter New Password</label>
              <input type="password" name="pass1" placeholder="New Password" />

              <label htmlFor="pass1">Repeat Password</label>
              <input
                type="password"
                name="pass2"
                placeholder="Repeat Password"
              />

              <button type="submit" className="button-shine new-wallet-btn">
                Create New Wallet
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
            this.props.createNewWalletModal ? "active" : ""
          }`}
          onClick={this.props.closeNewWalletModal}
        />
      </div>
    );
  }
}
