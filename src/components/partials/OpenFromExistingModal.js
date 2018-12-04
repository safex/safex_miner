import React from "react";

export default class OpenFromExistingModal extends React.Component {
    render() {
        return (
            <div>
                <div className={this.props.openFromExistingModal
                    ? 'modal openFromExistingModal active'
                    : 'modal openFromExistingModal'}>
                    <div className="sendModalInner">
                        <span className="close" onClick={this.props.closeFromExistingModal}>X</span>
                        <h3>Open From Existing Wallet File</h3>

                        <form onSubmit={this.props.openFromWalletFile}>
                            <label htmlFor="path">Wallet Path</label>
                            <input name="path" value={this.props.walletPath} placeholder="Wallet Path" />

                            <label htmlFor="path">Wallet Passwordd</label>
                            <input name="pass" placeholder="Wallet Password" />

                            <button type="submit" className="button-shine new-wallet-btn">
                                Open From Existing Wallet File
                        </button>
                        </form>
                    </div>
                </div>

                <div className={this.props.openFromExistingModal
                    ? 'backdrop active'
                    : 'backdrop'} onClick={this.props.closeFromExistingModal}>
                </div>
            </div>
        );
    }
}