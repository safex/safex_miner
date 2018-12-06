import React from 'react';
import packageJson from "../../package";
import { CopyToClipboard } from 'react-copy-to-clipboard';

const { shell } = window.require('electron')
const xmrigCpu = window.require('node-xmrig-cpu');
const sa = window.require('safex-addressjs');
const fileDownload = window.require('js-file-download');
const safex = window.require('safex-nodejs-libwallet');
const { dialog } = window.require('electron').remote;
const path = window.require('path');

import {
    verify_safex_address,
    structureSafexKeys,
    openBalanceAlert,
    closeBalanceAlert,
    openSendCashPopup,
    openSendTokenPopup,
    closeSendPopup
} from '../utils/balance';

import BalanceAlert from './partials/BalanceAlert';
import SendModal from './partials/SendModal';
import CreateNewWalletModal from './partials/CreateNewWalletModal';
import OpenFromExistingModal from './partials/OpenFromExistingModal';
import CreateFromKeysModal from './partials/CreateFromKeysModal';
import InstructionsModal from './partials/InstructionsModal';

export default class MiningApp extends React.Component {
    constructor(props) {
        super(props);
        this.miner = null;
        this.state = {
            active: false,
            starting: false,
            stopping: false,
            new_wallet: '',
            new_wallet_generated: false,
            exported: false,
            hashrate: '0',
            address: '',
            pool_url: '',
            modal_active: false,
            instructions_modal_active: false,
            balance_modal_active: false,
            instructions_lang: 'english',
            pools_list: [
                'pool.safexnews.net:1111',
                'safex.cool-pool.net:3333',
                'safex.cnpools.space:3333',
                'safex.cnpools.space:1111',
                'safex.cryptominingpools.net:3333',
                'safex.luckypool.io:3366',
                'safex.xmining.pro:3333'
            ],
            balance: 0,
            unlocked_balance: 0,
            tokens: 0,
            unlocked_tokens: 0,
            balance_wallet: '',
            balance_view_key: '',
            balance_spend_key: '',
            balance_check: false,
            balance_alert: '',
            balance_alert_text: '',
            send_cash: false,
            send_token: false,
            tick_handle: null,

            //wallet state settings
            create_new_wallet_modal: false,
            open_from_existing_modal: false,
            create_from_keys_modal: false,
            wallet: {},
            wallet_loaded: false,
            wallet_exists: false,
            mining_address: '',
            wallet_password: '',
            wallet_path: '',
            spend_key: '',
            view_key: '',

            jsonConfig: {
                "algo": "cryptonight/2",
                "api": {
                    "port": 0,
                    "access-token": null,
                    "worker-id": null,
                    "ipv6": false,
                    "restricted": true
                },
                "av": 0,
                "background": false,
                "colors": true,
                "cpu-affinity": null,
                "cpu-priority": null,
                "donate-level": 5,
                "huge-pages": true,
                "hw-aes": null,
                "log-file": null,
                "max-cpu-usage": 100,
                "pools": [
                    {
                        "url": "",
                        "user": "",
                        "pass": "x",
                        "rig-id": null,
                        "nicehash": false,
                        "keepalive": false,
                        "variant": 1
                    }
                ],
                "print-time": 60,
                "retries": 5,
                "retry-pause": 5,
                "safe": false,
                "threads": null,
                "user-agent": null,
                "watch": false
            }
        };

        this.openInfoPopup = this.openInfoPopup.bind(this);
        this.openModal = this.openModal.bind(this);
        this.openInstructionsModal = this.openInstructionsModal.bind(this);
        this.openBalanceModal = this.openBalanceModal.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this.inputValidate = this.inputValidate.bind(this);
        this.checkInputValueLenght = this.checkInputValueLenght.bind(this);
        this.checkInputValuePrefix = this.checkInputValuePrefix.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.startMining = this.startMining.bind(this);
        this.startBalanceCheck = this.startBalanceCheck.bind(this);
        this.stopMining = this.stopMining.bind(this);
        this.checkStatus = this.checkStatus.bind(this);
        this.newWallet = this.newWallet.bind(this);
        this.footerLink = this.footerLink.bind(this);
        this.exportWallet = this.exportWallet.bind(this);
        this.setOpenBalanceAlert = this.setOpenBalanceAlert.bind(this);
        this.setCloseBalanceAlert = this.setCloseBalanceAlert.bind(this);
        this.setOpenSendCash = this.setOpenSendCash.bind(this);
        this.setOpenSendTokens = this.setOpenSendTokens.bind(this);
        this.setCloseSendPopup = this.setCloseSendPopup.bind(this);
        this.sendCash = this.sendCash.bind(this);
        this.sendToken = this.sendToken.bind(this);
        this.openCreateWalletModal = this.openCreateWalletModal.bind(this);
        this.openFromExistingModal = this.openFromExistingModal.bind(this);
        this.openCreateFromKeysModal = this.openCreateFromKeysModal.bind(this);
        this.closeWallet = this.closeWallet.bind(this);

        //wallet functions
        this.create_new_wallet = this.create_new_wallet.bind(this);
        this.open_from_wallet_file = this.open_from_wallet_file.bind(this);
        this.create_new_wallet_from_keys = this.create_new_wallet_from_keys.bind(this);
    }

