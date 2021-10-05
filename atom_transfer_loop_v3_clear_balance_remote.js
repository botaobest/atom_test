const encoding_1 = require("@cosmjs/encoding");
const signing = require('@cosmjs/proto-signing');
const stargate = require("@cosmjs/stargate");
const launchpad = require("@cosmjs/launchpad");
const tx_5 = require("cosmjs-types/cosmos/tx/v1beta1/tx");
const BigNumber = require('bignumber.js');
const util = require('./util.js');
const prompt = require('prompt');

// config
//const rpcEndpoint = "https://rpc.cosmoshub.forbole.com:443/";
const rpcEndpoint = "https://rpc.cosmos-hub.app.beta.starport.cloud/";
const feeGas = 100000;          //180000;       // gas数量 用不完不退回
const feeAmount = 100;      // uatom数量
const feeGasPrice = 0.025       //uatom 0.025
const gasLimit = 200000;
const denomUATOM = "uatom";

async function sendAtomLoopWithBeginSequence(mnemonic, to, gasPriceTimes){
    let recipient = to;
    let memo = ""
    let wallet = await signing.DirectSecp256k1HdWallet.fromMnemonic(mnemonic);
    const [firstAccount] = await wallet.getAccounts();
    const gasPrice = launchpad.GasPrice.fromString((feeGasPrice*gasPriceTimes).toString() + denomUATOM);
    const gasLimits = {
        send: gasLimit,
    };
    const options = { gasPrice: gasPrice, gasLimits: gasLimits };
    const client = await stargate.SigningStargateClient.connectWithSigner(rpcEndpoint, wallet, options);
    console.log("from: ", firstAccount.address);
    let i = 0;
    for(;;){
        try {
            res = await client.getBalance(firstAccount.address, 'uatom');
            console.log(firstAccount.address, "balance: ", res.amount);
            if(res.amount == 0){
                await util.sleep(500);
                continue;
            }

            if(res.amount <= feeAmount){
                await util.sleep(500);
                continue;
            }

            await util.sleep(10000);
            let bigAmount = (res.amount - feeAmount).toString();
            let fee = {
                amount: [
                    {
                        denom: denomUATOM,
                        amount: feeAmount.toString(),
                    },
                ],
                gas: feeGas.toString(), 
            };   
            let amount = {
                from_address: firstAccount.address,
                to_address: recipient,
                denom: denomUATOM,
                amount: bigAmount,  // 精度: 6
            };
            let accountRes = await client.getAccount(firstAccount.address);
            let signerData = {
                accountNumber: accountRes.accountNumber,
                sequence: accountRes.sequence,
                chainId: "cosmoshub-4",
            }
            let sendMsg = {
                typeUrl: "/cosmos.bank.v1beta1.MsgSend",
                value: {
                    fromAddress: firstAccount.address,
                    toAddress: recipient,
                    amount: [...[amount]],
                },
            };
            await signWithSequence(i, client, firstAccount.address, [sendMsg], fee, memo, signerData);
            i++;
            await util.sleep(100);
        } catch (error) {
            console.log(error)
            continue;
        }
    }
}

async function signWithSequence(index, client, signerAddress, messages, fee, memo, signerData){
    let txRaw = await client.sign(signerAddress, messages, fee, memo, signerData);
    let txBytes = tx_5.TxRaw.encode(txRaw).finish();
    let broadcasted = await client.forceGetTmClient().broadcastTxSync({tx: txBytes});
    console.log(index, "res: ", broadcasted);
    if (broadcasted.code) {
        console.log(`Broadcasting transaction failed with code ${broadcasted.code} codespace: ${broadcasted.codeSpace}, Log: ${broadcasted.log}`);
    }
    const transactionId = encoding_1.toHex(broadcasted.hash).toUpperCase();
    console.log("transaction id: ", transactionId);
}

async function test(){
    var schema = {
            properties: {
                mnemonic: {
                    hidden: true
                }
            }
        };
    let res = await prompt.get(schema);
    let mnemonic = res.mnemonic;
    if(mnemonic == ""){
        console.error("mnemonic is null");
        return;
    }

    let to = "cosmos13kfpdfq623ltkx325atx3pfv2h4nevdn3m5647";  // 收款人
    let gasPriceTimes = 1;                                     // gasPrice放大倍数
    await sendAtomLoopWithBeginSequence(mnemonic, to,  gasPriceTimes);
}

test();
