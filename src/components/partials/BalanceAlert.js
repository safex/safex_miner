import React from "react";

export default class BalanceAlert extends React.Component {
    render() {
        return (
            <div>
                <div className={this.props.balanceAlert
                    ? 'balanceAlert active'
                    : 'balanceAlert'}>
                    <div className="mainAlertPopupInner">
                        <p>{this.props.balanceAlertText}</p>
                        <span className="close" onClick={this.props.closeBalanceAlert}>X</span>
                    </div>
                </div>

                <div className={this.props.balanceAlert
                    ? 'balanceAlertBackdrop active'
                    : 'balanceAlertBackdrop'} onClick={this.props.closeBalanceAlert}>
                </div>
            </div>
        );
    }
}

