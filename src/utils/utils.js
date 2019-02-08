var swg = window.require('safex-addressjs');

/**
 * Verify Safex Address
 */
function verify_safex_address(spend, view, address) {
    var spend_pub = swg.sec_key_to_pub(spend);
    var view_pub = swg.sec_key_to_pub(view);

    var _address = swg.pubkeys_to_string(spend_pub, view_pub);

    if (_address === address) {
        return true;
    } else {
        return false;
    }
}

/**
 * Structure Safex Address
 *
 * key object
 * {
 *     spend : {
 *         sec : secret_key
 *         pub: : public_key
 *     },
 *     view : {
 *         sec : secret_key
 *         pub: : public_key
 *     },
 *     checksum : checksum of address
 * }
 */
function structureSafexKeys(spend, view) {
    const keys = swg.structure_keys(spend, view);
    const checksum = swg.address_checksum(keys.spend.pub, keys.view.pub);
    keys["checksum"] = checksum;

    return keys;
}

/**
 * Open Balance Alert Popup
 * @param alert
 * @param alert_state
 * @param disabled
 */
function openBalanceAlert(target, alert, alert_state, disabled) {
    target.setState({
        [alert_state]: true,
        balance_alert_text: alert,
        balance_alert_close_disabled: disabled
    });
}

/**
 * Close Balance Alert Popup
 */
function closeBalanceAlert(target) {
    target.setState({
        balance_alert: false,
        open_file_alert: false,
        create_new_wallet_alert: false,
        create_from_keys_alert: false,
        balance_alert_close_disabled: false
    });
}

/**
 * Open Send Cash Popup
 */
function openSendPopup(target, send_cash_or_token) {
    target.setState({
        send_modal: true,
        send_cash_or_token: send_cash_or_token
    });
}

/**
 * Close Send Popup
 */
function closeSendPopup(target) {
    target.setState({
        send_modal: false
    });
    setTimeout(() => {
        target.setState({
            send_cash_or_token: false
        });
    }, 300);
}

/**
 * Parse env object
 */
function parseEnv() {
    const env_obj = {};

    for (let key in process.env)
        env_obj[key.replace("REACT_APP_", "")] = process.env[key];

    return env_obj;
}

/**
 * Validate input
 */
function inputValidate(inputValue) {
    let inputRegex = /^[a-zA-Z0-9]/;
    return inputRegex.test(inputValue);
}

/**
 * Check input length (must be between 95 and 105 characters)
 */
function checkInputValueLenght(inputValue) {
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

/**
 * Check Input Prefix
 */
function checkInputValuePrefix(inputValue) {
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

export {
    verify_safex_address,
    structureSafexKeys,
    openBalanceAlert,
    closeBalanceAlert,
    openSendPopup,
    closeSendPopup,
    parseEnv,
    inputValidate,
    checkInputValueLenght,
    checkInputValuePrefix
};