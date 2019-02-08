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
  verify_safex_address,
  openBalanceAlert,
  closeBalanceAlert,
  openSendPopup,
  closeSendPopup,
  parseEnv,
  inputValidate,
  checkInputValueLenght,
  checkInputValuePrefix,
  closeAllModals
} from "../utils/utils";
import { miningStart, miningStop } from "../utils/mining";

import NewWalletModal from "./partials/NewWalletModal";
import BalanceAlert from "./partials/BalanceAlert";
import SendModal from "./partials/SendModal";
import CreateNewWalletModal from "./partials/CreateNewWalletModal";
import OpenExistingWalletModal from "./partials/OpenExistingWalletModal";
import CreateFromKeysModal from "./partials/CreateFromKeysModal";
import InstructionsModal from "./partials/InstructionsModal";
import Header from "./partials/Header";

const { shell } = window.require("electron");
const safex = window.require("safex-nodejs-libwallet");
const { dialog } = window.require("electron").remote;
const remote = window.require("electron").remote;

export default class MiningApp extends React.Component {
  constructor(props) {
    super(props);
    this.env = parseEnv();
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
        "safex.cnpools.space:3333",
        "safex.cnpools.space:1111",
        "safex.cryptominingpools.net:3333",
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
      exit_modal: false,
      exiting: false,

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
      wallet_path: "",
      network: "mainnet",
      daemonHostPort: "rpc.safex.io:17402"
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

  open_from_wallet_file = e => {
    e.preventDefault();
    const pass = e.target.pass.value;
    let filepath = e.target.filepath.value;

    if (filepath === "") {
      this.setOpenBalanceAlert(
        "Choose the wallet file",
        "open_file_alert",
        false
      );
      return false;
    }
    if (pass === "") {
      this.setOpenBalanceAlert(
        "Enter password for your wallet file",
        "open_file_alert",
        false
      );
      return false;
    }
    if (this.state.wallet_loaded) {
      this.closeWallet();
    }
    this.setState({
      modal_close_disabled: true
    });
    var args = {
      path: this.state.wallet_path,
      password: pass,
      network: this.state.network,
      daemonAddress: this.state.daemonHostPort
    };
    this.setOpenBalanceAlert(
      "Please wait while your wallet file is loaded",
      "open_file_alert",
      true
    );
    safex
      .openWallet(args)
      .then(wallet => {
        this.setState({
          wallet_loaded: true,
          wallet_meta: wallet,
          modal_close_disabled: false,
          balance_alert_close_disabled: true,
          mining_info: false,
          wallet: {
            address: wallet.address(),
            spend_key: wallet.secretSpendKey(),
            view_key: wallet.secretViewKey()
          }
        });
        this.closeModal();
      })
      .catch(err => {
        this.setState(() => ({
          modal_close_disabled: false
        }));
        this.setOpenBalanceAlert(
          "Error opening the wallet: " + err,
          "open_file_alert",
          false
        );
      });
  };

  create_new_wallet = e => {
    e.preventDefault();

    const pass1 = e.target.pass1.value;
    const pass2 = e.target.pass2.value;
    console.log("new wallet password " + e.target.pass1.value);

    if (pass1 === "" || pass2 === "") {
      this.setOpenBalanceAlert(
        "Fill out all the fields",
        "create_new_wallet_alert",
        false
      );
      return false;
    }
    if (pass1 !== pass2) {
      this.setOpenBalanceAlert(
        "Repeated password does not match",
        "create_new_wallet_alert",
        false
      );
      return false;
    }
    if (this.state.wallet_loaded) {
      this.closeWallet();
    }
    dialog.showSaveDialog(filepath => {
      if (!filepath) {
        return false;
      }
      if (safex.walletExists(filepath)) {
        this.setState(() => ({
          modal_close_disabled: false
        }));
        this.setOpenBalanceAlert(
          `Wallet already exists. Please choose a different file name.
          This application does not enable overwriting an existing wallet file
          OR you can open it using the Load Existing Wallet`,
          "create_new_wallet_alert",
          false
        );
        return false;
      }
      this.setState(() => ({
        wallet_path: filepath,
        wallet_exists: false,
        modal_close_disabled: true
      }));
      var args = {
        path: filepath,
        password: pass1,
        network: this.state.network,
        daemonAddress: this.state.daemonHostPort
      };
      this.setOpenBalanceAlert(
        "Please wait while your wallet file is being created",
        "create_new_wallet_alert",
        true
      );
      console.log(
        "wallet doesn't exist. creating new one: " + this.state.wallet_path
      );

      safex
        .createWallet(args)
        .then(wallet => {
          this.setState({
            wallet_loaded: true,
            wallet_meta: wallet,
            wallet: {
              address: wallet.address(),
              spend_key: wallet.secretSpendKey(),
              view_key: wallet.secretViewKey()
            },
            modal_close_disabled: false,
            mining_info: false
          });
          console.log("wallet address  " + this.state.wallet.address);
          console.log(
            "wallet spend private key  " + this.state.wallet.spend_key
          );
          console.log("wallet view private key  " + this.state.wallet.view_key);
          wallet.on("refreshed", () => {
            console.log("Wallet File successfully created!");
            this.closeModal();
            wallet
              .store()
              .then(() => {
                console.log("Wallet stored");
              })
              .catch(e => {
                console.log("Unable to store wallet: " + e);
              });
          });
        })
        .catch(err => {
          this.setOpenBalanceAlert(
            "error with the creation of the wallet " + err,
            "create_new_wallet_alert",
            false
          );
        });
    });
    //pass dialog box
    //pass password
    //confirm password
  };

  create_new_wallet_from_keys = e => {
    e.preventDefault();

    //here we need the key set
    //the wallet path desired
    //the password
    var safex_address = e.target.address.value;
    var view_key = e.target.viewkey.value;
    var spend_key = e.target.spendkey.value;
    var pass1 = e.target.pass1.value;
    var pass2 = e.target.pass2.value;

    if (
      safex_address === "" ||
      view_key === "" ||
      spend_key === "" ||
      pass1 === "" ||
      pass2 === ""
    ) {
      this.setOpenBalanceAlert(
        "Fill out all the fields",
        "create_from_keys_alert",
        false
      );
      return false;
    }
    if (pass1 === "" && pass2 === "" && pass1 !== pass2) {
      this.setOpenBalanceAlert(
        "Passwords do not match",
        "create_from_keys_alert",
        false
      );
      return false;
    }
    if (verify_safex_address(spend_key, view_key, safex_address) === false) {
      this.setOpenBalanceAlert(
        "Incorrect keys",
        "create_from_keys_alert",
        false
      );
      return false;
    }
    if (this.state.wallet_loaded) {
      this.closeWallet();
    }
    dialog.showSaveDialog(filepath => {
      if (!filepath) {
        return false;
      }
      if (safex.walletExists(filepath)) {
        this.setState(() => ({
          modal_close_disabled: false
        }));
        this.setOpenBalanceAlert(
          `Wallet already exists. Please choose a different file name.
          This application does not enable overwriting an existing wallet file
          OR you can open it using the Load Existing Wallet`,
          "create_new_wallet_alert",
          false
        );
        return false;
      }
      this.setState({
        wallet_path: filepath,
        wallet_exists: false,
        modal_close_disabled: true
      });
      var args = {
        path: this.state.wallet_path,
        password: pass1,
        network: this.state.network,
        daemonAddress: this.state.daemonHostPort,
        restoreHeight: 0,
        addressString: safex_address,
        viewKeyString: view_key,
        spendKeyString: spend_key
      };
      this.setOpenBalanceAlert(
        "Please wait while your wallet file is being created. Do not close the application until the process is complete. This may take some time, please be patient.",
        "create_from_keys_alert",
        true
      );
      console.log(
        "wallet doesn't exist. creating new one: " + this.state.wallet_path
      );

      safex
        .createWalletFromKeys(args)
        .then(wallet => {
          console.log("Create wallet form keys performed!");
          this.setState({
            wallet_loaded: true,
            wallet_meta: wallet,
            wallet: {
              address: wallet.address(),
              spend_key: wallet.secretSpendKey(),
              view_key: wallet.secretViewKey()
            },
            modal_close_disabled: false,
            mining_info: false
          });
          console.log("wallet address  " + this.state.wallet.address);
          console.log(
            "wallet spend private key  " + this.state.wallet.spend_key
          );
          console.log("wallet view private key  " + this.state.wallet.view_key);
          console.log("create_new_wallet_from_keys checkpoint 1");
          wallet.on("refreshed", () => {
            console.log("Wallet File successfully created!");
            this.closeModal();
            wallet
              .store()
              .then(() => {
                console.log("Wallet stored");
              })
              .catch(e => {
                console.log("Unable to store wallet: " + e);
              });
          });
        })
        .catch(err => {
          console.log("Create wallet form keys failed!");
          this.setOpenBalanceAlert(
            "Error with the creation of the wallet " + err,
            "create_from_keys_alert",
            false
          );
        });
    });
    console.log("create_new_wallet_from_keys checkpoint 2");
  };

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

  openModal = modal_type => {
    this.setState({
      [modal_type]: true
    });
    if (modal_type === "balance_modal_active" && this.state.wallet_loaded) {
      this.startBalanceCheck();
    }
  };

  setOpenBalanceAlert = (alert, alert_state, disabled) => {
    openBalanceAlert(this, alert, alert_state, disabled);
  };

  setCloseBalanceAlert = () => {
    if (this.state.balance_alert_close_disabled === false) {
      closeBalanceAlert(this);
    }
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
      this.setOpenBalanceAlert(
        "Fill out all the fields",
        "balance_alert",
        false
      );
      return false;
    }
    if (amount === "") {
      this.setOpenBalanceAlert("Enter Amount", "balance_alert", false);
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
              this.setOpenBalanceAlert(
                "Transaction commited successfully, Your cash transaction ID is: " +
                  txId,
                "balance_alert",
                false
              );
            } else {
              this.setOpenBalanceAlert(
                "Transaction commited successfully, Your token transaction ID is: " +
                  txId,
                "balance_alert",
                false
              );
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
            this.setOpenBalanceAlert(
              "Error on commiting transaction: " + e,
              "balance_alert",
              false
            );
          });
      })
      .catch(e => {
        this.setState(() => ({
          tx_being_sent: false
        }));
        this.setOpenBalanceAlert(
          "Couldn't create transaction: " + e,
          "balance_alert",
          false
        );
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
        this.setState({
          exiting: true
        });
      }, 5000);
      setTimeout(() => {
        window.close();
      }, 6000);
    } else {
      this.setState({
        exiting: true
      });
      setTimeout(() => {
        window.close();
      }, 1000);
    }
  };

  renderButton = ({ type, title, content, classes, disabled }) => (
    <button
      className={classes.join(" ")}
      key={type}
      onClick={this.openModal.bind(this, type)}
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
        <div
          className={`mining-bg-wrap animated ${
            this.state.exiting ? "fadeOut" : "fadeIn"
          }`}
        >
          <img
            className={
              this.state.active || this.state.stopping ? "rotatingLeft" : ""
            }
            src="images/circle-outer.png"
            alt="Circle-outer"
          />
          <img
            className={
              this.state.active || this.state.stopping ? "rotatingRight" : ""
            }
            src="images/circle-inner.png"
            alt="Circle-inner"
          />
        </div>

        <div className="mining-app-inner">
          <Header exiting={this.state.exiting} closeApp={this.closeApp} />

          <div
            className={`main animated ${
              this.state.exiting ? "fadeOut" : "fadeIn"
            }`}
          >
            <div className="btns-wrap">{buttons.map(this.renderButton)}</div>

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
                    this.state.active || this.state.stopping ? "disabled" : ""
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
                      this.state.active || this.state.stopping ? "disabled" : ""
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
                  this.state.mining_info ? "mining-info active" : "mining-info"
                }
              >
                {this.state.mining_info_text}
              </p>
            </form>

            <div className="hashrate">
              <p className="blue-text">hashrate:</p>
              <p className="white-text">{this.state.hashrate} H/s</p>
            </div>

            <footer
              className={
                this.state.exiting ? "animated fadeOut" : "animated fadeIn"
              }
            >
              <a onClick={this.footerLink} title="Visit our site">
                <img src="images/powered.png" alt="Balkaneum" />
              </a>
            </footer>
          </div>

          <div
            className={
              this.state.balance_modal_active
                ? "modal balance-modal active"
                : "modal balance-modal"
            }
          >
            <span
              className="close"
              onClick={this.closeModal}
              disabled={this.state.wallet_sync ? "" : "disabled"}
            >
              X
            </span>
            <h3 className={this.state.wallet_loaded ? "wallet-loaded-h3" : ""}>
              Check Balance
            </h3>

            {this.state.wallet_loaded ? (
              <div className="wallet-exists">
                <div className="btns-wrap">
                  <button
                    className={`signal
                        ${this.state.wallet.wallet_connected ? "connected" : ""}
                    `}
                    title="Status"
                  >
                    <img
                      src={
                        this.state.wallet.wallet_connected
                          ? "images/connected-blue.png"
                          : "images/connected-white.png"
                      }
                      alt="connected"
                    />
                    <p>
                      {this.state.wallet.wallet_connected ? (
                        <span>Connected</span>
                      ) : (
                        <span>Connection error</span>
                      )}
                    </p>
                  </button>
                  <button className="blockheight" title="Blockchain Height">
                    <img src="images/blocks.png" alt="blocks" />
                    <span>{this.state.wallet.blockchain_height}</span>
                  </button>
                  <button
                    className="button-shine refresh"
                    onClick={this.startRescanBalance}
                    title="Rescan blockchain from scratch"
                  >
                    <img src="images/refresh.png" alt="rescan" />
                  </button>
                </div>
                <label htmlFor="selected_balance_address">
                  Safex Wallet Address
                </label>
                <textarea
                  placeholder="Safex Wallet Address"
                  name="selected_balance_address"
                  value={this.state.wallet.address}
                  rows="2"
                  readOnly
                />

                <div className="groups-wrap">
                  <div className="form-group">
                    <label htmlFor="balance">Pending Safex Cash</label>
                    <input
                      type="text"
                      placeholder="Balance"
                      name="balance"
                      className="yellow-field"
                      value={this.state.wallet.balance}
                      readOnly
                    />
                    <label htmlFor="unlocked_balance">
                      Available Safex Cash
                    </label>
                    <input
                      type="text"
                      placeholder="Unlocked balance"
                      name="unlocked_balance"
                      className="green-field"
                      value={this.state.wallet.unlocked_balance}
                      readOnly
                    />
                    <button
                      className="button-shine"
                      onClick={this.setOpenSendPopup.bind(this, 0)}
                    >
                      Send Cash
                    </button>
                  </div>

                  <div className="form-group">
                    <label htmlFor="tokens">Pending Safex Tokens</label>
                    <input
                      type="text"
                      className="yellow-field"
                      placeholder="Tokens"
                      value={this.state.wallet.tokens}
                      readOnly
                    />
                    <label htmlFor="unlocked_tokens">
                      Available Safex Tokens
                    </label>
                    <input
                      type="text"
                      className="green-field"
                      placeholder="Unlocked Tokens"
                      name="unlocked_tokens"
                      value={this.state.wallet.unlocked_tokens}
                      readOnly
                    />
                    <button
                      className="button-shine"
                      onClick={this.setOpenSendPopup.bind(this, 1)}
                    >
                      Send Tokens
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-wallet">
                <h4>Please load the wallet file</h4>
              </div>
            )}

            <BalanceAlert
              balanceAlert={this.state.balance_alert}
              balanceAlertText={this.state.balance_alert_text}
              closeBalanceAlert={this.setCloseBalanceAlert}
              walletSync={this.wallet_sync}
              balanceAlertCloseDisabled={
                this.state.balance_alert_close_disabled
              }
            />

            <SendModal
              sendModal={this.state.send_modal}
              send_cash_or_token={this.state.send_cash_or_token}
              sendCashOrToken={this.sendCashOrToken}
              closeSendPopup={this.setCloseSendPopup}
              txBeingSent={this.state.tx_being_sent}
              availableCash={this.state.wallet.unlocked_balance}
              availableTokens={this.state.wallet.unlocked_tokens}
            />
          </div>

          <NewWalletModal
            newWalletModal={this.state.new_wallet_modal}
            closeNewWalletModal={this.closeModal}
          />

          <InstructionsModal
            instructionsModalActive={this.state.instructions_modal_active}
            instructionsLang={this.state.instructions_lang}
            changeInstructionLang={this.changeInstructionLang}
            closeInstructionsModal={this.closeModal}
          />

          <CreateNewWalletModal
            createNewWalletModal={this.state.create_new_wallet_modal}
            closeNewWalletModal={this.closeModal}
            createNewWallet={this.create_new_wallet}
            balanceAlert={this.state.create_new_wallet_alert}
            balanceAlertText={this.state.balance_alert_text}
            closeBalanceAlert={this.setCloseBalanceAlert}
          />

          <OpenExistingWalletModal
            browseFile={this.browseFile}
            openFromExistingModal={this.state.open_from_existing_modal}
            closeFromExistingModal={this.closeModal}
            openFromWalletFile={this.open_from_wallet_file}
            balanceAlert={this.state.open_file_alert}
            balanceAlertText={this.state.balance_alert_text}
            filepath={this.state.wallet_path}
            closeBalanceAlert={this.setCloseBalanceAlert}
          />

          <CreateFromKeysModal
            openCreateFromKeysModal={this.state.create_from_keys_modal}
            closeCreateFromKeysModal={this.closeModal}
            createNewWalletFromKeys={this.create_new_wallet_from_keys}
            balanceAlert={this.state.create_from_keys_alert}
            balanceAlertText={this.state.balance_alert_text}
            closeBalanceAlert={this.setCloseBalanceAlert}
          />

          <div
            className={`backdrop
                ${
                  this.state.modal_active ||
                  this.state.instructions_modal_active ||
                  this.state.balance_modal_active
                    ? "active"
                    : ""
                }
            `}
            onClick={this.closeModal}
          />
        </div>
      </div>
    );
  }
}
