const rpc = require('node-json-rpc');
const signing = require('@cosmjs/proto-signing');
const stargate = require("@cosmjs/stargate");
const launchpad = require("@cosmjs/launchpad");
const tx_5 = require("cosmjs-types/cosmos/tx/v1beta1/tx");
const rpcEndpoint = "https://rpc.cosmos-hub.app.beta.starport.cloud/";
const util = require("./util.js");

var balanceMap = new Map();

async function getAllBalance(address){
    //console.log("balance map:", balanceMap);
    const options = { };
    const client = await stargate.SigningStargateClient.connectWithSigner(rpcEndpoint, {}, options);
    let res = await client.getAllBalances(address);
    //console.log(address, "all balance: ", res);
    if(res.length > 0){
        let atomBalanceObj = res[res.length-1];
        if(atomBalanceObj &&  atomBalanceObj.denom == "uatom"){
            let balance = parseInt(atomBalanceObj.amount)/1000000;
            console.log(new Date().toLocaleString(), address, "atom:", balance);
            if( !balanceMap.has(address) ){
                balanceMap.set(address, balance);
                return;
            }
            let balanceBefore = balanceMap.get(address);
            if(balanceBefore != balance){
                let diff = balance - balanceBefore;
                console.log(new Date().toLocaleString(), address, "diff: ", diff);
                balanceMap.set(address, balance);
            }
        }
    }
}

async function monitor(address){
    for(;;){
        try {
            console.log(new Date().toLocaleString(), "balance monitor is running");
            await getAllBalance(address);
            await util.sleep(1000);
        } catch (e) {
            /* handle error */
            console.log(e);
            await util.sleep(3000);
            continue;
        }
    }
}

monitor("cosmos1njjlfh5q9j7vla8l76frr7zed22w8zfjf8jdhw");
monitor("cosmos13kfpdfq623ltkx325atx3pfv2h4nevdn3m5647");
