var swg = window.require("safex-addressjs");

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
 * Open Send Cash Popup
 */
function openSendPopup(target, send_cash_or_token) {
  target.setState({
    modal: true,
    send_modal: true,
    send_cash_or_token: send_cash_or_token
  });
}

/**
 * Close Send Popup
 */
function closeSendPopup(target) {
  target.setState({
    modal: false
  });
  setTimeout(() => {
    target.setState({
      send_modal: false,
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
    console.log("Safex hash address length is too short");
    this.openInfoPopup("Address length is too short");
    return false;
  } else if (inputValueLength >= 105) {
    console.log("Safex hash address length is too long");
    this.openInfoPopup("Address length is too long");
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
    if (
      !userInputValue.startsWith("SFXts") ||
      !userInputValue.startsWith("SFXti")
    ) {
      return true;
    } else {
      console.log("Suffix is invalid");
      return false;
    }
  } else {
    console.log("Suffix is invalid");
    return false;
  }
}

/**
 * Add class
 */
const addClass = (condition, className) => (condition ? ` ${className} ` : "");

/**
 * Open Modal
 * @param target
 * @param modal_type
 * @param alert
 * @param disabled
 */
function openModal(target, modal_type, alert, disabled) {
  if (modal_type === "balance_modal_active" && target.state.wallet_loaded) {
    target.setState({
      modal: true,
      balance_modal_active: true
    });
    target.startBalanceCheck();
    return false;
  }
  if (target.state.balance_modal_active && target.state.balance_alert) {
    target.setState({
      balance_modal_active: false
    });
    return false;
  }
  else {
    target.setState({
      modal: true,
      [modal_type]: true,
      balance_alert_text: alert,
      balance_alert_close_disabled: disabled
    });
  }
}

/**
 * Close All Modals
 */
function closeAllModals(target) {
  if (target.state.modal_close_disabled === false) {
    if (
      (target.state.new_wallet_modal && target.state.balance_alert) ||
      (target.state.create_new_wallet_modal && target.state.balance_alert) ||
      (target.state.create_from_keys_modal && target.state.balance_alert) ||
      (target.state.balance_modal_active && target.state.balance_alert) ||
      (target.state.open_from_existing_modal && target.state.balance_alert)
    ) {
      target.setState({
        balance_alert: false,
        balance_alert_close_disabled: false
      });
    } else if (target.state.send_modal) {
      target.setState({
        send_modal: false
      });
      return false;
    } else {
      target.setState({
        modal: false
      });
      setTimeout(() => {
        target.setState({
          new_wallet_modal: false,
          instructions_modal_active: false,
          balance_modal_active: false,
          balance_alert: false,
          balance_alert_close_disabled: false,
          open_file_alert: false,
          create_new_wallet_alert: false,
          create_from_keys_alert: false,
          send_cash: false,
          send_token: false,
          create_new_wallet_modal: false,
          open_from_existing_modal: false,
          create_from_keys_modal: false
        });
      }, 300);
    }
  }
}

export {
  verify_safex_address,
  structureSafexKeys,
  openSendPopup,
  closeSendPopup,
  parseEnv,
  inputValidate,
  checkInputValueLenght,
  checkInputValuePrefix,
  addClass,
  openModal,
  closeAllModals
};
