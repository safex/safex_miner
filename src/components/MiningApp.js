import React from 'react';
import packageJson from "../../package";

const { shell } = window.require('electron')
const xmrigCpu = window.require('node-xmrig-cpu');
const fileDownload = window.require('js-file-download');
const safex = window.require('safex-nodejs-libwallet');
const { dialog } = window.require('electron').remote;
const path = window.require('path');

import {
    verify_safex_address,
    openBalanceAlert,
    closeBalanceAlert,
    openSendCashPopup,
    openSendTokenPopup,
    closeSendPopup
} from '../utils/balance';

import BalanceAlert from './partials/BalanceAlert';
import SendModal from './partials/SendModal';
import CreateNewWalletModal from './partials/CreateNewWalletModal';
import OpenExistingWalletModal from './partials/OpenExistingWalletModal';
import CreateFromKeysModal from './partials/CreateFromKeysModal';
import InstructionsModal from './partials/InstructionsModal';

// Testnet conf
// let net = 'testnet';
// let daemonHostPort = '192.168.1.22:29393';

// Mainnet conf
let net = 'mainnet';
let daemonHostPort = 'rpc.safex.io:17402';

export default class MiningApp extends React.Component {
    constructor(props) {
        super(props);
        this.miner = null;
        this.state = {
            //mining settings
            active: false,
            starting: false,
            stopping: false,
            new_wallet: '',
            new_wallet_generated: false,
            exported: false,
            hashrate: '0',
            address: '',
            pool_url: '',
            pools_list: [
                'pool.safexnews.net:1111',
                'safex.cool-pool.net:3333',
                'safex.cnpools.space:3333',
                'safex.cnpools.space:1111',
                'safex.cryptominingpools.net:3333',
                'safex.luckypool.io:3366',
                'safex.xmining.pro:3333'
            ],
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
            },

            //UI settings 
            modal_active: false,
            modal_close_disabled: false,
            instructions_modal_active: false,
            balance_modal_active: false,
            balance_alert_close_disabled: false,
            instructions_lang: 'english',

            //balance settings
            balance: 0,
            unlocked_balance: 0,
            tokens: 0,
            unlocked_tokens: 0,
            balance_wallet: '',
            balance_view_key: '',
            balance_spend_key: '',
            balance_alert: false,
            open_file_alert: false,
            create_new_wallet_alert: false,
            create_from_keys_alert: false,
            balance_alert_text: '',
            send_cash: false,
            send_token: false,
            tick_handle: null,

            //wallet state settings
            wallet: {},
            wallet_connected: false,
            blockchain_height: 0,
            wallet_sync: false,
            wallet_being_created: false,
            create_new_wallet_modal: false,
            open_from_existing_modal: false,
            create_from_keys_modal: false,
            wallet_loaded: false,
            wallet_exists: false,
            mining_address: '',
            wallet_password: '',
            wallet_path: '',
            spend_key: '',
            view_key: ''
        };

        //mining functions
        this.openInfoPopup = this.openInfoPopup.bind(this);
        this.openInstructionsModal = this.openInstructionsModal.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.startMining = this.startMining.bind(this);
        this.stopMining = this.stopMining.bind(this);
        this.checkStatus = this.checkStatus.bind(this);

        //UI functions
        this.openModal = this.openModal.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this.footerLink = this.footerLink.bind(this);

        //balance functions
        this.openBalanceModal = this.openBalanceModal.bind(this);
        this.startBalanceCheck = this.startBalanceCheck.bind(this);
        this.setOpenBalanceAlert = this.setOpenBalanceAlert.bind(this);
        this.setCloseBalanceAlert = this.setCloseBalanceAlert.bind(this);
        this.rescanBalance = this.rescanBalance.bind(this);
        this.roundBalanceAmount = this.roundBalanceAmount.bind(this);
        this.refreshCallback = this.refreshCallback.bind(this);
        this.updatedCallback = this.updatedCallback.bind(this);
        this.newBlockCallback = this.newBlockCallback.bind(this);