    //first step select wallet path, if exists, set password
    //second step set password

    //paste in address start mining
    //create new
    //import -> keys/file

    open_from_wallet_file(e) {
        e.preventDefault();
        const pass = e.target.pass.value;

        if (pass !== '') {
            if (this.state.wallet_loaded) {
                console.log('bla truc')
                this.closeWallet();
            }
            dialog.showOpenDialog((filepath) => {
                if (filepath !== undefined) {
                    this.setState({ wallet_path: filepath });
                    var args = {
                        'path': filepath,
                        'password': pass,
                        'network': 'mainnet',
                        'daemonAddress': 'rpc.safex.io:17402',
                    }

                    safex.openWallet(args)
                        .then((wallet) => {

                            this.setState({
                                wallet_loaded: true,
                                wallet: wallet,
                                mining_address: wallet.address(),
                                spend_key: wallet.secretSpendKey(),
                                view_key: wallet.secretViewKey(),
                            });
                            this.closeModal();
                        })
                        .catch((err) => {
                            this.setOpenBalanceAlert('Error opening the wallet: ' + err);
                        })
                }
            });
        } else {
            this.setOpenBalanceAlert("Enter password for your wallet file");
        }
    }

    create_new_wallet(e) {
        e.preventDefault();

        const pass1 = e.target.pass1.value;
        const pass2 = e.target.pass2.value;
        console.log(e.target.pass1.value);

        if (pass1 !== '' || pass2 !== '') {
            if (pass1 === pass2) {
                if (this.state.wallet_loaded) {
                    this.closeWallet();
                }
                dialog.showSaveDialog((filepath) => {
                    if (filepath !== undefined) {
                        this.setState({ wallet_path: filepath });
                        //TODO needs additional sanitation on the passwords, length and type of data

                        var args = {
                            'path': filepath,
                            'password': pass1,
                            'network': 'mainnet',
                            'daemonAddress': 'rpc.safex.io:17402',
                        }
                        if (!safex.walletExists(filepath)) {
                            this.setState(() => ({
                                wallet_exists: false
                            }));
                            console.log("wallet doesn't exist. creating new one: " + this.state.wallet_path);

                            safex.createWallet(args)
                                .then((wallet) => {
                                    this.setState({
                                        wallet_loaded: true,
                                        wallet: wallet,
                                        mining_address: wallet.address(),
                                        spend_key: wallet.secretSpendKey(),
                                        view_key: wallet.secretViewKey(),
                                    });
                                    console.log('wallet address  ' + wallet.address());
                                    console.log('wallet view private key  ' + wallet.secretViewKey());
                                    console.log('wallet spend private key  ' + wallet.secretSpendKey());
                                    this.closeModal();
                                })
                                .catch((err) => {
                                    this.setOpenBalanceAlert('error with the creation of the wallet ' + err);
                                });
                        } else {
                            this.setOpenBalanceAlert("Wallet already exists. Please choose a different file name  " +
                                "this application does not enable overwriting an existing wallet file " +
                                "OR you can open it using the Load Existing Wallet");
                        }
                    }
                });
            } else {
                this.setOpenBalanceAlert('Repeated password does not match');
            }
            //pass dialog box
            //pass password
            //confirm password
        } else {
            this.setOpenBalanceAlert("Fill out all the fields");
        }
    }

