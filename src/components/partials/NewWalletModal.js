import React from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
const fileDownload = window.require('js-file-download');
const sa = window.require("safex-addressjs");

export default class NewWalletModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            new_wallet: "",
            new_wallet_generated: false,
            spendkey_sec: "",
            viewkey_sec: "",
            exported: false,
        };

        this.newWallet = this.newWallet.bind(this);
        this.exportWallet = this.exportWallet.bind(this);
    }

    newWallet() {
        const seed = sa.sc_reduce32(sa.rand_32());
        const keys = sa.create_address(seed);
        const pubkey = sa.pubkeys_to_string(keys.spend.pub, keys.view.pub);

        localStorage.setItem("wallet", JSON.stringify(keys));
        this.setState({
            exported: false,
            new_wallet_generated: true,
            new_wallet: pubkey,
            spendkey_sec: keys.spend.sec,
            viewkey_sec: keys.view.sec
        });
    }

    exportWallet() {
        var wallet_data = JSON.parse(localStorage.getItem('wallet'));
        var keys = "";

        keys += "Public address: " + wallet_data.public_addr + '\n';
        keys += "Spendkey " + '\n';
        keys += "pub: " + wallet_data.spend.pub + '\n';
        keys += "sec: " + wallet_data.spend.sec + '\n';
        keys += "Viewkey " + '\n';
        keys += "pub: " + wallet_data.view.pub + '\n';
        keys += "sec: " + wallet_data.view.sec + '\n';
        var date = Date.now();

        fileDownload(keys, date + 'unsafex.txt');

        this.setState(() => ({
            exported: true
        }));
    }

    render() {
        return (
            <div>
                <div className={this.props.newWalletModal ? "modal newWalletModal active" : "modal newWalletModal"}>
                    <span className="close" onClick={this.props.closeNewWalletModal}>
                        X
                    </span>
                    <button
                        id="new-wallet"
                        className="button-shine"
                        onClick={this.newWallet}
                    >
                        Generate new wallet
                    </button>

                    <div className="form-group">
                        <label htmlFor="new-address">Your new wallet address:</label>
                        <textarea
                            placeholder="New Wallet Address"
                            value={this.state.new_wallet}
                            rows="2"
                            onChange={({ target: { value } }) =>
                                this.setState({ value, copied: false })
                            }
                            readOnly
                        />
                        <div
                            className={
                                this.state.new_wallet_generated
                                    ? "spendview active"
                                    : "spendview"
                            }
                        >
                            {this.state.copied ? (
                                <CopyToClipboard
                                    text={this.state.new_wallet}
                                    onCopy={() => this.setState({ copied: true })}
                                    className="button-shine copy-btn"
                                    disabled={this.state.new_wallet === "" ? "disabled" : ""}
                                >
                                    <button>Copied Address</button>
                                </CopyToClipboard>
                            ) : (
                                    <CopyToClipboard
                                        text={this.state.new_wallet}
                                        onCopy={() => this.setState({ copied: true })}
                                        className="button-shine copy-btn"
                                        disabled={this.state.new_wallet === "" ? "disabled" : ""}
                                    >
                                        <button>Copy Address</button>
                                    </CopyToClipboard>
                                )}

                            {this.state.exported ? (
                                <h5 className="warning green">
                                    Wallet keys have been successfuly saved. Please do not share
                                    your keys with others and keep them safe at all times. Good
                                    luck!
                                </h5>
                            ) : (
                                <h5 className="warning red">
                                    The following keys are to control your coins, do not share
                                    them. Keep your keys for yourself only! Before you proceed to
                                    mine please save your keys now.
                                </h5>
                            )}

                            <label htmlFor="sec-spendkey">Secret Spenkey</label>
                            <input type="text" name="sec-spendkey" value={this.state.spendkey_sec} />
                            
                            <label htmlFor="sec-spendkey">Secret Viewkey</label>
                            <input type="text" name="sec-spendkey" value={this.state.viewkey_sec} />

                            <button className={this.state.exported ? "save-btn green" : "save-btn"} onClick={this.exportWallet}>
                                <span> {this.state.exported ? "Wallet Keys Saved" : "Save Wallet Keys"}</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className={this.props.newWalletModal
                    ? 'backdrop active'
                    : 'backdrop'} onClick={this.props.closeNewWalletModal}>
                </div>
            </div>
        );
    }
}