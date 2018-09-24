import React from 'react';
import packageJson from "../../package";
const os = window.require('os');
const { shell } = window.require('electron')
const xmrigCpu = window.require('node-xmrig-cpu');


export default class MiningApp extends React.Component {
    constructor(props) {
        super(props);

        this.miner = null;

        this.state = {
            active: false,
            cpus: os.cpus().length,
            cpuChecked: true,
            hashrate: '0',
            address: 'SFXtzUofCsNdZZ8N9FRTp6185fw9PakKrY22DWVMtWGYFgPnFsA66cf7mgqXknyteb7T9FzMA3LfmBN2C6koS8yPcN1iC33FLyR',
            pool_url: '127.0.0.1:1111',
        };

        this.onChange = this.onChange.bind(this);
        this.openInfoPopup = this.openInfoPopup.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.startMining = this.startMining.bind(this);
        this.stopMining = this.stopMining.bind(this);
        this.footerLink = this.footerLink.bind(this);
        this.checkStatus = this.checkStatus.bind(this);
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

    handleSubmit(e) {
        e.preventDefault();
        var user_wallet = e.target.user_wallet;
        var pool = e.target.pool;

        if (user_wallet.value !== '') {
            if (pool.value !== '') {
                if (this.state.cpuChecked) {
                    if (this.state.active) {
                        this.setState({
                            active: false,
                            mining_info: false,
                            mining_info_text: '',
                        });
                    } else {
                        this.setState({
                            active: true,
                        });
                        this.openInfoPopup('Mining in progress');
                        this.startMining();
                        setTimeout(() => {
                            this.checkStatus();
                        }, 2000);
                    }
                } else {
                    this.openInfoPopup('Please select mining type');
                }
            } else {
                this.openInfoPopup('Please enter valid pool url');
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
            "background": true,
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
        var userWallet = this.state.address;
        var pool = this.state.pool_url;
        var numberOfCpu = 1;

        //specify jsonConfig.pools[0].url, jsonConfig.pools[0].user (safex address)
        jsonConfig.pools[0].url = pool;
        jsonConfig.pools[0].user = userWallet;

        console.log("User address: " + userWallet);
        console.log("Pool: " + pool);
        console.log("Number of CPU: " + numberOfCpu);

        console.log("Starting mining...");
        this.miner = new xmrigCpu.NodeXmrigCpu(JSON.stringify(jsonConfig));
        this.miner.startMining();
        console.log("Native mining started!");
    }

    stopMining() {
        console.log("Ending mining...");
        this.miner.stopMining();
        console.log("Mining ended");
    }

    checkStatus() {
        var counter = 0;

        this.setState({
            hashrate: this.miner.getStatus()
        });
        console.log(this.state.hashrate)

        counter++;
        if (counter < 20) {
            setTimeout(() => {
                this.checkStatus();
            }, 2000);
        }
        else {
            setTimeout(() => {
                this.stopMining();
            }, 2000);
        }
    }

    footerLink() {
        shell.openExternal('http://www.balkaneum.com/')
    }

    render() {
        var cores_options = [];
        for (var i = 1; i <= this.state.cpus; i += 1) {
            cores_options.push(<option key={i} value={i}>{i}</option>);
        }

        return (
            <div className="mining-app-wrap">
                <div className="mining-bg-wrap">
                    <img className={this.state.active ? "rotating" : ""} src="images/circles.png" alt="Circles"/>
                </div>
                <header>
                    <img src="images/logo.png" alt="Logo"/>
                    <p>{packageJson.version}</p>
                </header>

                <div className="main">
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
                                <p>cores</p>
                                <select className="form-control" name="cores" id="cores"
                                        disabled={this.state.active ? "disabled" : ""}>
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
                                <button type="submit" className="submit button-shine">
                                    Start
                                </button>
                        }
                        <p className={this.state.mining_info ? "mining-info active" : "mining-info"}>
                            {this.state.mining_info_text}
                        </p>
                    </form>

                    <div className="block">
                        <p className="blue-text">Block</p>
                        <p className="white-text">0/1000</p>
                    </div>

                    <div className="hashrate">
                        <p className="blue-text">hashrate:</p>
                        <p className="white-text">{this.state.hashrate} MB/s</p>
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
            </div>
        );
    }
}

MiningApp.contextTypes = {
    router: React.PropTypes.object.isRequired
};
