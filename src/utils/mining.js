const xmrigCpu = window.require("node-xmrig-cpu");

function miningStart(target) {
  let userWallet = document.getElementById("mining_address").value;
  let pool = document.getElementById("pool").value;
  let maxCpuUsage = document.getElementById("cpuUsage").value;

  //specify jsonConfig.pools[0].url, jsonConfig.pools[0].user (safex address)
  target.state.jsonConfig.pools[0].url = pool;
  target.state.jsonConfig.pools[0].user = userWallet;
  target.state.jsonConfig["max-cpu-usage"] = maxCpuUsage;

  console.log("User address: " + userWallet);
  console.log("Pool: " + pool);
  console.log("CPU usage: " + maxCpuUsage);
  console.log("Starting mining...");

  target.setState(() => ({
    active: true,
    starting: true
  }));
  target.openInfoPopup("Starting miner...");
  setTimeout(() => {
    target.setState(() => ({
      starting: false
    }));
    target.openInfoPopup("Mining in progress");
  }, 12000);

  if (target.miner) {
    target.miner.reloadConfig(JSON.stringify(target.state.jsonConfig));
  } else {
    target.miner = new xmrigCpu.NodeXmrigCpu(
      JSON.stringify(target.state.jsonConfig)
    );
  }
  target.miner.startMining();
  console.log("Native mining started!");

  let checkStatusInterval = setInterval(target.checkStatus, 2000);
  target.setState({
    checkStatusInterval: checkStatusInterval
  });
}

function miningStop(target) {
  target.setState(() => ({
    active: false,
    stopping: true
  }));
  target.openInfoPopup("Stopping miner...");
  setTimeout(() => {
    target.setState(() => ({
      mining_info: false,
      mining_info_text: "",
      stopping: false
    }));
  }, 5000);
  console.log("Ending mining...");
  clearInterval(target.state.checkStatusInterval);
  target.setState(() => ({
    hashrate: 0
  }));
  target.miner.stopMining();
  console.log("Mining ended");
}

export { miningStart, miningStop };