    create_new_wallet_from_keys(e) {
        e.preventDefault();

        //here we need the key set
        //the wallet path desired
        //the password
        var safex_address = e.target.address.value;
        var view_key = e.target.viewkey.value;
        var spend_key = e.target.spendkey.value;
        var pass1 = e.target.pass1.value;
        var pass2 = e.target.pass2.value;

        if (safex_address !== '' || view_key !== '' || spend_key !== '' || pass1 !== '' || pass2 !== '') {
            if (pass1 !== '' && pass2 !== '' && pass1 === pass2) {
                if (verify_safex_address(spend_key, view_key, safex_address)) {
                    if (this.state.wallet_loaded) {
                        this.closeWallet();
                    }
                    dialog.showSaveDialog((filepath) => {
                        if (filepath !== undefined) {
                            this.setState({ wallet_path: filepath });
                            var args = {
                                'path': this.state.wallet_path,
                                'password': pass1,
                                'network': 'mainnet',
                                'daemonAddress': 'rpc.safex.io:17402',
                                'restoreHeight': 0,
                                'addressString': safex_address,
                                'viewKeyString': view_key,
                                'spendKeyString': spend_key
                            }
                            if (!safex.walletExists(filepath)) {
                                this.setState(() => ({
                                    wallet_exists: false
                                }));
                                console.log("wallet doesn't exist. creating new one: " + this.state.wallet_path);

                                safex.createWalletFromKeys(args)
                                    .then((wallet) => {
                                        this.setState({
                                            wallet_loaded: true,
                                            wallet: wallet,
                                            mining_address: wallet.address(),
                                            spend_key: wallet.secretSpendKey(),
                                            view_key: wallet.secretViewKey(),
                                        });
                                        console.log('wallet address  ' + wallet.address());
                                        console.log('wallet view private key  ' + wallet.secretViewKey());
                                        console.log('wallet spend private key  ' + wallet.secretSpendKey());
                                        this.closeModal();
                                    })
                                    .catch((err) => {
                                        this.setOpenBalanceAlert('Error with the creation of the wallet ' + err);
                                    });
                            } else {
                                this.setOpenBalanceAlert("Wallet already exists. Please choose a different file name  " +
                                    "this application does not enable overwriting an existing wallet file " +
                                    "OR you can open it using the Load Existing Wallet");
                            }
                        }
                    });
                } else {
                    console.log('Incorrect keys');
                    this.setOpenBalanceAlert('Incorrect keys');
                }
            } else {
                this.setOpenBalanceAlert("Passwords do not match");
            }
        } else {
            this.setOpenBalanceAlert("Fill out all the fields");
        }
    }

    closeWallet() {
        this.state.wallet.pauseRefresh();
        this.state.wallet.off();
        this.state.wallet.close(true);
        this.state.wallet_loaded = false;
        clearTimeout(this.state.tick_handle);

        console.log('wallet closed')
    }

    openInfoPopup(message) {
        this.setState({
            mining_info: true,
            mining_info_text: message
        })
    }

    openModal() {
        this.setState(() => ({
            modal_active: true
        }));
    }

    openInstructionsModal() {
        this.setState(() => ({
            instructions_modal_active: true
        }));
    }

