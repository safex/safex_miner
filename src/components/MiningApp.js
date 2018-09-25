import React from 'react';
import packageJson from "../../package";
const { shell } = window.require('electron')
const xmrigCpu = window.require('node-xmrig-cpu');

export default class MiningApp extends React.Component {
    constructor(props) {
        super(props);

        this.miner = null;

        this.state = {
            active: false,
            stopping: false,
            cpuChecked: true,
            hashrate: '0',
            address: '',
            pool_url: '',
            modal_active: false
        };

        this.onChange = this.onChange.bind(this);
        this.openInfoPopup = this.openInfoPopup.bind(this);
        this.openModal = this.openModal.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this.inputValidate = this.inputValidate.bind(this);
        this.checkInputValueLenght = this.checkInputValueLenght.bind(this);
        this.checkInputValuePrefix = this.checkInputValuePrefix.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.startMining = this.startMining.bind(this);
        this.stopMining = this.stopMining.bind(this);
        this.checkStatus = this.checkStatus.bind(this);
        this.footerLink = this.footerLink.bind(this);
    }

    onChange(e) {
        if (this.state.cpuChecked) {
            this.setState({
                cpuChecked: false
            });
        } else {
            this.setState({
                cpuChecked: true
            });
        }
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

    closeModal() {
        this.setState({
            modal_active: false
        })
    }

    inputValidate(inputValue) {
        let inputRegex = /^[a-zA-Z0-9]/;
        return inputRegex.test(inputValue);
    }

    checkInputValueLenght(inputValue) {
        let inputValueLength = inputValue.length;

        if (inputValueLength >= 105 || inputValueLength <= 95) {
            console.log('safexhashaddress length is too short.');
            return false;
        } else {
            return true;
        }
    }

    checkInputValuePrefix(inputValue) {
        let userInputValue = inputValue;

        if (userInputValue.startsWith("SFXt")) {
            if (!userInputValue.startsWith("SFXts") || !userInputValue.startsWith("SFXti") || !userInputValue.startsWith("Safex")) {
                return true;
            } else {
                console.log('SUFIX IS NOT GOOD');
                return false;
            }
        } else {
            console.log('SUFIX IS NOT GOOD');
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
                        if (pool.value !== '') {
                            if (this.state.cpuChecked) {
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
                                    }, 4000);
                                    this.stopMining();
                                } else {
                                    this.setState({
                                        active: true,
                                    });
                                    this.openInfoPopup('Mining in progress');
                                    this.startMining();
                                }
                            } else {
                                this.openInfoPopup('Please select mining type');
                            }
                        } else {
                            this.openInfoPopup('Please enter valid pool url');
                        }
                    } else {
                        this.openInfoPopup('Address sufix is not valid');
                    }
                } else {
                    this.openInfoPopup('Address length in too short');
                }
            else {
                this.openInfoPopup('Please enter valid address');
            }
        } else {
            this.openInfoPopup('Please enter valid address');
        }
    }

    startMining() {
        var jsonConfig = {
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
            "max-cpu-usage": 75,
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
        };
        var userWallet = document.getElementById("user_wallet").value;
        var pool = document.getElementById("pool").value;
        var maxCpuUsage = document.getElementById("cpuUsage").value;

        //specify jsonConfig.pools[0].url, jsonConfig.pools[0].user (safex address)
        jsonConfig.pools[0].url = pool;
        jsonConfig.pools[0].user = userWallet;
        jsonConfig["max-cpu-usage"] = maxCpuUsage;

        console.log("User address: " + userWallet);
        console.log("Pool: " + pool);
        console.log("CPU usage: " + maxCpuUsage);

        console.log("Starting mining...");
        this.miner = new xmrigCpu.NodeXmrigCpu(JSON.stringify(jsonConfig));
        this.miner.startMining();
        console.log("Native mining started!");

        let checkStatusInterval = setInterval(this.checkStatus, 2000)
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

    footerLink() {
        shell.openExternal('http://www.balkaneum.com/')
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
                <header>
                    <img src="images/logo.png" alt="Logo"/>
                    <p>{packageJson.version}</p>
                </header>

                <div className="main">
                    <button className="button-shine new-wallet-btn" onClick={this.openModal}>
                        New wallet
                    </button>
                    <form onSubmit={this.handleSubmit}>
                        <div className="address-wrap">
                            <img src="images/line-left.png" alt="Line Left"/>
                            <input type="text" placeholder="Address" name="user_wallet" id="user_wallet"
                                disabled={this.state.active ? "disabled" : ""}/>
                            <img src="images/line-right.png" alt="Line Right"/>
                        </div>

                        <input type="text" className="pool-url" name="pool" id="pool" placeholder="pool url"
                            disabled={this.state.active ? "disabled" : ""}/>

                        <div className="options">
                            <div className="input-group">
                                <p>CPU</p>
                                <label className={this.state.cpuChecked
                                    ? 'col-xs-12 custom-checkbox checked'
                                    : 'col-xs-12 custom-checkbox'}>
                                    <input type="checkbox" onChange={this.onChange}
                                        disabled={this.state.active ? "disabled" : ""}/>
                                </label>
                            </div>

                            <div className="input-group">
                                <p>CPU %</p>
                                <select className="form-control" name="cores" id="cpuUsage"
                                    disabled={this.state.active || this.state.cpuChecked === false ? "disabled" : ""}>
                                    {cores_options}
                                </select>
                            </div>
                        </div>
                        {
                            this.state.active
                            ?
                                <button type="submit" className="submit button-shine active">
                                    Stop
                                </button>
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

                    <div className="block">
                        <p className="blue-text">Block:</p>
                        <p className="white-text">0/1000</p>
                    </div>

                    <div className="hashrate">
                        <p className="blue-text">hashrate:</p>
                        <p className="white-text">{this.state.hashrate} H/s</p>
                    </div>

                    <div className="balance">
                        <p className="blue-text">balance:</p>
                        <p className="white-text">0.000</p>
                    </div>
                </div>

                <footer>
                    <p>powered by</p>
                    <a onClick={this.footerLink} title="Visit Balkaneum site">
                        <img src="images/balkaneum.png" alt="Balkaneum"/>
                    </a>
                </footer>

                <div className={this.state.modal_active ? 'modal active' : 'modal'}>
                    <span className="close" onClick={this.closeModal}>X</span>
                    <button id="new-wallet" className="button-shine">
                        Generate new wallet
                    </button>

                    <div className="form-group">
                        <label htmlFor="new-address">Your new wallet address:</label>
                        <input type="text" placeholder="New Wallet Address" readOnly />
                    </div>
                </div>

                <div className={this.state.modal_active ? 'backdrop active' : 'backdrop'}
                     onClick={this.closeModal}>
                </div>
            </div>
        );
    }
}

MiningApp.contextTypes = {
    router: React.PropTypes.object.isRequired
};
