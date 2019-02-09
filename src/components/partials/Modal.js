import React from "react";
import { addClass } from "../../utils/utils";
import { CopyToClipboard } from "react-copy-to-clipboard";
const fileDownload = window.require("js-file-download");
const sa = window.require("safex-addressjs");

export default class Modal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            new_wallet: "",
            new_wallet_generated: false,
            spendkey_sec: "",
            viewkey_sec: "",
            exported: false
        };

        this.newWallet = this.newWallet.bind(this);
        this.exportWallet = this.exportWallet.bind(this);
    }

    newWallet() {
        const seed = sa.sc_reduce32(sa.rand_32());
        const keys = sa.create_address(seed);
        const pubkey = sa.pubkeys_to_string(keys.spend.pub, keys.view.pub);

        localStorage.setItem("wallet", JSON.stringify(keys));
        this.exportWallet();
        this.setState({
            exported: true,
            new_wallet_generated: true,
            new_wallet: pubkey,
            spendkey_sec: keys.spend.sec,
            viewkey_sec: keys.view.sec
        });
    }

    exportWallet() {
        var wallet_data = JSON.parse(localStorage.getItem("wallet"));
        var keys = "";

        keys += "Public address: " + wallet_data.public_addr + "\n";
        keys += "Spendkey " + "\n";
        keys += "pub: " + wallet_data.spend.pub + "\n";
        keys += "sec: " + wallet_data.spend.sec + "\n";
        keys += "Viewkey " + "\n";
        keys += "pub: " + wallet_data.view.pub + "\n";
        keys += "sec: " + wallet_data.view.sec + "\n";
        var date = Date.now();

        fileDownload(keys, date + "unsafex.txt");
    }

    render() {
        let modal;

        if (this.props.newWalletModal) {
            modal = (
                <div
                    className={`newWalletModal ${
                        this.props.newWalletModal ? "active" : ""
                        }`}
                >
                    <span className="close" onClick={this.props.closeModal}>
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
                            <input
                                type="text"
                                name="sec-spendkey"
                                value={this.state.spendkey_sec}
                            />
                            <label htmlFor="sec-spendkey">Secret Viewkey</label>
                            <input
                                type="text"
                                name="sec-spendkey"
                                value={this.state.viewkey_sec}
                            />
                            <button
                                className={this.state.exported ? "save-btn green" : "save-btn"}
                                onClick={this.exportWallet}
                            >
                                <span>
                                    {" "}
                                    {this.state.exported
                                        ? "Wallet Keys Saved"
                                        : "Save Wallet Keys"}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            );
        }
        if (this.props.createNewWalletModal) {
            modal = (
                <div
                    className={`createNewWalletModal ${
                        this.props.createNewWalletModal ? "active" : ""
                        }`}
                >
                    <div className="sendModalInner">
                        <span
                            className="close"
                            onClick={this.props.closeModal}
                        >
                            X
                        </span>
                        <h3>Create New Wallet File</h3>

                        <form onSubmit={this.props.createNewWallet}>
                            <label htmlFor="pass1">Enter New Password</label>
                            <input
                                type="password"
                                name="pass1"
                                placeholder="New Password"
                            />

                            <label htmlFor="pass1">Repeat Password</label>
                            <input
                                type="password"
                                name="pass2"
                                placeholder="Repeat Password"
                            />

                            <button
                                type="submit"
                                className="button-shine new-wallet-btn"
                            >
                                Create New Wallet
                            </button>
                        </form>
                    </div>
                </div>
            );
        }
        if (this.props.openFromExistingModal) {
            modal = (
                <div
                    className={`openFromExistingModal ${
                        this.props.openFromExistingModal ? "active" : ""
                        }`}
                >
                    <div className="sendModalInner">
                        <span
                            className="close"
                            onClick={this.props.closeModal}
                        >
                            X
                        </span>
                        <h3>Open Wallet File</h3>
                        <button
                            className="button-shine browse-btn"
                            onClick={this.props.browseFile}
                        >
                            Browse File
                        </button>
                        <form
                            onSubmit={e => {
                                this.props.openWalletFile(e);
                            }}
                        >
                            <label htmlFor="path">Wallet File</label>
                            <input
                                name="filepath"
                                value={this.props.filepath}
                                placeholder="Wallet File Path"
                                readOnly
                            />

                            <label htmlFor="path">Wallet Password</label>
                            <input
                                type="password"
                                name="pass"
                                placeholder="Wallet Password"
                            />

                            <button
                                type="submit"
                                className="button-shine new-wallet-btn"
                            >
                                Open Wallet File
                            </button>
                        </form>
                    </div>
                </div>
            )
        }
        if (this.props.openCreateFromKeysModal) {
          modal = (
            <div
                  className={`openCreateFromKeysModal ${
                  this.props.openCreateFromKeysModal ? "active" : ""}`
              }
            >
              <div className="sendModalInner">
                <span
                  className="close"
                  onClick={this.props.closeModal}
                >
                  X
                </span>
                <h3>Create Wallet From Keys</h3>
                <form onSubmit={this.props.createNewWalletFromKeys}>
                  <div className="form-wrap">
                    <div className="form-group">
                      <label htmlFor="address">Safex Address</label>
                      <textarea
                        name="address"
                        placeholder="Address"
                        rows="5"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="pass1">Password</label>
                      <input
                        type="password"
                        name="pass1"
                        placeholder="Password"
                      />
                      <label htmlFor="pass1">Repeat Password</label>
                      <input
                        type="password"
                        name="pass2"
                        placeholder="Repeat Password"
                      />
                    </div>
                  </div>
                  <label htmlFor="spendkey">
                    Secret Spend Key (Sec, Private){" "}
                  </label>
                  <input
                    name="spendkey"
                    placeholder="Secret Spendkey"
                  />
                  <label htmlFor="viewkey">
                    Secret View Key (Sec, Private)
                  </label>
                  <input name="viewkey" placeholder="Secret Viewkey" />
                  <button
                    type="submit"
                    className="button-shine new-wallet-btn"
                  >
                    Create Wallet From Keys
                  </button>
                </form>
              </div>
            </div>
          );
        }
        if (this.props.instructionsModalActive) {
          modal = (
            <div
              className={`instructions-modal ${
                this.props.instructionsModalActive ? "active" : ""
              }`}
            >
              <span className="close" onClick={this.props.closeModal}>
                X
              </span>
              <div className="lang-bts-wrap">
                <button
                  className={`button-shine ${
                    this.props.instructionsLang === "english"
                      ? "active"
                      : ""
                  }`}
                  onClick={this.props.changeInstructionLang}
                >
                  EN
                </button>
                <button
                  className={`button-shine ${
                    this.props.instructionsLang === "serbian"
                      ? "active"
                      : ""
                  }`}
                  onClick={this.props.changeInstructionLang}
                >
                  SRB
                </button>
              </div>
              {this.props.instructionsLang === "english" ? (
                <div>
                  <h3>Instructions</h3>
                  <p>
                    If you don't already have a Safex Wallet, click the
                    Create New Wallet File
                    <button className="icon-btn">
                      <img
                        src="images/new-wallet.png"
                        alt="new-wallet"
                      />
                    </button>
                    button. Enter password for your new wallet and click
                    <button>Create New Wallet</button>. In the dialog
                    box, enter the name for your wallet file and choose
                    where you want to save your wallet file. If you
                    already have a wallet file, click Open Existing
                    Wallet File
                    <button className="icon-btn">
                      <img src="images/open-logo.png" alt="open-logo" />
                    </button>
                    button, enter the password for your wallet file and
                    and click
                    <button>Open Wallet File</button>button. If you want
                    to create new wallet from keys click Create Wallet
                    From Keys
                    <button className="icon-btn">
                      <img
                        src="images/create-from-keys.png"
                        alt="create-from-keys"
                      />
                    </button>
                    button. Enter your Safex address, private spend key,
                    private view key and password and save it in a
                    wallet file by clicking
                    <button>Create Wallet From Keys </button>button.
                  </p>
                  <p className="warning red">
                    Wallet files are made to control your coins, make
                    sure you keep them safe at all times. If you share
                    or lose your wallet file it can and will result in
                    total loss of your Safex Cash and Safex Tokens.
                  </p>
                  <p className="warning green">
                    Once your wallet file is saved, your Safex address
                    will apear in the address field and you are ready to
                    start mining.
                  </p>
                  <p>
                    Select one of the pools you want to connect to,
                    choose how much CPU power you want to use for mining
                    and click start to begin. That's it, mining will
                    start in a couple of seconds. Good luck!
                  </p>
                </div>
              ) : (
                <div>
                  <h3>Uputstvo</h3>
                  <p>
                    Ako nemate Safex Wallet, kliknite Create New Wallet
                    File
                    <button className="icon-btn">
                      <img
                        src="images/new-wallet.png"
                        alt="new-wallet"
                      />
                    </button>
                    dugme. Unesite lozinku za svoju datoteku i kliknite{" "}
                    <button>Create New Wallet</button>dugme. U dijalog
                    prozoru, unesite ime za Vašu wallet datoteku i
                    izaberite gde želite da ga sačuvate. Ako već imate
                    wallet datoteku, kliknite Open Existing Wallet File{" "}
                    <button className="icon-btn">
                      {" "}
                      <img src="images/open-logo.png" alt="open-logo" />
                    </button>
                    dugme, unesite lozinku Vaše datoteke i kliknite
                    <button>Open Wallet File</button>dugme. Ako želite
                    da napravite novu datoteku od već postojećih
                    ključeva, kliknite
                    <button className="icon-btn">
                      <img
                        src="images/create-from-keys.png"
                        alt="create-from-keys"
                      />
                    </button>
                    dugme. Unesite svoju Safex adresu, tajni spend ključ
                    (private spend key), tajni view ključ (private view
                    key), lozinku i sačuvajte datoteku klikom na
                    <button>Create Wallet From Keys </button>dugme.
                  </p>
                  <p className="warning red">
                    Wallet datoteka kontroliše Vaše novčiće, zato je
                    uvek čuvajte na bezbednom. Ako podelite ili izgubite
                    Vašu Wallet datoteku sigurno ćete izgubiti sav Vaš
                    Safex Cash i Safex Tokene.
                  </p>
                  <p className="warning green">
                    Kada sačuvate Vašu datoteku, Vaša Safex adresa će se
                    pojaviti u predvidjenom polju i spremni ste da
                    počnete sa rudarenjem.
                  </p>
                  <p>
                    Izaberite pool na koji želite da se povežete,
                    izaberite koliku procesorku snagu želite da
                    koristite i kliknite Start da počnete sa rudarenjem.
                    To je to, rudarenje će početi za par sekundi.
                    Srećno!
                  </p>
                </div>
              )}
            </div>
          );
        }
        if (this.props.balanceAlert) {
            modal = (
                <div
                    className={`balanceAlert ${
                    this.props.balanceAlert ? "active" : ""
                    }`}
                >
                    <div className="mainAlertPopupInner">
                        <p>{this.props.balanceAlertText}</p>
                        {this.props.balanceAlertCloseDisabled ? (
                            ""
                        ) : (
                            <span
                                className="close"
                                onClick={this.props.closeModal}
                            >
                                X
                            </span>
                        )}
                    </div>
                </div>
            )
        }

        return (
            <div>
                <div className={"modal" + addClass(this.props.modal, "active")}>
                    {modal}
                </div>
                <div
                    className={"backdrop" + addClass(this.props.modal, "active")}
                    onClick={this.props.alertCloseDisabled ? "" : this.props.closeModal}
                />
            </div>
        );
    }
}
