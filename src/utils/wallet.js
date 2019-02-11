import { verify_safex_address, parseEnv } from "../utils/utils";
const safex = window.require("safex-nodejs-libwallet");
const { dialog } = window.require("electron").remote;
const env = parseEnv();

function create_new_wallet(target, e) {
  e.preventDefault();
  const pass1 = e.target.pass1.value;
  const pass2 = e.target.pass2.value;
  console.log("new wallet password " + e.target.pass1.value);
  if (pass1 === "") {
    target.setOpenAlert("Enter password");
    return false;
  }
  if (pass2 === "") {
    target.setOpenAlert("Enter repeated password");
    return false;
  }
  if (pass1 !== pass2) {
    target.setOpenAlert("Repeated password does not match");
    return false;
  }
  dialog.showSaveDialog(filepath => {
    if (!filepath) {
      return false;
    }
    if (safex.walletExists(filepath)) {
      target.setOpenAlert(
        `Wallet already exists. Please choose a different file name.
        This application does not enable overwriting an existing wallet file
        OR you can open it using the Load Existing Wallet`
      );
      return false;
    }
    target.setState(() => ({ filepath }));
    var args = {
      path: filepath,
      password: pass1,
      network: env.NETWORK,
      daemonAddress: env.ADDRESS
    };
    target.setOpenAlert(
      "Please wait while your wallet file is being created",
      true
    );
    console.log(
      "wallet doesn't exist. creating new one: " + target.state.filepath
    );
    safex
      .createWallet(args)
      .then(wallet => {
        target.setState({
          wallet_loaded: true,
          wallet_meta: wallet,
          mining_info: false,
          wallet: {
            address: wallet.address(),
            spend_key: wallet.secretSpendKey(),
            view_key: wallet.secretViewKey()
          }
        });
        console.log("wallet address  " + target.state.wallet.address);
        console.log(
          "wallet spend private key  " + target.state.wallet.spend_key
        );
        console.log("wallet view private key  " + target.state.wallet.view_key);
        wallet.on("refreshed", () => {
          console.log("Wallet File successfully created!");
          target.closeAllModals();
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
        target.setOpenAlert("error with the creation of the wallet " + err);
      });
  });
  //pass dialog box
  //pass password
  //confirm password
}

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
    target.setOpenAlert("Fill out all the fields");
    return false;
  }
  if (pass1 === "" && pass2 === "" && pass1 !== pass2) {
    target.setOpenAlert("Passwords do not match");
    return false;
  }
  if (
    process.env.NODE_ENV !== "development" &&
    verify_safex_address(spend_key, view_key, safex_address) === false
  ) {
    target.setOpenAlert("Incorrect keys");
    return false;
  }
  dialog.showSaveDialog(filepath => {
    if (!filepath) {
      return false;
    }
    if (safex.walletExists(filepath)) {
      target.setOpenAlert(
        `Wallet already exists. Please choose a different file name.
        This application does not enable overwriting an existing wallet file
        OR you can open it using the Load Existing Wallet`
      );
      return false;
    }
    target.setState({ filepath });
    var args = {
      path: target.state.filepath,
      password: pass1,
      network: env.NETWORK,
      daemonAddress: env.ADDRESS,
      restoreHeight: 0,
      addressString: safex_address,
      viewKeyString: view_key,
      spendKeyString: spend_key
    };
    target.setOpenAlert(
      "Please wait while your wallet file is being created. Do not close the application until the process is complete. This may take some time, please be patient.",
      true
    );
    console.log(
      "wallet doesn't exist. creating new one: " + target.state.filepath
    );
    safex
      .createWalletFromKeys(args)
      .then(wallet => {
        console.log("Create wallet from keys performed!");
        target.setState({
          wallet_loaded: true,
          wallet_meta: wallet,
          mining_info: false,
          wallet: {
            address: wallet.address(),
            spend_key: wallet.secretSpendKey(),
            view_key: wallet.secretViewKey()
          }
        });
        console.log("wallet address: " + target.state.wallet.address);
        console.log(
          "wallet spend private key: " + target.state.wallet.spend_key
        );
        console.log("wallet view private key: " + target.state.wallet.view_key);
        wallet.on("refreshed", () => {
          console.log("Wallet File successfully created!");
          target.closeAllModals();
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
        target.setOpenAlert("Error with the creation of the wallet " + err);
      });
  });
}

function open_from_wallet_file(target, e) {
  e.preventDefault();
  const pass = e.target.pass.value;
  let filepath = e.target.filepath.value;

  if (filepath === "") {
    target.setOpenAlert("Choose the wallet file");
    return false;
  }
  if (pass === "") {
    target.setOpenAlert("Enter password for your wallet file");
    return false;
  }
  if (target.state.wallet_loaded) {
    target.closeWallet();
  }
  var args = {
    path: target.state.filepath,
    password: pass,
    network: env.NETWORK,
    daemonAddress: env.ADDRESS
  };
  target.setOpenAlert("Please wait while your wallet file is loaded", true);
  safex
    .openWallet(args)
    .then(wallet => {
      target.setState({
        wallet_loaded: true,
        wallet_meta: wallet,
        mining_info: false,
        wallet: {
          address: wallet.address(),
          spend_key: wallet.secretSpendKey(),
          view_key: wallet.secretViewKey()
        }
      });
      target.closeAllModals();
    })
    .catch(err => {
      target.setOpenAlert("Error opening the wallet: " + err, false);
    });
}

export {
  create_new_wallet,
  create_new_wallet_from_keys,
  open_from_wallet_file
};
