import React from "react";
import BalanceAlert from './BalanceAlert';

export default class OpenExistingWalletModal extends React.Component {
    render() {
        return (
            <div>
                <div className={this.props.openFromExistingModal
                    ? 'modal openFromExistingModal active'
                    : 'modal openFromExistingModal'}>
                    <div className="sendModalInner">
                        <span className="close" onClick={this.props.closeFromExistingModal}>X</span>
                        <h3>Open Wallet File</h3>

                        <form onSubmit={this.props.openFromWalletFile}>
                            <label htmlFor="path">Wallet Password</label>
                            <input type="password" name="pass" placeholder="Wallet Password" />

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

                <div className={this.props.openFromExistingModal
                    ? 'backdrop active'
                    : 'backdrop'} onClick={this.props.closeFromExistingModal}>
                </div>
            </div>
        );
    }
}