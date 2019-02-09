import {
    verify_safex_address
} from "../utils/utils";
const safex = window.require("safex-nodejs-libwallet");
const { dialog } = window.require("electron").remote;

function create_new_wallet(target, e) {
    e.preventDefault();

    const pass1 = e.target.pass1.value;
    const pass2 = e.target.pass2.value;
    console.log("new wallet password " + e.target.pass1.value);

    if (pass1 === "" || pass2 === "") {
        target.setOpenBalanceAlert("Fill out all the fields");
        return false;
    }
    if (pass1 !== pass2) {
        target.setOpenBalanceAlert("Repeated password does not match");
        return false;
    }
    if (target.state.wallet_loaded) {
        target.closeWallet();
    }
    dialog.showSaveDialog(filepath => {
        if (!filepath) {
            return false;
        }
        if (safex.walletExists(filepath)) {
            target.setState(() => ({
                modal_close_disabled: false
            }));
            target.setOpenBalanceAlert(
                `Wallet already exists. Please choose a different file name.
                This application does not enable overwriting an existing wallet file
                OR you can open it using the Load Existing Wallet`,
                "create_new_wallet_alert"
            );
            return false;
        }
        target.setState(() => ({
            wallet_path: filepath,
            wallet_exists: false,
            modal_close_disabled: true
        }));
        var args = {
            path: filepath,
            password: pass1,
            network: target.state.network,
            daemonAddress: target.state.daemonHostPort
        };
        target.setOpenBalanceAlert(
            "Please wait while your wallet file is being created",
            "create_new_wallet_alert",
            true
        );
        console.log(
            "wallet doesn't exist. creating new one: " + target.state.wallet_path
        );

        safex
            .createWallet(args)
            .then(wallet => {
                target.setState({
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
                console.log("wallet address  " + target.state.wallet.address);
                console.log(
                    "wallet spend private key  " + target.state.wallet.spend_key
                );
                console.log("wallet view private key  " + target.state.wallet.view_key);
                wallet.on("refreshed", () => {
                    console.log("Wallet File successfully created!");
                    target.closeModal();
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
                target.setOpenBalanceAlert("error with the creation of the wallet " + err);
            });
    });
    //pass dialog box
    //pass password
    //confirm password
};

function create_new_wallet_from_keys(target, e) {
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
        target.setOpenBalanceAlert("Fill out all the fields");
        return false;
    }
    if (pass1 === "" && pass2 === "" && pass1 !== pass2) {
        target.setOpenBalanceAlert("Passwords do not match");
        return false;
    }
    if (verify_safex_address(spend_key, view_key, safex_address) === false) {
        target.setOpenBalanceAlert("Incorrect keys");
        return false;
    }
    if (target.state.wallet_loaded) {
        target.closeWallet();
    }
    dialog.showSaveDialog(filepath => {
        if (!filepath) {
            return false;
        }
        if (safex.walletExists(filepath)) {
            target.setState(() => ({
                modal_close_disabled: false
            }));
            target.setOpenBalanceAlert(
                `Wallet already exists. Please choose a different file name.
                This application does not enable overwriting an existing wallet file
                OR you can open it using the Load Existing Wallet`,
                "create_new_wallet_alert");
            return false;
        }
        target.setState({
            wallet_path: filepath,
            wallet_exists: false,
            modal_close_disabled: true
        });
        var args = {
            path: target.state.wallet_path,
            password: pass1,
            network: target.state.network,
            daemonAddress: target.state.daemonHostPort,
            restoreHeight: 0,
            addressString: safex_address,
            viewKeyString: view_key,
            spendKeyString: spend_key
        };
        target.setOpenBalanceAlert(
            "Please wait while your wallet file is being created. Do not close the application until the process is complete. This may take some time, please be patient.",
            true
        );
        console.log(
            "wallet doesn't exist. creating new one: " + target.state.wallet_path
        );

        safex
            .createWalletFromKeys(args)
            .then(wallet => {
                console.log("Create wallet form keys performed!");
                target.setState({
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
                console.log("wallet address  " + target.state.wallet.address);
                console.log(
                    "wallet spend private key  " + target.state.wallet.spend_key
                );
                console.log("wallet view private key  " + target.state.wallet.view_key);
                console.log("create_new_wallet_from_keys checkpoint 1");
                wallet.on("refreshed", () => {
                    console.log("Wallet File successfully created!");
                    target.closeModal();
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
                target.setOpenBalanceAlert("Error with the creation of the wallet " + err);
            });
    });
    console.log("create_new_wallet_from_keys checkpoint 2");
};

function open_from_wallet_file(target, e) {
    e.preventDefault();
    const pass = e.target.pass.value;
    let filepath = e.target.filepath.value;

    if (filepath === "") {
        target.setOpenBalanceAlert("Choose the wallet file");
        return false;
    }
    if (pass === "") {
        target.setOpenBalanceAlert("Enter password for your wallet file");
        return false;
    }
    if (target.state.wallet_loaded) {
        target.closeWallet();
    }
    target.setState({
        modal_close_disabled: true
    });
    var args = {
        path: target.state.wallet_path,
        password: pass,
        network: target.state.network,
        daemonAddress: target.state.daemonHostPort
    };
    target.setOpenBalanceAlert("Please wait while your wallet file is loaded", true);
    safex
        .openWallet(args)
        .then(wallet => {
            target.setState({
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
            target.setState({
              modal: false
            });
            setTimeout(() => {
              target.setState({
                open_from_existing_modal: false,
                balance_alert: false,
                balance_alert_close_disabled: false
              });
            }, 300);
        })
        .catch(err => {
            target.setState(() => ({
                modal_close_disabled: false
            }));
            target.setOpenBalanceAlert("Error opening the wallet: " + err, false);
        });
};

export {
    create_new_wallet,
    create_new_wallet_from_keys,
    open_from_wallet_file
}