    startBalanceCheck() {
        if (this.state.wallet_loaded) {
            console.log(this.state.wallet)

            var wallet = this.state.wallet;
            this.setState(() => ({
                balance_wallet: wallet.address()
            }));

            const nextTick = () => {
                if (this.state.wallet_loaded) {
                    this.setState(() => ({
                        balance: Math.floor(parseFloat(wallet.balance()) / 100000000) / 100,
                        unlocked_balance: Math.floor(parseFloat(wallet.unlockedBalance()) / 100000000) / 100,
                        tokens: Math.floor(parseFloat(wallet.tokenBalance()) / 100000000) / 100,
                        unlocked_tokens: Math.floor(parseFloat(wallet.unlockedTokenBalance()) / 100000000) / 100,
                    }));
                    console.log("balance: " + Math.floor(parseFloat(wallet.balance()) / 100000000) / 100);
                    console.log("unlocked balance: " + Math.floor(parseFloat(wallet.unlockedBalance()) / 100000000) / 100);
                    console.log("token balance: " + Math.floor(parseFloat(wallet.tokenBalance()) / 100000000) / 100);
                    console.log("unlocked token balance: " + Math.floor(parseFloat(wallet.unlockedTokenBalance()) / 100000000) / 100);
                    console.log("blockchain height" + wallet.blockchainHeight());
                    console.log('connected: ' + wallet.connected());

                    this.state.tick_handle = setTimeout(nextTick, 10000);
                }
            }

            var lastHeight = 0;
            console.log("balance address: " + wallet.address());
            console.log("seed: " + wallet.seed());

            wallet.on('newBlock', (height) => {
                if (height - lastHeight > 60) {
                    if (wallet.synchronized()) {
                        console.log('got here')
                        this.setCloseBalanceAlert()
                    } else {
                        this.setOpenBalanceAlert('Please wait while blockchain is being updated, height ' + height);
                    }
                    console.log('wallet synchronized: ' + wallet.synchronized())
                    console.log("blockchain updated, height: " + height);
                    console.log('balance ' + wallet.balance());
                    lastHeight = height;
                }
            });

            wallet.on('refreshed', () => {
                console.log("wallet refreshed");
                console.log('wallet synchronized: ' + wallet.synchronized())

                wallet.store()
                    .then(() => {
                        console.log("Wallet stored");
                    })
                    .catch((e) => {
                        console.log("Unable to store wallet: " + e)
                    })
            });

            // wallet.on('updated', function () {
            //     console.log("updated");
            // });

            // wallet.on('unconfirmedMoneyReceived', function (tx, amount) {
            //     console.log("unconfirmed money received. tx: " + tx + ", amount: " + amount);
            // });

            // wallet.on('moneyReceived', function (tx, amount) {
            //     console.log("money received. tx: " + tx + ", amount: " + amount);
            // });

            // wallet.on('moneySpent', function (tx, amount) {
            //     console.log("money spent. tx: " + tx + ", amount: " + amount);
            // });

            // wallet.on('unconfirmedTokensReceived', function (tx, token_amount) {
            //     console.log("unconfirmed tokens received. tx: " + tx + ", token amount: " + token_amount);
            // });

            // wallet.on('tokensReceived', function (tx, token_amount) {
            //     console.log("tokens received. tx: " + tx + ", token amount: " + token_amount);
            // });

            // wallet.on('tokensSpent', function (tx, token_amount) {
            //     console.log("tokens spent. tx: " + tx + ", token amount: " + token_amount);
            // });

            nextTick();
        }
    }

    openCreateWalletModal() {
        this.setState(() => ({
            create_new_wallet_modal: true
        }));
    }

    openFromExistingModal() {
        this.setState(() => ({
            open_from_existing_modal: true
        }));
    }

    openCreateFromKeysModal() {
        this.setState(() => ({
            create_from_keys_modal: true
        }));
    }

    openBalanceModal() {
        this.setState(() => ({
            balance_modal_active: true
        }));
        if (this.state.wallet_loaded) {
            this.startBalanceCheck();
        }
    }

    setOpenBalanceAlert(alert) {
        openBalanceAlert(this, alert);
    }

    setCloseBalanceAlert() {
        closeBalanceAlert(this);
    }

    setOpenSendCash() {
        openSendCashPopup(this);
    }

    setOpenSendTokens() {
        openSendTokenPopup(this);
    }

    setCloseSendPopup() {
        closeSendPopup(this);
    }

    sendCash(e) {
        e.preventDefault();
        let sendingAddress = e.target.send_to.value;
        let amount = e.target.amount.value * 10000000000;
        let wallet = this.state.wallet;

        if (sendingAddress !== '' || amount !== '') {
            wallet.createTransaction({
                'address': sendingAddress,
                'amount': amount,
                'tx_type': 0 // cash transaction
            }).then((tx) => {
                console.log("Cash transaction created: " + tx.transactionsIds());

                tx.commit().then(() => {
                    console.log("Transaction commited successfully");
                    this.setCloseSendPopup();
                    this.setOpenBalanceAlert('Transaction commited successfully');

                }).catch((e) => {
                    console.log("Error on commiting transaction: " + e);
                    this.setOpenBalanceAlert("Error on commiting transaction: " + e);
                });
            }).catch((e) => {
                console.log("Couldn't create transaction: " + e);
                this.setOpenBalanceAlert("Couldn't create transaction: " + e);
            });
        } else {
            this.setOpenBalanceAlert('Fill out all the fields');
        }
    }

