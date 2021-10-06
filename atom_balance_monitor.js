const rpc = require('node-json-rpc');
const signing = require('@cosmjs/proto-signing');
const stargate = require("@cosmjs/stargate");
const launchpad = require("@cosmjs/launchpad");
const tx_5 = require("cosmjs-types/cosmos/tx/v1beta1/tx");
const rpcEndpoint = "https://rpc.cosmos-hub.app.beta.starport.cloud/";
const util = require("./util.js");

async function getAllBalance(address){
   //let wallet = await signing.DirectSecp256k1HdWallet.fromMnemonic();
    const options = { };
    const client = await stargate.SigningStargateClient.connectWithSigner(rpcEndpoint, {}, options);
    let res = await client.getAllBalances(address);
    //console.log(address, "all balance: ", res);
    if(res.length > 0){
        let atomBalanceObj = res[res.length-1];
        if(atomBalanceObj &&  atomBalanceObj.denom == "uatom" && atomBalanceObj.amount != '0'){
            console.log(new Date().toLocaleString(), address, atomBalanceObj);
        }
    }
}

async function monitor(address){
    for(;;){
        console.log(new Date().toLocaleString(), "balance is running");
        await getAllBalance(address);
        await util.sleep(1000);
    }
}

monitor("cosmos1njjlfh5q9j7vla8l76frr7zed22w8zfjf8jdhw");
monitor("cosmos13kfpdfq623ltkx325atx3pfv2h4nevdn3m5647");