        //wallet functions
        this.create_new_wallet = this.create_new_wallet.bind(this);
        this.open_from_wallet_file = this.open_from_wallet_file.bind(this);
        this.create_new_wallet_from_keys = this.create_new_wallet_from_keys.bind(this);
        this.setOpenSendCash = this.setOpenSendCash.bind(this);
        this.setOpenSendTokens = this.setOpenSendTokens.bind(this);
        this.setCloseSendPopup = this.setCloseSendPopup.bind(this);
        this.sendCash = this.sendCash.bind(this);
        this.sendToken = this.sendToken.bind(this);
        this.openCreateWalletModal = this.openCreateWalletModal.bind(this);
        this.openFromExistingModal = this.openFromExistingModal.bind(this);
        this.openCreateFromKeysModal = this.openCreateFromKeysModal.bind(this);
        this.closeWallet = this.closeWallet.bind(this);
        this.exportWallet = this.exportWallet.bind(this);
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
                this.closeWallet();
            }
            dialog.showOpenDialog((filepath) => {
                if (filepath !== undefined) {
                    this.setState({
                        wallet_path: filepath,
                        modal_close_disabled: true
                    });

                    var args = {
                        'path': filepath,
                        'password': pass,
                        'network': net,
                        'daemonAddress': daemonHostPort,
                    }
                    this.setOpenBalanceAlert('Please wait while your wallet file is loaded', 'open_file_alert', true);

                    safex.openWallet(args)
                        .then((wallet) => {
                            this.setState({
                                wallet_loaded: true,
                                wallet: wallet,
                                mining_address: wallet.address(),
                                spend_key: wallet.secretSpendKey(),
                                view_key: wallet.secretViewKey(),
                                modal_close_disabled: false,
                                mining_info: false
                            });
                            this.closeModal();
                            console.log("wallet loaded " + this.state.wallet_loaded)
                        })
                        .catch((err) => {
                            this.setState(() => ({
                                modal_close_disabled: false
                            }));
                            this.setOpenBalanceAlert('Error opening the wallet: ' + err, 'open_file_alert', false);
                        })
                }
            });
        } else {
            this.setOpenBalanceAlert("Enter password for your wallet file", 'open_file_alert', false);
        }
    }

    create_new_wallet(e) {
        e.preventDefault();

        const pass1 = e.target.pass1.value;
        const pass2 = e.target.pass2.value;
        console.log("new wallet password: " + e.target.pass1.value);

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
                            'network': net,
                            'daemonAddress': daemonHostPort,
                        }
                        if (!safex.walletExists(filepath)) {
                            this.setState(() => ({
                                wallet_exists: false,
                                modal_close_disabled: true
                            }));
                            this.setOpenBalanceAlert('Please wait while your wallet file is being created', 'create_new_wallet_alert', true);
                            console.log("wallet doesn't exist. creating new one: " + this.state.wallet_path);

                            safex.createWallet(args)
                                .then((wallet) => {
                                    this.setState({
                                        wallet_loaded: true,
                                        wallet: wallet,
                                        mining_address: wallet.address(),
                                        spend_key: wallet.secretSpendKey(),
                                        view_key: wallet.secretViewKey(),
                                        modal_close_disabled: false,
                                        mining_info: false
                                    });
                                    console.log('wallet address  ' + this.state.mining_address);
                                    console.log('wallet spend private key  ' + this.state.spend_key);
                                    console.log('wallet view private key  ' + this.state.view_key);
                                    this.closeModal();
                                })
                                .catch((err) => {
                                    this.setOpenBalanceAlert('error with the creation of the wallet ' + err, 'create_new_wallet_alert', false);
                                });
                        } else {
                            this.setState(() => ({
                                modal_close_disabled: false
                            }));
                            this.setOpenBalanceAlert("Wallet already exists. Please choose a different file name  " +
                                "this application does not enable overwriting an existing wallet file " +
                                "OR you can open it using the Load Existing Wallet", 'create_new_wallet_alert', false);
                        }
                    }
                });
            } else {
                this.setOpenBalanceAlert('Repeated password does not match', 'create_new_wallet_alert', false);
            }
            //pass dialog box
            //pass password
            //confirm password
        } else {
            this.setOpenBalanceAlert("Fill out all the fields", 'create_new_wallet_alert', false);
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
                if (net == 'testnet' || verify_safex_address(spend_key, view_key, safex_address)) {
                    if (this.state.wallet_loaded) {
                        this.closeWallet();
                    }
                    dialog.showSaveDialog((filepath) => {
                        if (filepath !== undefined) {
                            this.setState({ wallet_path: filepath });
                            var args = {
                                'path': this.state.wallet_path,
                                'password': pass1,
                                'network': net,
                                'daemonAddress': daemonHostPort,
                                'restoreHeight': 0,
                                'addressString': safex_address,
                                'viewKeyString': view_key,
                                'spendKeyString': spend_key
                            }
                            if (!safex.walletExists(filepath)) {
                                this.setState(() => ({
                                    wallet_exists: false,
                                    modal_close_disabled: true
                                }));
                                this.setOpenBalanceAlert('Please wait while your wallet file is being created', 'create_from_keys_alert', true);
                                console.log("wallet doesn't exist. creating new one: " + this.state.wallet_path);

                                safex.createWalletFromKeys(args)
                                    .then((wallet) => {
                                        console.log("Create wallet form keys performed!");
                                        this.setState({
                                            wallet_loaded: true,
                                            wallet: wallet,
                                            mining_address: wallet.address(),
                                            spend_key: wallet.secretSpendKey(),
                                            view_key: wallet.secretViewKey(),
                                            modal_close_disabled: false,
                                            mining_info: false
                                        });
                                        console.log('wallet address  ' + this.state.mining_address);
                                        console.log('wallet spend private key  ' + this.state.spend_key);
                                        console.log('wallet view private key  ' + this.state.view_key);
                                        this.closeModal();
                                        console.log("create_new_wallet_from_keys checkpoint 1");
                                    })
                                    .catch((err) => {
                                        console.log("Create wallet form keys failed!");
                                        this.setOpenBalanceAlert('Error with the creation of the wallet ' + err, 'create_from_keys_alert', false);
                                    });
                            } else {
                                console.log("Safex wallet exists!");
                                this.setState(() => ({
                                    modal_close_disabled: false
                                }));
                                this.setOpenBalanceAlert("Wallet already exists. Please choose a different file name  " +
                                    "this application does not enable overwriting an existing wallet file " +
                                    "OR you can open it using the Load Existing Wallet", 'create_from_keys_alert', false);
                            }
                        }
                    });
                    console.log("create_new_wallet_from_keys checkpoint 2");
                } else {
                    console.log('Incorrect keys');
                    this.setOpenBalanceAlert('Incorrect keys', 'create_from_keys_alert', false);
                }
            } else {
                this.setOpenBalanceAlert("Passwords do not match", 'create_from_keys_alert', false);
            }
        } else {
            this.setOpenBalanceAlert("Fill out all the fields", 'create_from_keys_alert', false);
        }
    }

    closeWallet() {
        if (this.state.wallet_loaded) {
            this.state.wallet.pauseRefresh();
            this.state.wallet.off();
            this.state.wallet.close(true);
            this.state.wallet_loaded = false;
            clearTimeout(this.state.tick_handle);

            console.log('wallet closed')
        }
    }

    updatedCallback() {
        console.log("UPDATED");
        this.state.wallet.store()
            .then(() => {
                console.log("Wallet stored");
                this.setCloseBalanceAlert();
            })
            .catch((e) => {
                console.log("Unable to store wallet: " + e)
            })
    }

    refreshCallback() {
        console.log("wallet refreshed");
        let wallet = this.state.wallet;
        this.setState(() => ({
            modal_close_disabled: false,
            balance_alert_close_disabled: false,
            balance: this.roundBalanceAmount(wallet.balance()),
            unlocked_balance: this.roundBalanceAmount(wallet.unlockedBalance()),
            tokens: this.roundBalanceAmount(wallet.tokenBalance()),
            unlocked_tokens: this.roundBalanceAmount(wallet.unlockedTokenBalance()),
            blockchain_height: wallet.blockchainHeight(),
            wallet_connected: wallet.connected() === "connected"
        }));

        wallet.store()
            .then(() => {
                console.log("Wallet stored");
                this.setCloseBalanceAlert();
            })
            .catch((e) => {
                console.log("Unable to store wallet: " + e);
                this.setOpenBalanceAlert("Unable to store wallet: " + e, 'balance_alert', false);
            });

        wallet.off('refreshed');

        setTimeout(() => {
          wallet.on('newBlock', this.newBlockCallback);
          wallet.on('updated', this.updatedCallback);
        }, 300);
    }

    newBlockCallback(height){
        let wallet = this.state.wallet;
        let syncedHeight = wallet.daemonBlockchainHeight() - height < 10;
        if (syncedHeight) {
            console.log("syncedHeight up to date...");
            if (wallet.synchronized()) {
                console.log("newBlock wallet synchronized, setting state...");
                this.setState(() => ({
                    wallet_sync: true,
                    modal_close_disabled: false,
                    balance_alert_close_disabled: false,
                    balance: this.roundBalanceAmount(wallet.balance()),
                    unlocked_balance: this.roundBalanceAmount(wallet.unlockedBalance()),
                    tokens: this.roundBalanceAmount(wallet.tokenBalance()),
                    unlocked_tokens: this.roundBalanceAmount(wallet.unlockedTokenBalance()),
                    blockchain_height: wallet.blockchainHeight()
                }));
            }
        }
    }

    startBalanceCheck() {
        if (this.state.wallet_loaded) {
            let wallet = this.state.wallet;
            console.log("daemon blockchain height: " + wallet.daemonBlockchainHeight());
            console.log("blockchain height: " + wallet.blockchainHeight());

            this.setState(() => ({
                balance_wallet: wallet.address()
            }));

            if (this.state.wallet_loaded) {
                let myBlockchainHeight = wallet.blockchainHeight();
                this.setState(() => ({
                    wallet_connected: wallet.connected() === "connected",
                    blockchain_height: myBlockchainHeight,
                    balance: this.roundBalanceAmount(wallet.balance()),
                    unlocked_balance: this.roundBalanceAmount(wallet.unlockedBalance()),
                    tokens: this.roundBalanceAmount(wallet.tokenBalance()),
                    unlocked_tokens: this.roundBalanceAmount(wallet.unlockedTokenBalance())
                }));

                console.log("balance: " + this.roundBalanceAmount(wallet.balance()));
                console.log("unlocked balance: " + this.roundBalanceAmount(wallet.unlockedBalance()));
                console.log("token balance: " + this.roundBalanceAmount(wallet.tokenBalance()));
                console.log("unlocked token balance: " + this.roundBalanceAmount(wallet.unlockedTokenBalance()));
                console.log("blockchain height " + wallet.blockchainHeight());
                console.log('connected: ' + wallet.connected());
            }

            console.log("balance address: " + wallet.address());

            this.setState(() => ({
                wallet_sync: false,
            }));

            if (wallet.daemonBlockchainHeight() - wallet.blockchainHeight() > 10) {
              this.setOpenBalanceAlert('Please wait while blockchain is being updated...', 'balance_alert', true);
            }
            wallet.on('refreshed', this.refreshCallback);
        }
    }

    rescanBalance() {
        var wallet = this.state.wallet;
        this.setOpenBalanceAlert('Rescanning, this may take some time, please wait ', 'balance_alert', true);
        wallet.off('updated');
        wallet.off('newBlock');
        wallet.off('refreshed');

        setTimeout(() => {
            this.setState(() => ({
                blockchain_height: wallet.blockchainHeight()
            }));
            console.log("Starting blockchain rescan sync...");
            wallet.rescanBlockchain();
            console.log("Blockchain rescan executed...");

            setTimeout(() => {
                console.log("Rescan setting callbacks");
                this.setState(() => ({
                    modal_close_disabled: false,
                    balance_alert_close_disabled: false,
                    balance: this.roundBalanceAmount(wallet.balance()),
                    unlocked_balance: this.roundBalanceAmount(wallet.unlockedBalance()),
                    tokens: this.roundBalanceAmount(wallet.tokenBalance()),
                    unlocked_tokens: this.roundBalanceAmount(wallet.unlockedTokenBalance()),
                    blockchain_height: wallet.blockchainHeight(),
                    wallet_connected: wallet.connected() === "connected"
                }));
                this.setCloseBalanceAlert();

                wallet.store()
                    .then(() => {
                        console.log("Wallet stored");
                    })
                    .catch((e) => {
                        console.log("Unable to store wallet: " + e);
                        this.setOpenBalanceAlert("Unable to store wallet: " + e, 'balance_alert', false);
                    });
                wallet.on('newBlock', this.newBlockCallback);
                wallet.on('updated', this.updatedCallback);
            }, 1000);
        }, 1000);
    }

    roundBalanceAmount(balance) {
        return Math.floor(parseFloat(balance) / 100000000) / 100;
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

    setOpenBalanceAlert(alert, alert_state, disabled) {
        openBalanceAlert(this, alert, alert_state, disabled);
    }

    setCloseBalanceAlert() {
        if(this.state.balance_alert_close_disabled === false) {
            closeBalanceAlert(this);
        }
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

    closeModal() {
        if (this.state.modal_close_disabled === false) {
            this.setState(() => ({
                modal_active: false,
                instructions_modal_active: false,
                balance_modal_active: false,
                balance_alert: false,
                open_file_alert: false,
                create_new_wallet_alert: false,
                create_from_keys_alert: false,
                send_cash: false,
                send_token: false,
                create_new_wallet_modal: false,
                open_from_existing_modal: false,
                create_from_keys_modal: false
            }));
        }
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
                let txId = tx.transactionsIds();
                console.log("Cash transaction created: " + txId);

                tx.commit().then(() => {
                    console.log("Transaction commited successfully");
                    this.setCloseSendPopup();
                    this.setOpenBalanceAlert('Transaction commited successfully, Your cash transaction ID is: ' 
                    + txId, 'balance_alert', false);
                    this.state.balance = this.roundBalanceAmount(wallet.balance());
                    this.state.unlocked_balance = this.roundBalanceAmount(wallet.unlockedBalance());
                }).catch((e) => {
                    console.log("Error on commiting transaction: " + e);
                    this.setOpenBalanceAlert("Error on commiting transaction: " + e, 'balance_alert', false);
                });
            }).catch((e) => {
                console.log("Couldn't create transaction: " + e);
                this.setOpenBalanceAlert("Couldn't create transaction: " + e, 'balance_alert', false);
            });
        } else {
            this.setOpenBalanceAlert('Fill out all the fields', 'balance_alert', false);
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
                let txId = tx.transactionsIds();
                console.log("Token transaction created: " + txId);

                tx.commit().then(() => {
                    console.log("Transaction commited successfully");
                    this.setCloseSendPopup();
                    this.setOpenBalanceAlert('Transaction commited successfully, Your token transaction ID is: '
                    + txId, 'balance_alert', false);
                    this.state.tokens = this.roundBalanceAmount(wallet.tokenBalance());
                    this.state.unlocked_tokens = this.roundBalanceAmount(wallet.unlockedTokenBalance());
                }).catch((e) => {
                    console.log("Error on commiting transaction: " + e);
                    this.setOpenBalanceAlert("Error on commiting transaction: " + e, 'balance_alert', false);
                });
            }).catch((e) => {
                console.log("Couldn't create transaction: " + e);
                this.setOpenBalanceAlert("Couldn't create transaction: " + e, 'balance_alert', false);
            });
        } else {
            this.setOpenBalanceAlert('Fill out all the fields', 'balance_alert', false);
        }
    }

    changeInstructionLang(lang) {
        this.setState(() => ({
            instructions_lang: lang
        }));
    }

    handleSubmit(e) {
        e.preventDefault();

        if (this.state.wallet_loaded) {
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
            this.openInfoPopup('Please load the wallet file');
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
        var cpu_options = [];
        for (var i = 25; i <= 100; i += 25) {
            cpu_options.push(<option key={i} value={i}>{i}%</option>);
        }
        cpu_options.reverse();

        const pools_list = this.state.pools_list.map((pools_list, index) => (
            <option key={index} value={pools_list} id={index}>
                {pools_list}
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
                        <button className="modal-btn" 
                            onClick={this.openCreateWalletModal}
                            title={this.state.active || this.state.stopping ? "Create New Wallet File (disabled while mining)" : "Create New Wallet File"}
                            disabled={this.state.active || this.state.stopping ? "disabled" : ""}>
                            <img src="images/new-wallet.png" alt="new-wallet" />
                        </button>
                        <button className="modal-btn" 
                            onClick={this.openFromExistingModal}
                            title={this.state.active || this.state.stopping ? "Open Wallet File (disabled while mining)" : "Open Wallet File"}
                            disabled={this.state.active || this.state.stopping ? "disabled" : ""}>
                            <img src="images/open-logo.png" alt="open-logo" />
                        </button>
                        <button className="modal-btn" 
                            onClick={this.openCreateFromKeysModal}
                            title={this.state.active || this.state.stopping ? "Create New Wallet From Keys (disabled while mining)" : "Create New Wallet From Keys"}
                            disabled={this.state.active || this.state.stopping ? "disabled" : ""}>
                            <img src="images/create-from-keys.png" alt="create-from-keys" />
                        </button>
                        <button className="balance-wallet-btn modal-btn" 
                            onClick={this.openBalanceModal}
                            title="Check Balance">
                            <img src="images/key.png" alt="key" />
                        </button>
                        <button className="instructions-btn modal-btn" onClick={this.openInstructionsModal}
                            title="Instructions">
                            ?
                        </button>
                    </div>

                    <form onSubmit={this.handleSubmit}>
                        <div className="address-wrap">
                            <img src="images/line-left.png" alt="Line Left" />
                            <input type="text" value={this.state.mining_address}
                                placeholder="Open or create your Wallet File"
                                name="user_wallet" id="user_wallet" readOnly
                                disabled={this.state.active ? "disabled" : ""}
                                title={this.state.mining_address === '' ? "Your Safex Address will be shown here" : "Your Safex Address"}
                            />
                            <img src="images/line-right.png" alt="Line Right" />
                        </div>

                        <select className="button-shine pool-url" name="pool" id="pool" 
                            disabled={this.state.active || this.state.stopping ? "disabled" : ""}
                            title="Choose the pool you want to connect to"
                        >
                            {pools_list}
                        </select>

                        <div className="options">
                            <div className="input-group">
                                <p># CPU</p>
                                <select name="cores" id="cpuUsage"
                                    disabled={this.state.active || this.state.stopping ? "disabled" : ""}
                                    title="Choose how much CPU power you want to use for mining"
                                >
                                    {cpu_options}
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

                <div className={this.state.balance_modal_active ? 'modal balance-modal active' : 'modal balance-modal'}>
                    <span className="close" onClick={this.closeModal} disabled={this.state.wallet_sync ? "" : "disabled"}>X</span>
                    <h3>Check Balance</h3>

                    {
                        this.state.wallet_loaded
                            ?
                            <div className="wallet-exists">
                                <div className="btns-wrap">
                                    <button className={this.state.wallet_connected ? "signal connected" : "signal"}
                                        title={this.state.wallet_connected ? "Connected" : "Connection to server failure"}>
                                        <img src={this.state.wallet_connected ? "images/connected-blue.png" : "images/connected-white.png"} alt="connected" />
                                    </button>
                                    <button className="blockheight"
                                        title="Blockchain Height">
                                        <img src="images/blocks.png" alt="blocks" />
                                        <span>
                                            {this.state.blockchain_height}
                                        </span>
                                    </button>
                                    <button className="button-shine refresh" onClick={this.rescanBalance} title="Rescan blockchain from scratch">
                                        <img src="images/refresh.png" alt="rescan" />
                                    </button>
                                </div>
                                <label htmlFor="selected_balance_address">Safex Wallet Address</label>
                                <textarea placeholder="Safex Wallet Address" name="selected_balance_address"
                                    value={this.state.balance_wallet} rows="2" readOnly />

                                <label htmlFor="spend_key">Private Spend Key</label>
                                <input type="text" name="spend_key" defaultValue={this.state.spend_key} />

                                <label htmlFor="view_key">Private View Key</label>
                                <input type="text" name="view_key" defaultValue={this.state.view_key} />

                                <div className="groups-wrap">
                                    <div className="form-group">
                                        <label htmlFor="balance">Pending Safex Cash</label>
                                        <input type="text" placeholder="Balance" name="balance"
                                            value={this.state.balance} readOnly />
                                        <label htmlFor="unlocked_balance">Available Safex Cash</label>
                                        <input type="text" placeholder="Unlocked balance" name="unlocked_balance"
                                            value={this.state.unlocked_balance} readOnly />
                                        <button className="button-shine" onClick={this.setOpenSendCash}>Send Cash</button>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="tokens">Pending Safex Tokens</label>
                                        <input type="text" placeholder="Tokens" value={this.state.tokens} readOnly />
                                        <label htmlFor="unlocked_tokens">Available Safex Tokens</label>
                                        <input type="text" placeholder="Unlocked Tokens" name="unlocked_tokens"
                                            value={this.state.unlocked_tokens} readOnly />
                                        <button className="button-shine" onClick={this.setOpenSendTokens}>Send Tokens</button>
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
                        walletSync={this.wallet_sync}
                        balanceAlertCloseDisabled={this.state.balance_alert_close_disabled}
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
                    balanceAlert={this.state.create_new_wallet_alert}
                    balanceAlertText={this.state.balance_alert_text}
                    closeBalanceAlert={this.setCloseBalanceAlert}
                />

                <OpenExistingWalletModal
                    openFromExistingModal={this.state.open_from_existing_modal}
                    closeFromExistingModal={this.closeModal}
                    openFromWalletFile={this.open_from_wallet_file}
                    balanceAlert={this.state.open_file_alert}
                    balanceAlertText={this.state.balance_alert_text}
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
