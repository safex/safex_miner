function updatedCallback(target) {
    console.log("UPDATED");
    target.state.wallet_meta.store()
        .then(() => {
            console.log("Wallet stored");
            target.setCloseBalanceAlert();
        })
        .catch((e) => {
            console.log("Unable to store wallet: " + e)
        })
}

function refreshCallback(target) {
    console.log("wallet refreshed");
    let wallet = target.state.wallet_meta;
    target.setState(() => ({
        modal_close_disabled: false,
        balance_alert_close_disabled: false,
        wallet: {
            balance: roundAmount(wallet.balance() - wallet.unlockedBalance()),
            unlocked_balance: roundAmount(wallet.unlockedBalance()),
            tokens: roundAmount(wallet.tokenBalance() - wallet.unlockedTokenBalance()),
            unlocked_tokens: roundAmount(wallet.unlockedTokenBalance()),
            blockchain_height: wallet.blockchainHeight(),
            wallet_connected: wallet.connected() === "connected"
        }
    }));

    wallet.store()
        .then(() => {
            console.log("Wallet stored");
            target.setCloseBalanceAlert();
        })
        .catch((e) => {
            console.log("Unable to store wallet: " + e);
            target.setOpenBalanceAlert("Unable to store wallet: " + e, 'balance_alert', false);
        });

    wallet.off('refreshed');

    setTimeout(() => {
        wallet.on('newBlock', target.startNewBlockCallback);
        wallet.on('updated', target.startUpdatedCallback);
    }, 300);
}

function newBlockCallback(target, height) {
    let wallet = target.state.wallet_meta;
    let syncedHeight = wallet.daemonBlockchainHeight() - height < 10;
    if (syncedHeight) {
        console.log("syncedHeight up to date...");
        if (wallet.synchronized()) {
            console.log("newBlock wallet synchronized, setting state...");
            target.setState(() => ({
                wallet_sync: true,
                modal_close_disabled: false,
                balance_alert_close_disabled: false,
                wallet: {
                    balance: roundAmount(wallet.balance() - wallet.unlockedBalance()),
                    unlocked_balance: roundAmount(wallet.unlockedBalance()),
                    tokens: roundAmount(wallet.tokenBalance() - wallet.unlockedTokenBalance()),
                    unlocked_tokens: roundAmount(wallet.unlockedTokenBalance()),
                    blockchain_height: wallet.blockchainHeight()
                }
            }));
        }
    }
}

function balanceCheck(target) {
    if (target.state.wallet_loaded) {
        let wallet = target.state.wallet_meta;
        console.log("daemon blockchain height: " + wallet.daemonBlockchainHeight());
        console.log("blockchain height: " + wallet.blockchainHeight());

        if (target.state.wallet_loaded) {
            target.setState(() => ({
                modal_close_disabled: false,
                balance_alert_close_disabled: false,
                wallet: {
                    balance: roundAmount(wallet.balance() - wallet.unlockedBalance()),
                    unlocked_balance: roundAmount(wallet.unlockedBalance()),
                    tokens: roundAmount(wallet.tokenBalance() - wallet.unlockedTokenBalance()),
                    unlocked_tokens: roundAmount(wallet.unlockedTokenBalance()),
                    blockchain_height: wallet.blockchainHeight(),
                    wallet_connected: wallet.connected() === "connected"
                }
            }));
            console.log("balance: " + roundAmount(wallet.balance()));
            console.log("unlocked balance: " + roundAmount(wallet.unlockedBalance()));
            console.log("token balance: " + roundAmount(wallet.tokenBalance() - wallet.unlockedTokenBalance()));
            console.log("unlocked token balance: " + roundAmount(wallet.unlockedTokenBalance()));
            console.log("blockchain height " + wallet.blockchainHeight());
            console.log('connected: ' + wallet.connected());
        }
        console.log("balance address: " + wallet.address());
        target.setState(() => ({
            wallet_sync: false,
        }));
        if (wallet.daemonBlockchainHeight() - wallet.blockchainHeight() > 10) {
            target.setOpenBalanceAlert('Please wait while blockchain is being updated...', 'balance_alert', true);
        }
        wallet.on('refreshed', target.startRefreshCallback);
        target.setState(() => ({
            modal_close_disabled: false,
        }));
    }
}

function rescanBalance(target) {
    var wallet = target.state.wallet_meta;
    target.setOpenBalanceAlert('Rescanning, this may take some time, please wait ', 'balance_alert', true);
    wallet.off('updated');
    wallet.off('newBlock');
    wallet.off('refreshed');
    target.setState(() => ({
        modal_close_disabled: true
    }));
    setTimeout(() => {
        console.log("Starting blockchain rescan sync...");
        wallet.rescanBlockchain();
        console.log("Blockchain rescan executed...");
        setTimeout(() => {
            console.log("Rescan setting callbacks");
            target.setState(() => ({
                modal_close_disabled: false,
                balance_alert_close_disabled: false,
                wallet: {
                    wallet_connected: wallet.connected() === "connected",
                    balance: roundAmount(wallet.balance() - wallet.unlockedBalance()),
                    unlocked_balance: roundAmount(wallet.unlockedBalance()),
                    tokens: roundAmount(wallet.tokenBalance() - wallet.unlockedTokenBalance()),
                    unlocked_tokens: roundAmount(wallet.unlockedTokenBalance()),
                    blockchain_height: wallet.blockchainHeight(),
                }
            }));
            target.setCloseBalanceAlert();
            wallet.store()
                .then(() => {
                    console.log("Wallet stored");
                })
                .catch((e) => {
                    console.log("Unable to store wallet: " + e);
                    target.setOpenBalanceAlert("Unable to store wallet: " + e, 'balance_alert', false);
                });
            wallet.on('newBlock', target.startNewBlockCallback);
            wallet.on('updated', target.startUpdatedCallback);
        }, 1000);
    }, 1000);
}

/**
 * Round amount
 */
function roundAmount(balance) {
    return Math.floor(parseFloat(balance) / 100000000) / 100;
}

export {
    updatedCallback,
    refreshCallback,
    newBlockCallback,
    balanceCheck,
    rescanBalance,
    roundAmount
}