    sendToken(e) {
        e.preventDefault();
        let sendingAddress = e.target.send_to.value;
        let amount = Math.floor(e.target.amount.value) * 10000000000;
        let wallet = this.state.wallet;

        if (sendingAddress !== '' || amount !== '') {
            console.log(amount)
            wallet.createTransaction({
                'address': sendingAddress,
                'amount': amount,
                'tx_type': 1 // token transaction
            }).then((tx) => {
                console.log("Cash transaction created: " + tx.transactionsIds());

                tx.commit().then(() => {
                    console.log("Transaction commited successfully");
                    this.setCloseSendPopup();
                    this.setOpenBalanceAlert('Transaction commited successfully');

                }).catch((e) => {
                    console.log("Error on commiting transaction: " + e);
                    this.setOpenBalanceAlert("Error on commiting transaction: " + e);
                });
            }).catch((e) => {
                console.log("Couldn't create transaction: " + e);
                this.setOpenBalanceAlert("Couldn't create transaction: " + e);
            });
        } else {
            this.setOpenBalanceAlert('Fill out all the fields');
        }
    }

    closeModal() {
        this.setState(() => ({
            modal_active: false,
            instructions_modal_active: false,
            balance_modal_active: false,
            balance_alert: false,
            balance_alert: false,
            send_cash: false,
            send_token: false,
            create_new_wallet_modal: false,
            open_from_existing_modal: false,
            create_from_keys_modal: false
        }));
    }

    changeInstructionLang(lang) {
        this.setState(() => ({
            instructions_lang: lang
        }));
    }

    inputValidate(inputValue) {
        let inputRegex = /^[a-zA-Z0-9]/;
        return inputRegex.test(inputValue);
    }

    checkInputValueLenght(inputValue) {
        let inputValueLength = inputValue.length;

        if (inputValueLength <= 95) {
            console.log('Safex hash address length is too short');
            this.openInfoPopup('Address length is too short');
            return false;
        } else if (inputValueLength >= 105) {
            console.log('Safex hash address length is too long');
            this.openInfoPopup('Address length is too long');
            return false;
        } else {
            return true;
        }
    }

    checkInputValuePrefix(inputValue) {
        let userInputValue = inputValue;

        if (userInputValue.startsWith("SFXt") || userInputValue.startsWith("Safex")) {
            if (!userInputValue.startsWith("SFXts") || !userInputValue.startsWith("SFXti")) {
                return true;
            } else {
                console.log('Suffix is invalid');
                return false;
            }
        } else {
            console.log('Suffix is invalid');
            return false;
        }
    }

    handleSubmit(e) {
        e.preventDefault();
        var user_wallet = e.target.user_wallet;
        let inputValue = e.target.user_wallet.value;

        if (user_wallet.value !== '') {
            if (this.inputValidate(inputValue))
                if (this.checkInputValueLenght(inputValue)) {
                    if (this.checkInputValuePrefix(inputValue)) {
                        if (this.state.active) {
                            this.setState(() => ({
                                active: false,
                                stopping: true
                            }));
                            this.openInfoPopup('Stopping miner...');
                            setTimeout(() => {
                                this.setState(() => ({
                                    mining_info: false,
                                    mining_info_text: '',
                                    stopping: false
                                }));
                            }, 5000);
                            this.stopMining();
                        } else {
                            this.setState(() => ({
                                active: true,
                                starting: true
                            }));
                            this.openInfoPopup('Starting miner...');
                            setTimeout(() => {
                                this.setState(() => ({
                                    starting: false
                                }));
                                this.openInfoPopup('Mining in progress');
                            }, 12000);
                            this.startMining();
                        }
                    } else {
                        this.openInfoPopup('Your address must start with Safex or SFXt');
                    }
                } else {
                    console.log('Address length is not valid')
                }
            else {
                this.openInfoPopup('Please enter valid address');
            }
        } else {
            this.openInfoPopup('Please enter valid address');
        }
    }

