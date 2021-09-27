const encoding_1 = require("@cosmjs/encoding");
const signing = require('@cosmjs/proto-signing');
const stargate = require("@cosmjs/stargate");
const launchpad = require("@cosmjs/launchpad");
const tx_5 = require("cosmjs-types/cosmos/tx/v1beta1/tx");
const BigNumber = require('bignumber.js');
const util = require('./util.js');

// config
const rpcEndpoint = "https://rpc.cosmos-hub.app.beta.starport.cloud/";
const feeGas = 100000;          //180000;       // gas数量 用不完不退回
const feeGasPrice = 0.0025       //uatom 0.025
const gasLimit = 200000;
const denomUATOM = "uatom";

async function sendAtomLoopWithBeginSequence(mnemonic, to, fAmount, gasPriceTimes, feeAmount){
    let recipient = to;
    let memo = "" 

    let wallet = await signing.DirectSecp256k1HdWallet.fromMnemonic(mnemonic);
    const [firstAccount] = await wallet.getAccounts();
    console.log("address: ", firstAccount.address);
    const gasPrice = launchpad.GasPrice.fromString((feeGasPrice*gasPriceTimes).toString() + denomUATOM);
    const gasLimits = {
        send: gasLimit,
    };
    const options = { gasPrice: gasPrice, gasLimits: gasLimits };
    let bigAmount = 0;
    console.log("fAmount: ", fAmount);
    if(fAmount > 0){
        bigAmount = BigNumber(fAmount).times(Math.pow(10, 6)).toFixed();
    }else{
        res = await client.getBalance(firstAccount.address, 'uatom');
        console.log("balance: ", res.amount);
        bigAmount = (res.amount - feeAmount).toString();
    }

    console.log("big amount: ", bigAmount);
    
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

    let sendMsg = {
        typeUrl: "/cosmos.bank.v1beta1.MsgSend",
        value: {
            fromAddress: firstAccount.address,
            toAddress: recipient,
            amount: [...[amount]],
        },
    };

    // 预定未来loopAmount个sequenceid
    let signerData = {}
    let i = 0;
    const client = await stargate.SigningStargateClient.connectWithSigner(rpcEndpoint, wallet, options);
  
    let accountRes = await client.getAccount(firstAccount.address);

    signerData = {
        accountNumber: accountRes.accountNumber, 
        sequence: accountRes.sequence,
        chainId: "cosmoshub-4",
    }

    await signWithSequence(i, client, firstAccount.address, [sendMsg], fee, memo, signerData);
}

async function signWithSequence(index, client, signerAddress, messages, fee, memo, signerData){
    let txRaw = await client.sign(signerAddress, messages, fee, memo, signerData);
    let txBytes = tx_5.TxRaw.encode(txRaw).finish();
    let broadcasted = await client.forceGetTmClient().broadcastTxSync({tx: txBytes});
    console.log("broadcast index:", index);
    if (broadcasted.code) {
        console.log("braodcast code: ", broadcasted.code);
        console.log("broadcast codespace: ", broadcasted.codeSpace);
        console.log("broad.log: ", broadcasted.log);
    }
    const transactionId = encoding_1.toHex(broadcasted.hash).toUpperCase();
    console.log("transaction id: ", transactionId);
}

async function test(){
    let mnemonic = await util.readKeyFromFile("./key2.txt");
    //let to = "cosmos1aefsm3twqufrc95xpdlhxvj80c3huumcc40dft";                    // 收款人
    let to = "cosmos190f36xptgrpdzdezf285c306jnvgtzvrusk6rn";
    
    let feeAmount = 100;        // 手续费
    let gasPriceTimes = 1;      // gasPrice放大倍数
    let amount =  0.005;          //0.000001 atom数量
    await sendAtomLoopWithBeginSequence(mnemonic, to, amount, gasPriceTimes, feeAmount);
    await util.sleep(5000);
    
    amount = 0.0056;
    await sendAtomLoopWithBeginSequence(mnemonic, to, amount, gasPriceTimes, feeAmount);
    await util.sleep(10000);
    
    amount = 0.005;
    await sendAtomLoopWithBeginSequence(mnemonic, to, amount, gasPriceTimes, feeAmount);
    await util.sleep(10000);
    
    amount = 0.001;
    await sendAtomLoopWithBeginSequence(mnemonic, to, amount, gasPriceTimes, feeAmount);
    await util.sleep(10000);

    amount = 0.004;
    await sendAtomLoopWithBeginSequence(mnemonic, to, amount, gasPriceTimes, feeAmount);
}

test();