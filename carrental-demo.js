function callbackForPromise(resolve,reject) {
    return function (error, result) {
        if (error) {
            reject(error);
        } else {
            resolve(result);
        }
    };
}

function solcCompile(sources) {
    input = { language: 'Solidity', sources: {},settings: {}};
    sources.map(source => {
      input.sources[source.key] = {};
      input.sources[source.key]['content']=source.value;
      input.settings['outputSelection']={}
      input.settings['outputSelection']['*'] = {};
      input.settings['outputSelection']['*']['*'] = {};
      input.settings['outputSelection']['*']['*'] = ['*'];
    });

    contr = JSON.parse(solc.compile(JSON.stringify(input)));
    if (contr.errors)
    {
      for(m of contr.errors)
        console.log(m.formattedMessage);
    }
    return contr.contracts;
}

async function deploy(compiledContract, gas) {
//      console.log(JSON.stringify(compiledContract.evm.bytecode.object));
        let contract = new web3.eth.Contract(compiledContract.abi); //,"0x04CED8C5DcD78645ca8080811E5bb9964488Eb3A");
        console.log("Created contract");
//        await contract.methods.destructContract().send({from: from, gas: 2000000});
        let deployedContract = await contract.deploy({data: '0x' + compiledContract.evm.bytecode.object  }).send({ from: from, gas: gas});
        console.log("Deployed contract");
        return deployedContract;
//        return contract;
}

async function compileContracts(paths) {
    let sources = [];
    promises = paths.map(async path => {
      let source = await new Promise( (resolve,reject) => fs.readFile(path, 'utf-8',callbackForPromise(resolve,reject)));
      sources.push({key: path, value: source});
    });
    await Promise.all(promises);
//    console.log(sources);
    return solcCompile(sources);
}

function strToBytes(str)
{
  let bytes = [];
  for(i = 0 ; i < str.length; i++)
    bytes.push(str.charCodeAt(i));
  return bytes;
}
function bytesToString(bytes)
{
  let str = ""
  for (c of bytes)
  {
    console.log(c);
    str += String.fromCharCode(c);
  }
  return str;
}
function printRentalAcceptedEvent(err, evt) {
  if (err)
  {
    console.log('Error', err);
  }
  else
    console.log('RentalAccepted Event');
    console.log("license: " + web3.utils.toAscii(evt.returnValues.license));
    console.log("number of rentals: " + evt.returnValues.numRentals);
    console.log("number of days: " + evt.returnValues.numDays);
}
async function compileAndDeployContracts(name)
{
  console.log('Compiling...');
  let contracts = await compileContracts(name);
/*  console.log('Deploying DateTime...');
  let contract1 = await deploy(contracts[name[1]]['DateTime'], 2000000);
  console.log(contract1.options.address);
  let bcode = await link.linkBytecode(contracts[name[0]]['CarRental'].evm.bytecode.object,{'DateTime.sol': {'DateTime': contract1.options.address}});
//  console.log(bcode);
  contracts[name[0]]['CarRental'].evm.bytecode.object = bcode;
  console.log('Deploying CarRental...');
  let contract2 = await deploy(contracts[name[0]]['CarRental'], 2000000);
  console.log('CarRental contract at', contract2.options.address);
  */
  let contract2 = new web3.eth.Contract(contracts[name[0]]['CarRental'].abi,"0xA4faCe72200D2b350eC802e503d23EF9C6b38f45");
  contract2.handleRevert = true;
  contract2.events.RentalAccepted(printRentalAcceptedEvent);

  try {
//    await  contract2.methods.addCar(strToBytes("AB12CD"),1000,strToBytes("Toyota")).send({from: from, gas: 2000000});
    await contract2.methods.rentCar(strToBytes("AB12CD"),2020,1,10,2020,2,5).send({from: from, value:1000, gas: 2000000});
    let numCars = await contract2.methods.getNumCars().call();
    console.log("number of cars: " + numCars);
  } catch (e) {
      console.log(e.name);
      console.log(e.message);
      console.log(e.reason);
  } finally {

  }
/*  await contract.methods.SayHello().send({from: from, gas: 2000000});
  let tx = await p1;
  console.log(JSON.stringify(tx));
  let mtx = await getMinedTransaction(tx);
  console.log(mtx);
*/
}

let solc = require('solc');
let link = require('solc/linker');
let Web3 = require('web3');
let net =  require('net');
let fs = require('fs');

let web3 = new Web3("\\\\.\\pipe\\geth.ipc",net);
let from = "0xf68ca8afa54a47de377fa96515568e6ae708a1bb";

let prom = compileAndDeployContracts(['CarRental.sol','DateTime.sol']);
prom.then(() => process.exit(0)).catch(err =>
{
  console.log(err);
  process.exit(1);
});