    startMining() {
        var userWallet = document.getElementById("user_wallet").value;
        var pool = document.getElementById("pool").value;
        var maxCpuUsage = document.getElementById("cpuUsage").value;

        //specify jsonConfig.pools[0].url, jsonConfig.pools[0].user (safex address)
        this.state.jsonConfig.pools[0].url = pool;
        this.state.jsonConfig.pools[0].user = userWallet;
        this.state.jsonConfig["max-cpu-usage"] = maxCpuUsage;

        console.log("User address: " + userWallet);
        console.log("Pool: " + pool);
        console.log("CPU usage: " + maxCpuUsage);

        console.log("Starting mining...");
        if (this.miner) {
            this.miner.reloadConfig(JSON.stringify(this.state.jsonConfig));
        } else {
            this.miner = new xmrigCpu.NodeXmrigCpu(JSON.stringify(this.state.jsonConfig));
        }
        this.miner.startMining();
        console.log("Native mining started!");

        let checkStatusInterval = setInterval(this.checkStatus, 2000);
        this.setState({
            checkStatusInterval: checkStatusInterval,
        })
    }

    stopMining() {
        console.log("Ending mining...");
        clearInterval(this.state.checkStatusInterval);
        this.setState(() => ({
            hashrate: 0
        }));
        this.miner.stopMining();
        console.log("Mining ended");
    }

    checkStatus() {
        this.setState({
            hashrate: this.miner.getStatus().split(' ')[2]
        });
        console.log(this.miner.getStatus(), this.state.hashrate);
    }

