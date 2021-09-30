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
    console.log(address, "all balance: ", res);
}

async function monitor(address){
    for(;;){
        await getAllBalance(address);
        await util.sleep(1000);
    }
}

monitor("cosmos1aefsm3twqufrc95xpdlhxvj80c3huumcc40dft");
monitor("cosmos190f36xptgrpdzdezf285c306jnvgtzvrusk6rn");