const rpc = require('node-json-rpc');
const signing = require('@cosmjs/proto-signing');
const stargate = require("@cosmjs/stargate");
const launchpad = require("@cosmjs/launchpad");
const tx_5 = require("cosmjs-types/cosmos/tx/v1beta1/tx");

const util = require("./util.js");
const atom_util = require("./atom_util.js");


const rpcEndpoint = "https://rpc.cosmos-hub.app.beta.starport.cloud/";

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

async function monitor(){
    let mnemonic = "";
    let accounts = await atom_util.getAccounts(mnemonic, 10000);
    for(let i = 0; i < Object.values(accounts).length; i++){
        let add = Object.values(accounts)[i].address;
        try {
            console.log(new Date().toLocaleString(), "balance monitor is running, address index: ", i);
            await getAllBalance(add);
            await util.sleep(1000);
        } catch (e) {
            /* handle error */
            console.log(e);
            await util.sleep(3000);
            continue;
        }
    }
}

monitor();