    newWallet() {
        const seed = sa.sc_reduce32(sa.rand_32());
        const keys = sa.create_address(seed);
        const pubkey = sa.pubkeys_to_string(keys.spend.pub, keys.view.pub);

        localStorage.setItem('wallet', JSON.stringify(keys));

        this.setState(() => ({
            exported: false,
            new_wallet_generated: true,
            new_wallet: pubkey,
            spendkey_sec: keys.spend.sec,
            viewkey_sec: keys.view.sec,
        }));
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

    footerLink() {
        shell.openExternal('https://www.safex.io/')
    }

    render() {
        var cores_options = [];
        for (var i = 25; i <= 100; i += 25) {
            cores_options.push(<option key={i} value={i}>{i}%</option>);
        }
        cores_options.reverse();

        const pools_list = this.state.pools_list.map((pool, index) => (
            <option key={index} id={index}>
                {pool}
            </option>
        ));

        return (
            <div className="mining-app-wrap">
                <div className="mining-bg-wrap">
                    <img className={this.state.active || this.state.stopping ? "rotating" : ""} src="images/circles.png" alt="Circles" />
                </div>
                <header className="animated fadeIn">
                    <img src="images/logo.png" alt="Logo" />
                    <p className="animated fadeIn">{packageJson.version}</p>
                </header>

                <div className="main animated fadeIn">
                    <div className="btns-wrap">
                        <button className="button-shine modal-btn hidden" onClick={this.openModal}
                            title="Generate New Wallet">
                            <img src="images/new.png" alt="open-logo" />
                        </button>
                        <button className="button-shine modal-btn" onClick={this.openCreateWalletModal}
                            title="Create New Wallet File">
                            <img src="images/new-wallet.png" alt="new-wallet" />
                        </button>
                        <button className="button-shine modal-btn" onClick={this.openFromExistingModal}
                            title="Open Wallet File">
                            <img src="images/open-logo.png" alt="open-logo" />
                        </button>
                        <button className="button-shine modal-btn" onClick={this.openCreateFromKeysModal}
                            title="Create New Wallet From Keys">
                            <img src="images/create-from-keys.png" alt="open-logo" />
                        </button>
                        <button className="button-shine balance-wallet-btn modal-btn" onClick={this.openBalanceModal}
                            title="Check Balance">
                            <img src="images/key.png" alt="key" />
                        </button>
                        <button className="button-shine instructions-btn modal-btn" onClick={this.openInstructionsModal}
                            title="Instructions">
                            ?
                        </button>
                    </div>

                    <form onSubmit={this.handleSubmit}>
                        <div className="address-wrap">
                            <img src="images/line-left.png" alt="Line Left" />
                            <input type="text" value={this.state.mining_address} placeholder="Safex address"
                                name="user_wallet" id="user_wallet" readOnly
                                disabled={this.state.active ? "disabled" : ""} />
                            <img src="images/line-right.png" alt="Line Right" />
                        </div>

                        <select className="pool-url" name="pool" id="pool" disabled={this.state.active ? "disabled" : ""}>
                            {pools_list}
                        </select>

                        <div className="options">
                            <div className="input-group">
                                <p># CPU</p>
                                <select className="form-control" name="cores" id="cpuUsage"
                                    disabled={this.state.active ? "disabled" : ""}>
                                    {cores_options}
                                </select>
                            </div>
                        </div>
                        {
                            this.state.active
                                ?
                                <div>
                                    {
                                        this.state.starting
                                            ?
                                            <button type="submit" className="submit button-shine active" disabled>
                                                Starting
                                            </button>
                                            :
                                            <button type="submit" className="submit button-shine active">
                                                Stop
                                            </button>
                                    }
                                </div>

                                :
                                <div>
                                    {
                                        this.state.stopping
                                            ?
                                            <button type="submit" className="submit button-shine active"
                                                disabled={this.state.active || this.state.stopping ? "disabled" : ""}>
                                                <span>Stopping</span>
                                            </button>
                                            :
                                            <button type="submit" className="submit button-shine"
                                                disabled={this.state.active || this.state.stopping ? "disabled" : ""}>
                                                <span>Start</span>
                                            </button>
                                    }
                                </div>
                        }
                        <p className={this.state.mining_info ? "mining-info active" : "mining-info"}>
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

                <div className={this.state.modal_active ? 'modal active' : 'modal'}>
                    <span className="close" onClick={this.closeModal}>X</span>
                    <button id="new-wallet" className="button-shine" onClick={this.newWallet}>
                        Generate new wallet
                    </button>

                    <div className="form-group">
                        <label htmlFor="new-address">Your new wallet address:</label>
                        <textarea placeholder="New Wallet Address" value={this.state.new_wallet} rows="2"
                            onChange={({ target: { value } }) => this.setState({ value, copied: false })} readOnly>

                        </textarea>
                        <div className={this.state.new_wallet_generated ? "spendview active" : "spendview"}>
                            {
                                this.state.copied
                                    ?
                                    <CopyToClipboard text={this.state.new_wallet}
                                        onCopy={() => this.setState({ copied: true })}
                                        className="button-shine copy-btn"
                                        disabled={this.state.new_wallet === '' ? "disabled" : ""}>
                                        <button>
                                            Copied Address
                                        </button>
                                    </CopyToClipboard>
                                    :
                                    <CopyToClipboard text={this.state.new_wallet}
                                        onCopy={() => this.setState({ copied: true })}
                                        className="button-shine copy-btn"
                                        disabled={this.state.new_wallet === '' ? "disabled" : ""}>
                                        <button>
                                            Copy Address
                                        </button>
                                    </CopyToClipboard>
                            }

                            {
                                this.state.exported
                                    ?
                                    <h5 className="warning green">
                                        Wallet keys have been successfuly saved.
                                        Please do not share your keys with others and keep them safe at all times.
                                        Good luck!
                                    </h5>
                                    :
                                    <h5 className="warning red">
                                        The following keys are to control your coins, do not share them.
                                        Keep your keys for yourself only!
                                        Before you proceed to mine please save your keys now.
                                    </h5>
                            }

                            <h5>Secret Spendkey</h5>
                            <p>{this.state.spendkey_sec}</p>

                            <h5>Secret Viewkey</h5>
                            <p>{this.state.viewkey_sec}</p>

                            {
                                this.state.exported
                                    ?
                                    <button className="save-btn green" onClick={this.exportWallet}>
                                        Wallet Keys Saved
                                    </button>
                                    :
                                    <button className="save-btn" onClick={this.exportWallet}>
                                        Save Wallet Keys
                                    </button>
                            }
                        </div>
                    </div>
                </div>

                <div className={this.state.balance_modal_active ? 'modal balance-modal active' : 'modal balance-modal'}>
                    <span className="close" onClick={this.closeModal}>X</span>
                    <h3>Check Balance</h3>

                    {
                        this.state.wallet_loaded
                            ?
                            <div className="wallet-exists">
                                {/* <button className="back" onClick={this.refreshBalance}>Refresh</button> */}
                                <label htmlFor="selected_balance_address">Safex Wallet Address</label>
                                <textarea placeholder="Safex Wallet Address" name="selected_balance_address"
                                    value={this.state.balance_wallet} rows="2" readOnly />

                                <div className="groups-wrap">
                                    <div className="form-group">
                                        <label htmlFor="balance">Balance</label>
                                        <input type="text" placeholder="Balance" name="balance"
                                            value={this.state.balance} readOnly />
                                        <label htmlFor="unlocked_balance">Unlocked Balance</label>
                                        <input type="text" placeholder="Unlocked balance" name="unlocked_balance"
                                            value={this.state.unlocked_balance} readOnly />
                                        <button onClick={this.setOpenSendCash}>Send Cash</button>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="tokens">Tokens</label>
                                        <input type="text" placeholder="Tokens" value={this.state.tokens} readOnly />
                                        <label htmlFor="unlocked_tokens">Unlocked Tokens</label>
                                        <input type="text" placeholder="Unlocked Tokens" name="unlocked_tokens"
                                            value={this.state.unlocked_tokens} readOnly />
                                        <button onClick={this.setOpenSendTokens}>Send Tokens</button>
                                    </div>
                                </div>
                            </div>
                            :
                            <div className="no-wallet">
                                <h4>Please load the wallet file</h4>
                            </div>
                    }

                    <BalanceAlert
                        balanceAlert={this.state.balance_alert}
                        balanceAlertText={this.state.balance_alert_text}
                        closeBalanceAlert={this.setCloseBalanceAlert}
                    />

                    <SendModal
                        send_cash={this.state.send_cash}
                        send_token={this.state.send_token}
                        fromAddress={this.state.balance_wallet}
                        closeSendPopup={this.setCloseSendPopup}
                        sendCash={this.sendCash}
                        sendToken={this.sendToken}
                    />
                </div>

                <InstructionsModal
                    instructionsModalActive={this.state.instructions_modal_active}
                    instructionsLang={this.state.instructions_lang}
                    changeInstructionLangEn={this.changeInstructionLang.bind(this, 'english')}
                    changeInstructionLangSrb={this.changeInstructionLang.bind(this, 'serbian')}
                    closeInstructionsModal={this.closeModal}
                />

                <CreateNewWalletModal
                    createNewWalletModal={this.state.create_new_wallet_modal}
                    closeNewWalletModal={this.closeModal}
                    createNewWallet={this.create_new_wallet}
                    balanceAlert={this.state.balance_alert}
                    balanceAlertText={this.state.balance_alert_text}
                    closeBalanceAlert={this.setCloseBalanceAlert}
                />

                <OpenFromExistingModal
                    openFromExistingModal={this.state.open_from_existing_modal}
                    closeFromExistingModal={this.closeModal}
                    openFromWalletFile={this.open_from_wallet_file}
                    balanceAlert={this.state.balance_alert}
                    balanceAlertText={this.state.balance_alert_text}
                    closeBalanceAlert={this.setCloseBalanceAlert}
                />

                <CreateFromKeysModal
                    openCreateFromKeysModal={this.state.create_from_keys_modal}
                    closeCreateFromKeysModal={this.closeModal}
                    createNewWalletFromKeys={this.create_new_wallet_from_keys}
                    balanceAlert={this.state.balance_alert}
                    balanceAlertText={this.state.balance_alert_text}
                    closeBalanceAlert={this.setCloseBalanceAlert}
                />

                <div
                    className={this.state.modal_active || this.state.instructions_modal_active || this.state.balance_modal_active ? 'backdrop active' : 'backdrop'}
                    onClick={this.closeModal}>
                </div>
            </div>
        );
    }
}

MiningApp.contextTypes = {
    router: React.PropTypes.object.isRequired
};
