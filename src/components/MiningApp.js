import React from "react";
import {
  updatedCallback,
  refreshCallback,
  newBlockCallback,
  balanceCheck,
  rescanBalance,
  roundAmount
} from "../utils/balance";
import {
  openSendPopup,
  closeSendPopup,
  inputValidate,
  checkInputValueLenght,
  checkInputValuePrefix,
  openModal,
  closeAllModals
} from "../utils/utils";
import { miningStart, miningStop } from "../utils/mining";
import {
  create_new_wallet,
  create_new_wallet_from_keys,
  open_from_wallet_file
} from "../utils/wallet";
import Header from "./partials/Header";
import Modal from "./partials/Modal";

const { shell } = window.require("electron");
const safex = window.require("safex-nodejs-libwallet");
const { dialog } = window.require("electron").remote;
const remote = window.require("electron").remote;

export default class MiningApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      //mining settings
      active: false,
      starting: false,
      stopping: false,
      new_wallet: "",
      new_wallet_generated: false,
      exported: false,
      hashrate: "0",
      address: "",
      pool_url: "",
      mining_info: "",
      pools_list: [
        "pool.safexnews.net:1111",
        "safex.cool-pool.net:3333",
        "safex.cryptominingpools.net:3333",
        "minesfx.com:1111",
        "safex.luckypool.io:3366",
        "safex.xmining.pro:3333"
      ],
      jsonConfig: {
        algo: "cryptonight/2",
        api: {
          port: 0,
          "access-token": null,
          "worker-id": null,
          ipv6: false,
          restricted: true
        },
        av: 0,
        background: false,
        colors: true,
        "cpu-affinity": null,
        "cpu-priority": null,
        "donate-level": 5,
        "huge-pages": true,
        "hw-aes": null,
        "log-file": null,
        "max-cpu-usage": 100,
        pools: [
          {
            url: "",
            user: "",
            pass: "x",
            "rig-id": null,
            nicehash: false,
            keepalive: false,
            variant: 1
          }
        ],
        "print-time": 60,
        retries: 5,
        "retry-pause": 5,
        safe: false,
        threads: null,
        "user-agent": null,
        watch: false
      },

      //UI settings
      modal_active: false,
      modal_close_disabled: false,
      instructions_modal_active: false,
      balance_modal_active: false,
      balance_alert_close_disabled: false,
      instructions_lang: "english",
      new_wallet_modal: false,

      //balance settings
      balance: 0,
      unlocked_balance: 0,
      tokens: 0,
      unlocked_tokens: 0,
      balance_wallet: "",
      balance_view_key: "",
      balance_spend_key: "",
      balance_alert: false,
      open_file_alert: false,
      create_new_wallet_alert: false,
      create_from_keys_alert: false,
      balance_alert_text: "",
      send_cash_or_token: false,
      tick_handle: null,
      tx_being_sent: false,

      //wallet state settings
      wallet_meta: null,
      wallet: {
        wallet_sync: false,
        address: "",
        spend_key: "",
        view_key: "",
        wallet_connected: "",
        balance: 0,
        unlocked_balance: 0,
        tokens: 0,
        unlocked_tokens: 0,
        blockchain_height: 0
      },
      wallet_sync: false,
      wallet_being_created: false,
      create_new_wallet_modal: false,
      open_from_existing_modal: false,
      create_from_keys_modal: false,
      wallet_loaded: false,
      wallet_exists: false,
      wallet_password: "",
      wallet_path: ""
    };
  }

  //first step select wallet path, if exists, set password
  //second step set password

  //paste in address start mining
  //create new
  //import -> keys/file

  browseFile = () => {
    var filepath = "";
    filepath = dialog.showOpenDialog({});
    console.log("filename " + filepath);

    this.setState(() => ({
      wallet_path: filepath
    }));
  };

  createNewWallet = (e) => {
    create_new_wallet(this, e)
  }

  createNewWalletFromKeys = (e) => {
    create_new_wallet_from_keys(this, e);
  }

  openWalletFile = (e) => {
    open_from_wallet_file(this, e);
  }

  addressChange = e => {
    let address = e.target.value;
    this.setState({
      mining_info: false,
      wallet: { address }
    });
  };

  closeWallet = () => {
    if (this.state.wallet_loaded) {
      this.state.wallet_meta.pauseRefresh();
      this.state.wallet_meta.off();
      this.state.wallet_meta.close(true);
      this.setState({
        wallet_loaded: false
      });
      clearTimeout(this.state.tick_handle);

      console.log("wallet closed");
    }
  };

  openInfoPopup = message => {
    this.setState({
      mining_info: true,
      mining_info_text: message
    });
  };

  setOpenModal = (modal_type, alert, disabled) => {
    openModal(this, modal_type, alert, disabled);
  };

  setOpenBalanceAlert = (alert, disabled = false) => {
    this.setOpenModal("balance_alert", alert, disabled);
  };

  setCloseBalanceAlert = () => {
    this.setState({
      balance_alert: false,
      balance_alert_close_disabled: false
    })
  };

  setOpenSendPopup = send_cash_or_token => {
    openSendPopup(this, send_cash_or_token);
  };

  setCloseSendPopup = () => {
    closeSendPopup(this);
  };

  closeModal = () => {
    closeAllModals(this);
  };

  startBalanceCheck = () => {
    balanceCheck(this);
  };

  startRefreshCallback = () => {
    refreshCallback(this);
  };

  startNewBlockCallback = height => {
    newBlockCallback(this, height);
  };

  startUpdatedCallback = () => {
    updatedCallback(this);
  };

  startRescanBalance = () => {
    rescanBalance(this);
  };

  sendCashOrToken = (e, cash_or_token) => {
    e.preventDefault();
    let sendingAddress = e.target.send_to.value;
    let amount = e.target.amount.value * 10000000000;
    let paymentid = e.target.paymentid.value;
    this.setState(() => ({
      cash_or_token: cash_or_token
    }));

    if (sendingAddress === "") {
      this.setOpenBalanceAlert("Fill out all the fields");
      return false;
    }
    if (amount === "") {
      this.setOpenBalanceAlert("Enter Amount");
      return false;
    }
    if (paymentid !== "") {
      console.log("amount " + amount);
      console.log("paymentid " + paymentid);
      this.setState(() => ({
        tx_being_sent: true
      }));
      this.sendTransaction({
        address: sendingAddress,
        amount: amount,
        paymentId: paymentid,
        tx_type: cash_or_token
      });
    } else {
      console.log("amount " + amount);
      this.setState(() => ({
        tx_being_sent: true
      }));
      this.sendTransaction({
        address: sendingAddress,
        amount: amount,
        tx_type: cash_or_token
      });
    }
  };

  sendTransaction = args => {
    let wallet = this.state.wallet_meta;

    wallet
      .createTransaction(args)
      .then(tx => {
        let txId = tx.transactionsIds();
        if (this.state.cash_or_token === 0) {
          console.log("Cash transaction created: " + txId);
        } else {
          console.log("Token transaction created: " + txId);
        }
        tx.commit()
          .then(() => {
            console.log("Transaction commited successfully");
            if (this.state.cash_or_token === 0) {
              this.setOpenBalanceAlert("Transaction commited successfully, Your cash transaction ID is: " + txId);
            } else {
              this.setOpenBalanceAlert("Transaction commited successfully, Your token transaction ID is: " + txId);
            }
            this.setState(() => ({
              tx_being_sent: false
            }));
            setTimeout(() => {
              this.setState({
                wallet: {
                  balance: roundAmount(
                    wallet.unlockedBalance() - wallet.balance()
                  ),
                  unlocked_balance: roundAmount(wallet.unlockedBalance()),
                  tokens: roundAmount(
                    wallet.unlockedTokenBalance() - wallet.tokenBalance()
                  ),
                  unlocked_tokens: roundAmount(wallet.unlockedTokenBalance())
                }
              });
            }, 300);
          })
          .catch(e => {
            this.setState(() => ({
              tx_being_sent: false
            }));
            this.setOpenBalanceAlert("Error on commiting transaction: " + e);
          });
      })
      .catch(e => {
        this.setState(() => ({
          tx_being_sent: false
        }));
        this.setOpenBalanceAlert("Couldn't create transaction: " + e);
      });
  };

  changeInstructionLang = () => {
    if (this.state.instructions_lang === "english") {
      this.setState({
        instructions_lang: "serbian"
      });
    } else {
      this.setState({
        instructions_lang: "english"
      });
    }
  };

  handleSubmit = e => {
    e.preventDefault();
    let miningAddress = e.target.mining_address.value;

    if (miningAddress === "") {
      this.openInfoPopup("Please enter Safex address");
      return false;
    }
    if (!inputValidate(miningAddress)) {
      this.openInfoPopup("Please enter valid Safex address");
      return false;
    }
    if (!checkInputValueLenght(miningAddress)) {
      this.openInfoPopup("Please enter valid address");
      return false;
    }
    if (!checkInputValuePrefix(miningAddress)) {
      this.openInfoPopup("Your address must start with Safex or SFXt");
      return false;
    }
    if (!safex.addressValid(miningAddress, "mainnet")) {
      this.openInfoPopup("Address is not valid");
      return false;
    }
    if (this.state.active) {
      miningStop(this);
    } else {
      miningStart(this);
    }
  };

  checkStatus = () => {
    this.setState({
      hashrate: this.miner.getStatus().split(" ")[2]
    });
    console.log(this.miner.getStatus(), this.state.hashrate);
  };

  footerLink = () => {
    shell.openExternal("https://www.safex.io/");
  };

  closeApp = () => {
    let window = remote.getCurrentWindow();
    if (this.state.active) {
      miningStop(this);
      this.closeWallet();
      setTimeout(() => {
        window.close();
      }, 6000);
    } else {
      window.close();
    }
  };

  renderButton = ({ type, title, content, classes, disabled }) => (
    <button
      className={classes.join(" ")}
      key={type}
      onClick={this.setOpenModal.bind(this, type)}
      title={title}
      disabled={disabled}
    >
      {content.startsWith("images/") ? (
        <img src={content} alt={content} />
      ) : (
          content
        )}
    </button>
  );

  render() {
    let cpu_options = [];
    for (var i = 25; i <= 100; i += 25) {
      cpu_options.push(
        <option key={i} value={i}>
          {i}%
        </option>
      );
    }
    cpu_options.reverse();

    const pools_list = this.state.pools_list.map((pools_list, index) => (
      <option key={index} value={pools_list} id={index}>
        {pools_list}
      </option>
    ));

    const buttons = [
      {
        type: "new_wallet_modal",
        title: "Generate New Wallet",
        content: "images/new.png",
        classes: ["modal-btn"],
        disabled: false
      },
      {
        type: "create_new_wallet_modal",
        title: "Create New Wallet File",
        content: "images/new-wallet.png",
        classes: ["modal-btn"],
        disabled:
          this.state.wallet_loaded || this.state.active || this.state.stopping
      },
      {
        type: "open_from_existing_modal",
        title: "Open Wallet File",
        content: "images/open-logo.png",
        classes: ["modal-btn"],
        disabled:
          this.state.wallet_loaded || this.state.active || this.state.stopping
      },
      {
        type: "create_from_keys_modal",
        title: "Create New Wallet From Keys",
        content: "images/create-from-keys.png",
        classes: ["modal-btn"],
        disabled:
          this.state.wallet_loaded || this.state.active || this.state.stopping
      },
      {
        type: "balance_modal_active",
        title: "Check Balance",
        content: "images/key.png",
        classes: ["modal-btn"],
        disabled: false
      },
      {
        type: "instructions_modal_active",
        title: "Instructions",
        content: "?",
        classes: ["modal-btn", "instructions-btn"],
        disabled: false
      }
    ];

    return (
      <div className="mining-app-wrap">
        <div className="mining-bg-wrap animated fadeIn">
          <img
            className={
              this.state.active || this.state.stopping ? "rotatingLeft" : ""
            }
            src="images/circle-outer.png"
            alt="Circle-outer"
          />
          <img
            className={
              this.state.active || this.state.stopping
                ? "rotatingRight"
                : ""
            }
            src="images/circle-inner.png"
            alt="Circle-inner"
          />
        </div>

        <div className="mining-app-inner">
          <Header closeApp={this.closeApp} />

          <div className="main animated fadeIn">
            <div className="btns-wrap">
              {buttons.map(this.renderButton)}
            </div>

            <form onSubmit={this.handleSubmit}>
              <div className="address-wrap">
                <img src="images/line-left.png" alt="Line Left" />
                <input
                  type="text"
                  value={this.state.wallet.address}
                  onChange={this.addressChange}
                  placeholder="Safex Address"
                  name="mining_address"
                  id="mining_address"
                  disabled={
                    this.state.active || this.state.stopping
                      ? "disabled"
                      : ""
                  }
                  title={
                    this.state.mining_address === ""
                      ? "Your Safex Address will be shown here"
                      : "Your Safex Address"
                  }
                  readOnly={this.state.wallet_loaded ? "readOnly" : ""}
                />
                <img src="images/line-right.png" alt="Line Right" />
              </div>

              <select
                className="button-shine pool-url"
                name="pool"
                id="pool"
                disabled={
                  this.state.active || this.state.stopping ? "disabled" : ""
                }
                title={`Choose the pool you want to connect to 
                    ${
                      this.state.active || this.state.stopping
                        ? "(disabled while mining)"
                        : ""
                    }`}
              >
                {pools_list}
              </select>

              <div className="options">
                <div className="input-group">
                  <p># CPU</p>
                  <select
                    name="cores"
                    id="cpuUsage"
                    disabled={
                      this.state.active || this.state.stopping
                        ? "disabled"
                        : ""
                    }
                    title={`Choose how much CPU power you want to use for mining
                        ${
                          this.state.active || this.state.stopping
                            ? "(disabled while mining)"
                            : ""
                        }
                    `}
                  >
                    {cpu_options}
                  </select>
                </div>
              </div>
              {this.state.active ? (
                <div>
                  {this.state.starting ? (
                    <button
                      type="submit"
                      className="submit button-shine active"
                      disabled
                    >
                      Starting
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="submit button-shine active"
                    >
                      Stop
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  {this.state.stopping ? (
                    <button
                      type="submit"
                      className="submit button-shine active"
                      disabled={
                        this.state.active || this.state.stopping
                          ? "disabled"
                          : ""
                      }
                    >
                      <span>Stopping</span>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="submit button-shine"
                      disabled={
                        this.state.active || this.state.stopping
                          ? "disabled"
                          : ""
                      }
                    >
                      <span>Start</span>
                    </button>
                  )}
                </div>
              )}
              <p
                className={
                  this.state.mining_info
                    ? "mining-info active"
                    : "mining-info"
                }
              >
                {this.state.mining_info_text}
              </p>
            </form>

            <div className="hashrate">
              <p className="blue-text">hashrate:</p>
              <p className="white-text">{this.state.hashrate} H/s</p>
            </div>

            <footer className="animated fadeIn">
              <a onClick={this.footerLink} title="Visit our site">
                <img src="images/powered.png" alt="Balkaneum" />
              </a>
            </footer>
          </div>

          <Modal
            modal={this.state.modal}
            newWalletModal={this.state.new_wallet_modal}
            closeModal={this.closeModal}
            instructionsModalActive={this.state.instructions_modal_active}
            instructionsLang={this.state.instructions_lang}
            changeInstructionLang={this.changeInstructionLang}
            createNewWalletModal={this.state.create_new_wallet_modal}
            createNewWallet={this.createNewWallet}
            browseFile={this.browseFile}
            openFromExistingModal={this.state.open_from_existing_modal}
            openWalletFile={this.openWalletFile}
            filepath={this.state.wallet_path}
            openCreateFromKeysModal={this.state.create_from_keys_modal}
            closeCreateFromKeysModal={this.closeModal}
            createNewWalletFromKeys={this.createNewWalletFromKeys}
            wallet={this.state.wallet}
            balanceModalActive={this.state.balance_modal_active}
            walletLoaded={this.state.wallet_loaded}
            startRescanBalance={this.startRescanBalance}
            setOpenSendPopup={this.setOpenSendPopup}
            sendModal={this.state.send_modal}
            send_cash_or_token={this.state.send_cash_or_token}
            sendCashOrToken={this.sendCashOrToken}
            closeSendPopup={this.setCloseSendPopup}
            txBeingSent={this.state.tx_being_sent}
            availableCash={this.state.wallet.unlocked_balance}
            availableTokens={this.state.wallet.unlocked_tokens}
            balanceAlert={this.state.balance_alert}
            balanceAlertText={this.state.balance_alert_text}
          />
        </div>
      </div>
    );
  }
}
