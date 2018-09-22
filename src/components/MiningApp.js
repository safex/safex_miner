import React from 'react';
import packageJson from "../../package";
const os = window.require('os');

export default class MiningApp extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            active: false,
            cpuChecked: true
        };

        this.onChange = this.onChange.bind(this);
        this.openInfoPopup = this.openInfoPopup.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
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
        var address = e.target.address;
        var pool_url = e.target.pool_url;

        if (address.value !== '') {
            if (pool_url.value !== '') {
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
                        this.openInfoPopup('Mining in progress')
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

    render() {
        var cores_options = [];
        for (var i = 1; i <= os.cpus().length; i += 1) {
            cores_options.push(<option key={i} value={i}>{i}</option>);
        }
        return (
            <div className="mining-app-wrap">
                <div className="mining-bg-wrap">
                    <img className={this.state.active ? "rotating" : ""} src="images/circles.png" alt="Circles" />
                </div>
                <header>
                    <img src="images/logo.png" alt="Logo" />
                    <p>{packageJson.version}</p>
                </header>

                <div className="main">
                    <form onSubmit={this.handleSubmit}>
                        <div className="address-wrap">
                            <img src="images/line-left.png" alt="Line Left" />
                            <input type="text" placeholder="Address" name="address" disabled={this.state.active ? "disabled" : ""} />
                            <img src="images/line-right.png" alt="Line Right" />
                        </div>

                        <input type="text" className="pool-url" placeholder="pool url" name="pool_url" disabled={this.state.active ? "disabled" : ""} />

                        <div className="options">
                            <div className="input-group">
                                <p>CPU</p>
                                <label className={this.state.cpuChecked
                                    ? 'col-xs-12 custom-checkbox checked'
                                    : 'col-xs-12 custom-checkbox'}>
                                    <input type="checkbox" onChange={this.onChange} disabled={this.state.active ? "disabled" : ""} />
                                </label>
                            </div>

                            <div className="input-group">
                                <p>cores</p>
                                <select className="form-control" name="cores" id="cores" disabled={this.state.active ? "disabled" : ""}>
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
                        <p className="white-text">400MB/s</p>
                    </div>

                    <div className="balance">
                        <p className="blue-text">balance:</p>
                        <p className="white-text">0.000</p>
                    </div>
                </div>

                <footer>
                    <p>powered by</p>
                    <a>
                        <img src="images/balkaneum.png" alt="Balkaneum" />
                    </a>
                </footer>
            </div>
        );
    }
}

MiningApp.contextTypes = {
    router: React.PropTypes.object.isRequired
};
