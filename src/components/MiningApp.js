import React from 'react';
import packageJson from "../../package";
const { shell } = window.require('electron')
const xmrigCpu = window.require('node-xmrig-cpu');
const sa = window.require('safex-addressjs');
import {CopyToClipboard} from 'react-copy-to-clipboard';
const fileDownload = window.require('js-file-download');
const safex = window.require('safex-nodejs-libwallet');


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
            spendkey_sec: '',
            viewkey_sec: '',
            exported: false,
            hashrate: '0',
            address: '',
            pool_url: '',
            modal_active: false,
            instructions_modal_active: false,
            balance_modal_active: false,
            instructions_lang: 'english',
            balance_wallet: 'SFXtzRzqWR2J3ytgxg1AxBfM8ZFgZmywoXHtqeqwsk3Gi63B2c3mvLNct35m268Pg2eGqHLmJubC7GPdvb1KxhTvHeVd4WKD9RQ',
            balance_view_key: '9e7aba8ae9ee134e5d5464d9145a4db26793d7411af7d06f20e755cb2a5ad50f',
            balance_spend_key: '283d8bab1aeaee8f8b5aed982fc894c67d3e03db9006e488321c053f5183310d',
            balance_check: false,
            wallet_password: '',
            jsonConfig: {
                "algo": "cryptonight/1",
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
    }

    openInfoPopup(message) {
        this.setState({
            mining_info: true,
            mining_info_text: message
        })
    }

    openModal() {
        this.setState({
            modal_active: true
        })
    }

    openInstructionsModal() {
        this.setState({
            instructions_modal_active: true
        })
    }


    startBalanceCheck() {
        this.setState({
            balance_check: true
        });

        var args = {
            'path': wallet_path,
            'password': '123',
            'network': 'testnet',
            'daemonAddress': 'localhost:29393',
            'restoreHeight': 0,
            'mnemonic' : 'nifty inflamed against focus gasp ethics spying gulp tiger cogs evicted cohesive woken nylon erosion tell saved fatal alkaline acquire lemon maps hull imitate saved'
        }

    }

    openBalanceModal() {
        this.setState({
            balance_modal_active: true
        });

        this.startBalanceCheck();
    }

    closeModal() {
        this.setState({
            modal_active: false,
            instructions_modal_active: false,
            balance_modal_active: false
        })
    }



    changeInstructionLang(lang) {
        this.setState({
            instructions_lang: lang
        })
    }

    inputValidate(inputValue) {
        let inputRegex = /^[a-zA-Z0-9]/;
        return inputRegex.test(inputValue);
    }

    checkInputValueLenght(inputValue) {
        let inputValueLength = inputValue.length;

        if (inputValueLength <= 95) {
            console.log('Safexhashaddress length is too short');
            this.openInfoPopup('Address length is too short');
            return false;
        } else if (inputValueLength >= 105) {
            console.log('Safexhashaddress length is too long');
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
        var pool = e.target.pool;
        let inputValue = e.target.user_wallet.value;

        if (user_wallet.value !== '') {
            if (this.inputValidate(inputValue))
                if (this.checkInputValueLenght(inputValue)) {
                    if (this.checkInputValuePrefix(inputValue)) {
                        if (this.state.active) {
                            this.setState({
                                active: false,
                                stopping: true
                            });
                            this.openInfoPopup('Stopping miner...');
                            setTimeout(() => {
                                this.setState({
                                    mining_info: false,
                                    mining_info_text: '',
                                    stopping: false
                                });
                            }, 5000);
                            this.stopMining();
                        } else {
                            this.setState({
                                active: true,
                                starting: true
                            });
                            this.openInfoPopup('Starting miner...');
                            setTimeout(() => {
                                this.setState({
                                    starting: false
                                });
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
        this.setState({hashrate: 0})
        this.miner.stopMining();
        console.log("Mining ended");
    }

    checkStatus() {
        this.setState({
            hashrate: this.miner.getStatus().split(' ')[2]
        });
        console.log(this.miner.getStatus(), this.state.hashrate);
    }

    newWallet(){
        const seed   = sa.sc_reduce32(sa.rand_32());
        const keys   = sa.create_address(seed);
        const pubkey = sa.pubkeys_to_string(keys.spend.pub, keys.view.pub);

        localStorage.setItem('wallet', JSON.stringify(keys));
        this.setState({
            exported: false,
            new_wallet_generated: true,
            new_wallet: pubkey,
            spendkey_sec: keys.spend.sec,
            viewkey_sec: keys.view.sec,
        })
    }

    exportWallet() {
        var wallet_data = JSON.parse(localStorage.getItem('wallet'));
        var keys = "";

        keys += "Public address: " + wallet_data.public_addr + '\n';
        keys += "Spendkey " + '\n';
        keys += "pub: "     + wallet_data.spend.pub + '\n';
        keys += "sec: "     + wallet_data.spend.sec + '\n';
        keys += "Viewkey "  + '\n';
        keys += "pub: "     + wallet_data.view.pub + '\n';
        keys += "sec: "     + wallet_data.view.sec + '\n';
        var date = Date.now();

        fileDownload(keys, date + 'unsafex.txt');

        this.setState({
            exported: true
        })
    }

    footerLink() {
        shell.openExternal('https://www.safex.io/')
    }


    render() {
        var cores_options = [];
        for (var i = 25; i <= 100; i += 25) {
            cores_options.push(<option key={i} value={i}>{i}%</option>);
        }

        return (
            <div className="mining-app-wrap">
                <div className="mining-bg-wrap">
                    <img className={this.state.active || this.state.stopping ? "rotating" : ""} src="images/circles.png" alt="Circles"/>
                </div>
                <header className="animated fadeIn">
                    <img src="images/logo.png" alt="Logo"/>
                    <p className="animated fadeIn">{packageJson.version}</p>
                </header>

                <div className="main animated fadeIn">
                    <button className="button-shine new-wallet-btn" onClick={this.openModal}>
                        New wallet
                    </button>
                    <button className="button-shine instructions-btn" onClick={this.openInstructionsModal} title="Instructions">
                        ?
                    </button>
                    <form onSubmit={this.handleSubmit}>
                        <div className="address-wrap">
                            <img src="images/line-left.png" alt="Line Left"/>
                            <input type="text" placeholder="Safex address" name="user_wallet" id="user_wallet"
                                disabled={this.state.active ? "disabled" : ""}/>
                            <img src="images/line-right.png" alt="Line Right"/>
                        </div>

                        <select className="pool-url" name="pool" id="pool" disabled={this.state.active ? "disabled" : ""}>
                            <option>pool.safexnews.net:1111</option>
                            <option>safex.cool-pool.net:3333</option>
                            <option>safex.cnpools.space:3333</option>
                            <option>safex.cnpools.space:1111</option>
                            <option>safex.cryptominingpools.net:3333</option>
                            <option>safex.luckypool.io:3366</option>
                            <option>safex.xmining.pro:3333</option>
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
                                        <button type="submit" className="submit button-shine active" disabled={this.state.active || this.state.stopping ? "disabled" : ""}>
                                            <span>Stopping</span>
                                        </button>
                                    :
                                        <button type="submit" className="submit button-shine" disabled={this.state.active || this.state.stopping ? "disabled" : ""}>
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

                    <button className="button-shine balance-wallet-btn" onClick={this.openBalanceModal}>
                        CHECK BALANCE
                    </button>
                </div>

                <footer className="animated fadeIn">
                    <p>powered by</p>
                    <a onClick={this.footerLink} title="Visit our site">
                        <img src="images/balkaneum.png" alt="Balkaneum"/>
                    </a>
                </footer>


                <div className={this.state.modal_active ? 'modal active' : 'modal'}>
                    <span className="close" onClick={this.closeModal}>X</span>
                    <button id="new-wallet" className="button-shine" onClick={this.newWallet}>
                        Generate new wallet
                    </button>

                    <div className="form-group">
                        <label htmlFor="new-address">Your new wallet address:</label>
                        <textarea placeholder="New Wallet Address" value={this.state.new_wallet} rows="2" onChange={({target: {value}}) => this.setState({value, copied: false})} readOnly >

                        </textarea>
                        <div className={this.state.new_wallet_generated ? "spendview active" : "spendview"}>
                            {
                                this.state.copied
                                ?
                                    <CopyToClipboard text={this.state.new_wallet} onCopy={() => this.setState({copied: true})} className="button-shine copy-btn" disabled={this.state.new_wallet === '' ? "disabled" : ""}>
                                        <button>
                                            Copied Address
                                        </button>
                                    </CopyToClipboard>
                                :
                                    <CopyToClipboard text={this.state.new_wallet} onCopy={() => this.setState({copied: true})} className="button-shine copy-btn" disabled={this.state.new_wallet === '' ? "disabled" : ""}>
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


                <div className={this.state.instructions_modal_active ? 'modal instructions-modal active' : 'modal instructions-modal'}>
                    <span className="close" onClick={this.closeModal}>X</span>
                    <div className="lang-bts-wrap">
                        <button className={this.state.instructions_lang === 'english' ? "button-shine active" : "button-shine"} onClick={this.changeInstructionLang.bind(this, 'english')}>EN</button>
                        <button className={this.state.instructions_lang === 'serbian' ? "button-shine active" : "button-shine"} onClick={this.changeInstructionLang.bind(this, 'serbian')}>SRB</button>
                    </div>
                        {
                            this.state.instructions_lang === 'english'
                            ?
                                <div>
                                    <h3>Instructions</h3>
                                    <p>
                                        If you don't already have a Safex Wallet, click the <button>new wallet</button> button.
                                        In the dialog box, click <button>generate new wallet</button> which will create new Safex Wallet. Be sure to
                                        <button className="red-btn red-btn-en">save wallet keys</button> before proceeding.
                                    </p>
                                    <p>
                                        <strong>
                                            Wallet keys are made to control your coins, make sure you keep them safe at all times.
                                            If your keys get stolen it can and will result in total loss of your Safex Cash.
                                        </strong>
                                    </p>
                                    <p className="warning green">
                                        Once your wallet keys are saved, you are ready to start mining. <button className="green-btn">wallet keys saved</button>
                                    </p>
                                    <p>
                                        Enter you wallet address in the Safex Address field, select one of the pools you want to connect to, choose how much CPU power you want to use for mining and click start to begin.
                                        That's it, mining will start in a couple of seconds. Good luck!
                                    </p>
                                </div>
                            :
                                <div>
                                    <h3>Uputstvo</h3>
                                    <p>
                                        Ako nemate Safex Wallet, kliknite <button>new wallet</button> dugme.
                                        U dialog prozoru kliknite <button className="gen-new-wallet-sr">generate new wallet</button> dugme koje će kreirati novi Safex Wallet.
                                        Obavezno sačuvajte Vaše ključeve <button className="red-btn">save wallet keys</button> pre nego što nastavite.
                                    </p>
                                    <p>
                                        <strong>
                                            Ovi ključevi kontrolišu Vaše novčiće, zato ih uvek čuvajte na bezbednom.
                                            Ako Vaši ključevi budu ukradeni sigurno ćete izgubiti sav Vaš Safex Cash.
                                        </strong>
                                    </p>
                                    <p className="warning green">
                                        Sačuvajte Vaše ključeve, i spremni ste da počnete sa rudarenjem. <button className="green-btn">wallet keys saved</button>
                                    </p>
                                    <p>
                                        Ukucajte adresu Vašeg wallet-a u predviđeno polje, izaberite pool na koji želite da se povežete, izaberite koliku procesorku snagu želite da koristite i počnite sa rudarenjem.
                                        To je to, rudarenje će početi za par sekundi. Srećno!
                                    </p>
                                </div>
                        }
                </div>

                <div className={this.state.balance_modal_active ? 'modal balance-modal active' : 'modal balance-modal'}>
                    <span className="close" onClick={this.closeModal}>X</span>
                    <div className="lang-bts-wrap">
                        {/*<button className={this.state.instructions_lang === 'english' ? "button-shine active" : "button-shine"} onClick={this.changeInstructionLang.bind(this, 'english')}>EN</button>*/}
                        {/*<button className={this.state.instructions_lang === 'serbian' ? "button-shine active" : "button-shine"} onClick={this.changeInstructionLang.bind(this, 'serbian')}>SRB</button>*/}
                    </div>
                    <textarea placeholder="Safex Wallet Address" value={this.state.balance_wallet} rows="2" readOnly />
                    <textarea placeholder="Safex Private View Key" value={this.state.balance_view_key} rows="1" readOnly />
                    <textarea placeholder="Safex Private View Key" value={this.state.balance_spend_key} rows="1" readOnly />
                    <textarea placeholder="Wallet pass" value={this.state.wallet_password} rows="1" readOnly />


                </div>

                <div className={this.state.modal_active || this.state.instructions_modal_active  || this.state.balance_modal_active ? 'backdrop active' : 'backdrop'} onClick={this.closeModal}>
                </div>
            </div>
        );
    }
}

MiningApp.contextTypes = {
    router: React.PropTypes.object.isRequired
};
