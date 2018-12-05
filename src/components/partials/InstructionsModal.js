import React from "react";

export default class InstructionsModal extends React.Component {
    render() {
        return (
            <div
                className={this.props.instructionsModalActive ? 'modal instructions-modal active' : 'modal instructions-modal'}>
                <span className="close" onClick={this.props.closeInstructionsModal}>X</span>
                <div className="lang-bts-wrap">
                    <button
                        className={this.props.instructionsLang === 'english' ? "button-shine active" : "button-shine"}
                        onClick={this.props.changeInstructionLangEn}>EN
                    </button>
                    <button
                        className={this.props.instructionsLang === 'serbian' ? "button-shine active" : "button-shine"}
                        onClick={this.props.changeInstructionLangSrb}>SRB
                    </button>
                </div>
                {
                    this.props.instructionsLang === 'english'
                        ?
                        <div>
                            <h3>Instructions</h3>
                            <p>
                                If you don't already have a Safex Wallet, click the Create New Wallet File<button className="icon-btn"><img src="images/new-wallet.png" alt="new-wallet" /></button>button.
                                Enter password for your new wallet and click <button>Create New Wallet</button>. In the dialog box, enter the name for your wallet file and choose where you want to
                                save your wallet file on your file system. If you already have a wallet file, click Open Existing Wallet File<button className="icon-btn"><img src="images/open-logo.png" alt="open-logo" /></button>
                                button, enter the password for your wallet file and and click<button>Open Wallet File</button>button. If you want to create new wallet from keys click
                                <button className="icon-btn"><img src="images/create-from-keys.png" alt="create-from-keys" /></button>button. Enter your Safex address, private spend key, private view key and password and save it in
                                a wallet file by clicking<button>Create Wallet From Keys </button>button.
                            </p>
                            <p className="warning red">
                                Wallet files are made to control your coins, make sure you keep them safe at all times.
                                If you share or lose your wallet file it can and will result in total loss of your Safex Cash and Safex Tokens.
                            </p>
                            <p className="warning green">
                                Once your wallet file is saved, your Safex address will apear in the address field and you are ready to start mining.
                            </p>
                            <p>
                                Select one of the pools you want to connect to, choose how much CPU power you want to use for mining and click start to begin.
                                That's it, mining will start in a couple of seconds. Good luck!
                            </p>
                        </div>
                        :
                        <div>
                            <h3>Uputstvo</h3>
                            <p>
                                Ako nemate Safex Wallet, kliknite Create New Wallet File<button className="icon-btn"><img src="images/new-wallet.png" alt="new-wallet" /></button>dugme.
                                Unesite password za svoju datoteku i kliknite<button>Create New Wallet</button>. U dijalog prozoru, unesite ime za Vašu wallet datoteku i izaberite gde želite da ga sačuvate.
                                Ako već imate wallet datoteku, kliknite Open Existing Wallet File<button className="icon-btn"><img src="images/open-logo.png" alt="open-logo" /></button>dugme,
                                unesite password Vaše datoteke i kliknite <button>Open Wallet File</button>dugme. Ako želite da napravite novu datoteku od već postojećih ključeva, kliknite
                                <button className="icon-btn"><img src="images/create-from-keys.png" alt="create-from-keys" /></button>dugme. Unesite svoju Safex adresu, tajni spend ključ (private spend key),
                                tajni view ključ (private view key), password i sačuvajte datoteku klikom na<button>Create Wallet From Keys </button>dugme.
                            </p>
                            <p className="warning red">
                                Wallet datoteka kontroliše Vaše novčiće, zato je uvek čuvajte na bezbednom.
                                Ako podelite ili izgubite Vašu Wallet datoteku sigurno ćete izgubiti sav Vaš Safex Cash i Safex Tokene.
                            </p>
                            <p className="warning green">
                                Kada sačuvate Vašu datoteku, Vaša Safex adresa će se pojaviti u address polju i spremni ste da počnete sa rudarenjem.
                            </p>
                            <p>
                                Izaberite pool na koji želite da se povežete, izaberite koliku procesorku snagu želite da koristite i
                                kliknite Start da počnete sa rudarenjem. To je to, rudarenje će početi za par sekundi. Srećno!
                            </p>
                        </div>
                }
            </div>
        );
    }
}

