import React from "react";
import BalanceAlert from './BalanceAlert';

export default class CreateFromKeysModal extends React.Component {
    render() {
        return (
            <div>
                <div className={this.props.openCreateFromKeysModal
                    ? 'modal openCreateFromKeysModal active'
                    : 'modal openCreateFromKeysModal'}>
                    <div className="sendModalInner">
                        <span className="close" onClick={this.props.closeCreateFromKeysModal}>X</span>
                        <h3>Create New Wallet From Keys</h3>

                        <form onSubmit={this.props.createNewWalletFromKeys}>
                            <div className="form-wrap">
                                <div className="form-group">
                                    <label htmlFor="path">Wallet Path</label>
                                    <input name="path" value={this.props.walletPath} placeholder="Wallet Path" />

                                    <label htmlFor="address">Safex Address</label>
                                    <textarea name="address" placeholder="Address" rows="5">
                                    </textarea>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="spendkey">Safex Address Private Spendkey</label>
                                    <input name="spendkey" placeholder="Private Spendkey" />

                                    <label htmlFor="viewkey">Safex Address Private Viewkey</label>
                                    <input name="viewkey" placeholder="Private Viewkey" />

                                    <label htmlFor="pass1">Password</label>
                                    <input type="password" name="pass1" placeholder="Password" />

                                    <label htmlFor="pass1">Repeat Password</label>
                                    <input type="password" name="pass2" placeholder="Repeat Password" />
                                </div>
                            </div>

                            <button type="submit" className="button-shine new-wallet-btn">
                                Create New Wallet From Keys
                            </button>
                        </form>
                    </div>

                    <BalanceAlert
                        balanceAlert={this.props.balanceAlert}
                        balanceAlertText={this.props.balanceAlertText}
                        closeBalanceAlert={this.props.closeBalanceAlert}
                    />
                </div>

                <div className={this.props.openCreateFromKeysModal
                    ? 'backdrop active'
                    : 'backdrop'} onClick={this.props.closeCreateFromKeysModal}>
                </div>
            </div>
        );
    }
}