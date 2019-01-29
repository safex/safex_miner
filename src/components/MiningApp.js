import React from 'react';

const { shell } = window.require('electron')
const xmrigCpu = window.require('node-xmrig-cpu');
const safex = window.require('safex-nodejs-libwallet');
const { dialog } = window.require('electron').remote;
const remote = window.require('electron').remote;

import {
    verify_safex_address,
    openBalanceAlert,
    closeBalanceAlert,
    openSendPopup,
    closeSendPopup
} from '../utils/balance';

import NewWalletModal from './partials/NewWalletModal';
import BalanceAlert from './partials/BalanceAlert';
import SendModal from './partials/SendModal';
import CreateNewWalletModal from './partials/CreateNewWalletModal';
import OpenExistingWalletModal from './partials/OpenExistingWalletModal';
import CreateFromKeysModal from './partials/CreateFromKeysModal';
import InstructionsModal from './partials/InstructionsModal';
import ExitModal from './partials/ExitModal';
import Header from './partials/Header';

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
            mining_info: '',
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
            new_wallet_modal: false,
            exit_modal: false,
            exiting: false,

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
            send_cash_or_token: false,
            tick_handle: null,
            tx_being_sent: false,

            //wallet state settings
            wallet_meta: null,
            wallet: {
                address: '',
                spend_key: '',
                view_key: '',
                wallet_connected: '',
                balance: 0,
                unlocked_balance: 0,
                tokens: 0,
                unlocked_tokens: 0,
                blockchain_height: 0,
            },
            wallet_sync: false,
            wallet_being_created: false,
            create_new_wallet_modal: false,
            open_from_existing_modal: false,
            create_from_keys_modal: false,
            wallet_loaded: false,
            wallet_exists: false,
            wallet_password: '',
            wallet_path: '',
            network: 'mainnet',
            daemonHostPort: 'rpc.safex.io:17402',
        };
    }

    //first step select wallet path, if exists, set password
    //second step set password

    //paste in address start mining
    //create new
    //import -> keys/file

    browseFile = () => {
        var filepath = "";
        filepath = dialog.showOpenDialog({})
        console.log("filename " + filepath);

        this.setState(() => ({
            wallet_path: filepath,
        }));
    }

    open_from_wallet_file = (e) => {
        e.preventDefault();
        const pass = e.target.pass.value;
        let filepath = e.target.filepath.value;

        if (filepath === '') {
            this.setOpenBalanceAlert("Choose the wallet file", 'open_file_alert', false);
            return false;
        }
        if (pass === '') {
            this.setOpenBalanceAlert("Enter password for your wallet file", 'open_file_alert', false);
            return false;
        }
        if (this.state.wallet_loaded) {
            this.closeWallet();
        }
        this.setState({
            modal_close_disabled: true
        });
        var args = {
            'path': this.state.wallet_path,
            'password': pass,
            'network': this.state.network,
            'daemonAddress': this.state.daemonHostPort,
        }
        this.setOpenBalanceAlert('Please wait while your wallet file is loaded', 'open_file_alert', true);
        safex.openWallet(args)
            .then((wallet) => {
                this.setState({
                    wallet_loaded: true,
                    wallet_meta: wallet,
                    modal_close_disabled: false,
                    balance_alert_close_disabled: true,
                    mining_info: false,
                    wallet: {
                        address: wallet.address(),
                        spend_key: wallet.secretSpendKey(),
                        view_key: wallet.secretViewKey(),
                    }
                });
                this.closeModal();
            })
            .catch((err) => {
                this.setState(() => ({
                    modal_close_disabled: false
                }));
                this.setOpenBalanceAlert('Error opening the wallet: ' + err, 'open_file_alert', false);
            })
    }

    create_new_wallet = (e) => {
        e.preventDefault();

        const pass1 = e.target.pass1.value;
        const pass2 = e.target.pass2.value;
        console.log("new wallet password " + e.target.pass1.value);

        if (pass1 === '' || pass2 === '') {
            this.setOpenBalanceAlert("Fill out all the fields", 'create_new_wallet_alert', false);
            return false;
        }
        if (pass1 !== pass2) {
            this.setOpenBalanceAlert('Repeated password does not match', 'create_new_wallet_alert', false);
            return false;
        }
        if (this.state.wallet_loaded) {
            this.closeWallet();
        }
        dialog.showSaveDialog((filepath) => {
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
          OR you can open it using the Load Existing Wallet`, 'create_new_wallet_alert', false);
                return false;
            }
            this.setState(() => ({
                wallet_path: filepath,
                wallet_exists: false,
                modal_close_disabled: true
            }));
            var args = {
                'path': filepath,
                'password': pass1,
                'network': this.state.network,
                'daemonAddress': this.state.daemonHostPort,
            }
            this.setOpenBalanceAlert('Please wait while your wallet file is being created', 'create_new_wallet_alert', true);
            console.log("wallet doesn't exist. creating new one: " + this.state.wallet_path);

            safex.createWallet(args)
                .then((wallet) => {
                    this.setState({
                        wallet_loaded: true,
                        wallet_meta: wallet,
                        wallet: {
                            address: wallet.address(),
                            spend_key: wallet.secretSpendKey(),
                            view_key: wallet.secretViewKey(),
                        },
                        modal_close_disabled: false,
                        mining_info: false
                    });
                    console.log('wallet address  ' + this.state.wallet.address);
                    console.log('wallet spend private key  ' + this.state.wallet.spend_key);
                    console.log('wallet view private key  ' + this.state.wallet.view_key);
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
                .catch((err) => {
                    this.setOpenBalanceAlert('error with the creation of the wallet ' + err, 'create_new_wallet_alert', false);
                });
        });
        //pass dialog box
        //pass password
        //confirm password
    }

    create_new_wallet_from_keys = (e) => {
        e.preventDefault();

        //here we need the key set
        //the wallet path desired
        //the password
        var safex_address = e.target.address.value;
        var view_key = e.target.viewkey.value;
        var spend_key = e.target.spendkey.value;
        var pass1 = e.target.pass1.value;
        var pass2 = e.target.pass2.value;

        if (safex_address === '' || view_key === '' || spend_key === '' || pass1 === '' || pass2 === '') {
            this.setOpenBalanceAlert("Fill out all the fields", 'create_from_keys_alert', false);
            return false;
        }
        if (pass1 === '' && pass2 === '' && pass1 !== pass2) {
            this.setOpenBalanceAlert("Passwords do not match", 'create_from_keys_alert', false);
            return false;
        }
        if (verify_safex_address(spend_key, view_key, safex_address) === false) {
            this.setOpenBalanceAlert('Incorrect keys', 'create_from_keys_alert', false);
            return false;
        }
        if (this.state.wallet_loaded) {
            this.closeWallet();
        }
        dialog.showSaveDialog((filepath) => {
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
          OR you can open it using the Load Existing Wallet`, 'create_new_wallet_alert', false);
                return false;
            }
            this.setState({
                wallet_path: filepath,
                wallet_exists: false,
                modal_close_disabled: true
            });
            var args = {
                'path': this.state.wallet_path,
                'password': pass1,
                'network': this.state.network,
                'daemonAddress': this.state.daemonHostPort,
                'restoreHeight': 0,
                'addressString': safex_address,
                'viewKeyString': view_key,
                'spendKeyString': spend_key
            }
            this.setOpenBalanceAlert('Please wait while your wallet file is being created. Do not close the application until the process is complete. This may take some time, please be patient.', 'create_from_keys_alert', true);
            console.log("wallet doesn't exist. creating new one: " + this.state.wallet_path);

            safex.createWalletFromKeys(args)
                .then((wallet) => {
                    console.log("Create wallet form keys performed!");
                    this.setState({
                        wallet_loaded: true,
                        wallet_meta: wallet,
                        wallet: {
                            address: wallet.address(),
                            spend_key: wallet.secretSpendKey(),
                            view_key: wallet.secretViewKey(),
                        },
                        modal_close_disabled: false,
                        mining_info: false
                    });
                    console.log('wallet address  ' + this.state.wallet.address);
                    console.log('wallet spend private key  ' + this.state.wallet.spend_key);
                    console.log('wallet view private key  ' + this.state.wallet.view_key);
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
                .catch((err) => {
                    console.log("Create wallet form keys failed!");
                    this.setOpenBalanceAlert('Error with the creation of the wallet ' + err, 'create_from_keys_alert', false);
                });
        });
        console.log("create_new_wallet_from_keys checkpoint 2");
    }

    addressChange = (e) => {
        let address = e.target.value;
        this.setState({
            mining_info: false,
            wallet: { address }
        });
    }

    closeWallet = () => {
        if (this.state.wallet_loaded) {
            this.state.wallet_meta.pauseRefresh();
            this.state.wallet_meta.off();
            this.state.wallet_meta.close(true);
            this.setState({
                wallet_loaded: false
            })
            clearTimeout(this.state.tick_handle);

            console.log('wallet closed')
        }
    }

    updatedCallback = () => {
        console.log("UPDATED");
        this.state.wallet_meta.store()
            .then(() => {
                console.log("Wallet stored");
                this.setCloseBalanceAlert();
            })
            .catch((e) => {
                console.log("Unable to store wallet: " + e)
            })
    }

    refreshCallback = () => {
        console.log("wallet refreshed");
        let wallet = this.state.wallet_meta;
        this.setState(() => ({
            modal_close_disabled: false,
            balance_alert_close_disabled: false,
            wallet: {
                balance: this.roundBalanceAmount(wallet.balance() - wallet.unlockedBalance()),
                unlocked_balance: this.roundBalanceAmount(wallet.unlockedBalance()),
                tokens: this.roundBalanceAmount(wallet.tokenBalance() - wallet.unlockedTokenBalance()),
                unlocked_tokens: this.roundBalanceAmount(wallet.unlockedTokenBalance()),
                blockchain_height: wallet.blockchainHeight(),
                wallet_connected: wallet.connected() === "connected"
            }
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

    newBlockCallback = (height) => {
        let wallet = this.state.wallet_meta;
        let syncedHeight = wallet.daemonBlockchainHeight() - height < 10;
        if (syncedHeight) {
            console.log("syncedHeight up to date...");
            if (wallet.synchronized()) {
                console.log("newBlock wallet synchronized, setting state...");
                this.setState(() => ({
                    wallet_sync: true,
                    modal_close_disabled: false,
                    balance_alert_close_disabled: false,
                    wallet: {
                        balance: this.roundBalanceAmount(wallet.balance() - wallet.unlockedBalance()),
                        unlocked_balance: this.roundBalanceAmount(wallet.unlockedBalance()),
                        tokens: this.roundBalanceAmount(wallet.tokenBalance() - wallet.unlockedTokenBalance()),
                        unlocked_tokens: this.roundBalanceAmount(wallet.unlockedTokenBalance()),
                        blockchain_height: wallet.blockchainHeight()
                    }
                }));
            }
        }
    }

    startBalanceCheck = () => {
        if (this.state.wallet_loaded) {
            let wallet = this.state.wallet_meta;
            console.log("daemon blockchain height: " + wallet.daemonBlockchainHeight());
            console.log("blockchain height: " + wallet.blockchainHeight());

            if (this.state.wallet_loaded) {
                this.setState(() => ({
                    modal_close_disabled: false,
                    balance_alert_close_disabled: false,
                    wallet: {
                        balance: this.roundBalanceAmount(wallet.balance() - wallet.unlockedBalance()),
                        unlocked_balance: this.roundBalanceAmount(wallet.unlockedBalance()),
                        tokens: this.roundBalanceAmount(wallet.tokenBalance() - wallet.unlockedTokenBalance()),
                        unlocked_tokens: this.roundBalanceAmount(wallet.unlockedTokenBalance()),
                        blockchain_height: wallet.blockchainHeight(),
                        wallet_connected: wallet.connected() === "connected"
                    }
                }));
                console.log("balance: " + this.roundBalanceAmount(wallet.balance()));
                console.log("unlocked balance: " + this.roundBalanceAmount(wallet.unlockedBalance()));
                console.log("token balance: " + this.roundBalanceAmount(wallet.tokenBalance() - wallet.unlockedTokenBalance()));
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
            this.setState(() => ({
                modal_close_disabled: false,
            }));
        }
    }

    rescanBalance = () => {
        var wallet = this.state.wallet_meta;
        this.setOpenBalanceAlert('Rescanning, this may take some time, please wait ', 'balance_alert', true);
        wallet.off('updated');
        wallet.off('newBlock');
        wallet.off('refreshed');
        this.setState(() => ({
            modal_close_disabled: true
        }));
        setTimeout(() => {
            console.log("Starting blockchain rescan sync...");
            wallet.rescanBlockchain();
            console.log("Blockchain rescan executed...");
            setTimeout(() => {
                console.log("Rescan setting callbacks");
                this.setState(() => ({
                    modal_close_disabled: false,
                    balance_alert_close_disabled: false,
                    wallet: {
                        wallet_connected: wallet.connected() === "connected",
                        balance: this.roundBalanceAmount(wallet.balance() - wallet.unlockedBalance()),
                        unlocked_balance: this.roundBalanceAmount(wallet.unlockedBalance()),
                        tokens: this.roundBalanceAmount(wallet.tokenBalance() - wallet.unlockedTokenBalance()),
                        unlocked_tokens: this.roundBalanceAmount(wallet.unlockedTokenBalance()),
                        blockchain_height: wallet.blockchainHeight(),
                    }
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

    roundBalanceAmount = (balance) => {
        return Math.floor(parseFloat(balance) / 100000000) / 100;
    }

    openInfoPopup = (message) => {
        this.setState({
            mining_info: true,
            mining_info_text: message
        })
    }

    openNewWalletModal = () => {
        this.setState(() => ({
            new_wallet_modal: true
        }));
    }

    openInstructionsModal = () => {
        this.setState(() => ({
            instructions_modal_active: true
        }));
    }

    openCreateWalletModal = () => {
        this.setState(() => ({
            create_new_wallet_modal: true
        }));
    }

    openFromExistingModal = () => {
        this.setState(() => ({
            open_from_existing_modal: true
        }));
    }

    openCreateFromKeysModal = () => {
        this.setState(() => ({
            create_from_keys_modal: true
        }));
    }

    openBalanceModal = () => {
        this.setState(() => ({
            balance_modal_active: true
        }));
        if (this.state.wallet_loaded) {
            this.startBalanceCheck();
        }
    }

    setOpenBalanceAlert = (alert, alert_state, disabled) => {
        openBalanceAlert(this, alert, alert_state, disabled);
    }

    setCloseBalanceAlert = () => {
        if (this.state.balance_alert_close_disabled === false) {
            closeBalanceAlert(this);
        }
    }

    setOpenSendPopup = send_cash_or_token => {
        openSendPopup(this, send_cash_or_token);
    };

    setCloseSendPopup = () => {
        closeSendPopup(this);
    };

    closeModal = () => {
        if (this.state.modal_close_disabled === false) {
            this.setState(() => ({
                new_wallet_modal: false,
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
                create_from_keys_modal: false,
                exit_modal: false
            }));
        }
    }

    sendCashOrToken = (e, cash_or_token) => {
        e.preventDefault();
        let sendingAddress = e.target.send_to.value;
        let amount = e.target.amount.value * 10000000000;
        let paymentid = e.target.paymentid.value;
        this.setState(() => ({
            cash_or_token: cash_or_token
        }));

        if (sendingAddress === "") {
            this.setOpenBalanceAlert("Fill out all the fields", 'balance_alert', false);
            return false;
        }
        if (amount === "") {
            this.setOpenBalanceAlert("Enter Amount", 'balance_alert', false);
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
                                txId, 'balance_alert', false
                            );
                        } else {
                            this.setOpenBalanceAlert(
                                "Transaction commited successfully, Your token transaction ID is: " +
                                txId, 'balance_alert', false
                            );
                        }
                        this.setState(() => ({ tx_being_sent: false }));
                        setTimeout(() => {
                            this.setState({
                                wallet: {
                                    balance: this.roundBalanceAmount(wallet.unlockedBalance() - wallet.balance()),
                                    unlocked_balance: this.roundBalanceAmount(wallet.unlockedBalance()),
                                    tokens: this.roundBalanceAmount(wallet.unlockedTokenBalance() - wallet.tokenBalance()),
                                    unlocked_tokens: this.roundBalanceAmount(wallet.unlockedTokenBalance())
                                }
                            })
                        }, 300);
                    })
                    .catch(e => {
                        this.setState(() => ({ tx_being_sent: false }));
                        this.setOpenBalanceAlert("Error on commiting transaction: " + e, 'balance_alert', false);
                    });
            })
            .catch(e => {
                this.setState(() => ({ tx_being_sent: false }));
                this.setOpenBalanceAlert("Couldn't create transaction: " + e, 'balance_alert', false);
            });
    };

    changeInstructionLang = (lang) => {
        this.setState(() => ({
            instructions_lang: lang
        }));
    }

    inputValidate = (inputValue) => {
        let inputRegex = /^[a-zA-Z0-9]/;
        return inputRegex.test(inputValue);
    }

    checkInputValueLenght = (inputValue) => {
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

    handleSubmit = (e) => {
        e.preventDefault();
        let miningAddress = e.target.mining_address.value;

        if (miningAddress === '') {
            this.openInfoPopup('Please enter Safex address');
            return false;
        }
        if (!this.inputValidate(miningAddress)) {
            this.openInfoPopup('Please enter valid Safex address');
            return false;
        }
        if (!this.checkInputValueLenght(miningAddress)) {
            this.openInfoPopup('Please enter valid address');
            return false;
        }
        if (!this.checkInputValuePrefix(miningAddress)) {
            this.openInfoPopup('Your address must start with Safex or SFXt');
            return false;
        }
        if (!safex.addressValid(miningAddress, 'mainnet')) {
            this.openInfoPopup('Address is not valid');
            return false;
        }
        if (this.state.active) {
            this.stopMining();
        } else {
            this.startMining();
        }
    }

    startMining = () => {
        var userWallet = document.getElementById("mining_address").value;
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

    stopMining = () => {
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
        console.log("Ending mining...");
        clearInterval(this.state.checkStatusInterval);
        this.setState(() => ({
            hashrate: 0
        }));
        this.miner.stopMining();
        console.log("Mining ended");
    }

    checkStatus = () => {
        this.setState({
            hashrate: this.miner.getStatus().split(' ')[2]
        });
        console.log(this.miner.getStatus(), this.state.hashrate);
    }

    footerLink = () => {
        shell.openExternal('https://www.safex.io/')
    }

    closeApp = () => {
        let window = remote.getCurrentWindow();
        this.closeModal();

        if (this.state.active) {
            this.stopMining();
            this.closeWallet();
            setTimeout(() => {
                this.setState(() => ({
                    exiting: true
                }));
            }, 5000);
            setTimeout(() => {
                window.close();
            }, 6000);
        } else {
            this.setState(() => ({
                exiting: true
            }));
            setTimeout(() => {
                window.close();
            }, 1000);
        }
    }

    openExitModal = () => {
        this.setState({
            exit_modal: true
        });
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
                <div className={this.state.exiting ? "mining-bg-wrap animated fadeOut" : "mining-bg-wrap animated fadeIn"}>
                    <img className={this.state.active || this.state.stopping ? "rotatingLeft" : ""} src="images/circle-outer.png" alt="Circle-outer" />
                    <img className={this.state.active || this.state.stopping ? "rotatingRight" : ""} src="images/circle-inner.png" alt="Circle-inner" />
                </div>

                <Header
                    exiting={this.state.exiting}
                    openExitModal={this.openExitModal}
                />

                <div className={this.state.exiting ? "main animated fadeOut" : "main animated fadeIn"}>
                    <div className="btns-wrap">
                        <button className="modal-btn"
                            onClick={this.openNewWalletModal}
                            title="Generate New Wallet Address">
                            <img src="images/new.png" alt="new-wallet" />
                        </button>
                        <button className="modal-btn" 
                            onClick={this.openCreateWalletModal}
                            title="Create New Wallet File"
                            disabled={this.state.wallet_loaded || this.state.active || this.state.stopping ? "disabled" : ""}>
                            <img src="images/new-wallet.png" alt="new-wallet" />
                        </button>
                        <button className="modal-btn" 
                            onClick={this.openFromExistingModal}
                            title="Open Wallet File"
                            disabled={this.state.wallet_loaded || this.state.active || this.state.stopping ? "disabled" : ""}>
                            <img src="images/open-logo.png" alt="open-logo" />
                        </button>
                        <button className="modal-btn" 
                            onClick={this.openCreateFromKeysModal}
                            title="Create New Wallet From Keys"
                            disabled={this.state.wallet_loaded || this.state.active || this.state.stopping ? "disabled" : ""}>
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
                            <input type="text"
                                value={this.state.wallet.address}
                                onChange={this.addressChange}
                                placeholder="Safex Address"
                                name="mining_address" 
                                id="mining_address"
                                disabled={this.state.active || this.state.stopping ? "disabled" : ""}
                                title={this.state.mining_address === '' ? "Your Safex Address will be shown here" : "Your Safex Address"}
                                readOnly={this.state.wallet_loaded ? "readOnly" : ""}
                            />
                            <img src="images/line-right.png" alt="Line Right" />
                        </div>

                        <select className="button-shine pool-url" name="pool" id="pool" 
                            disabled={this.state.active || this.state.stopping ? "disabled" : ""}
                            title={this.state.active || this.state.stopping ? "Choose the pool you want to connect to (disabled while mining)" : "Choose the pool you want to connect to"}
                        >
                            {pools_list}
                        </select>

                        <div className="options">
                            <div className="input-group">
                                <p># CPU</p>
                                <select name="cores" id="cpuUsage"
                                    disabled={this.state.active || this.state.stopping ? "disabled" : ""}
                                    title={this.state.active || this.state.stopping ? "Choose how much CPU power you want to use for mining (disabled while mining)" : "Choose how much CPU power you want to use for mining"}
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

                    <footer className={this.state.exiting ? "animated fadeOut" : "animated fadeIn"}>
                        <a onClick={this.footerLink} title="Visit our site">
                            <img src="images/powered.png" alt="Balkaneum" />
                        </a>
                    </footer>
                </div>

                <div className={this.state.balance_modal_active ? 'modal balance-modal active' : 'modal balance-modal'}>
                    <span className="close" onClick={this.closeModal} disabled={this.state.wallet_sync ? "" : "disabled"}>X</span>
                    <h3 className={this.state.wallet_loaded ? "wallet-loaded-h3" : ""}>Check Balance</h3>

                    {
                        this.state.wallet_loaded
                            ?
                            <div className="wallet-exists">
                                <div className="btns-wrap">
                                    <button className={this.state.wallet.wallet_connected ? "signal connected" : "signal"}
                                        title="Status"
                                    >
                                        <img src={this.state.wallet.wallet_connected ? "images/connected-blue.png" : "images/connected-white.png"} alt="connected" />
                                        <p>
                                            {
                                                this.state.wallet.wallet_connected 
                                                    ?
                                                    <span>Connected</span>
                                                    :
                                                    <span>Connection error</span>
                                            }
                                        </p>
                                    </button>
                                    <button className="blockheight"
                                        title="Blockchain Height">
                                        <img src="images/blocks.png" alt="blocks" />
                                        <span>
                                            {this.state.wallet.blockchain_height}
                                        </span>
                                    </button>
                                    <button className="button-shine refresh" onClick={this.rescanBalance} title="Rescan blockchain from scratch">
                                        <img src="images/refresh.png" alt="rescan" />
                                    </button>
                                </div>
                                <label htmlFor="selected_balance_address">Safex Wallet Address</label>
                                <textarea placeholder="Safex Wallet Address" name="selected_balance_address"
                                    value={this.state.wallet.address} rows="2" readOnly />

                                <div className="groups-wrap">
                                    <div className="form-group">
                                        <label htmlFor="balance">Pending Safex Cash</label>
                                        <input type="text" placeholder="Balance" name="balance" className="yellow-field"
                                            value={this.state.wallet.balance} readOnly />
                                        <label htmlFor="unlocked_balance">Available Safex Cash</label>
                                        <input type="text" placeholder="Unlocked balance" name="unlocked_balance" className="green-field"
                                            value={this.state.wallet.unlocked_balance} readOnly />
                                        <button className="button-shine" onClick={this.setOpenSendPopup.bind(this, 0)}>Send Cash</button>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="tokens">Pending Safex Tokens</label>
                                        <input type="text" className="yellow-field" placeholder="Tokens" value={this.state.wallet.tokens} readOnly />
                                        <label htmlFor="unlocked_tokens">Available Safex Tokens</label>
                                        <input type="text" className="green-field" placeholder="Unlocked Tokens" name="unlocked_tokens"
                                            value={this.state.wallet.unlocked_tokens} readOnly />
                                        <button className="button-shine" onClick={this.setOpenSendPopup.bind(this, 1)}>Send Tokens</button>
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

                <ExitModal
                    exitModal={this.state.exit_modal}
                    closeExitModal={this.closeModal}
                    closeApp={this.closeApp}
                />

                <div
                    className={this.state.modal_active || this.state.instructions_modal_active || this.state.balance_modal_active ? 'backdrop active' : 'backdrop'}
                    onClick={this.closeModal}>
                </div>
            </div>
        );
    }
}
