var fs = require('fs');

var solc = require('solc');
var Q = require('q');

var readDir = Q.denodeify(fs.readdir);
var readFile = Q.denodeify(fs.readFile);
var stat = Q.denodeify(fs.stat);

function callbackForDefer(defer) {
    return function (error, result) {
        if (error) {
            defer.reject(error);
        } else {
            defer.resolve(result);
        }
    };
}

function getTransaction(txid) {
    var defer = Q.defer();
    web3.eth.getTransaction(txid, callbackForDefer(defer));
    return defer.promise;
}

function getMinedTransaction(txid) {
    return getTransaction(txid).then(function (tx) {
        if (tx.blockNumber) {
            return tx;
        } else {
            return Q.delay(1000).then(function () {
                return getMinedTransaction(txid);
            });
        }
    });
}

function readPath(basePath, path) {
    var fullPath = basePath + (path ? '/' + path : '');
    return stat(fullPath).then(function (stats) {
        if (stats.isFile()) {
            return readFile(fullPath, 'utf-8').then(function (contents) {
                return [{
                    key : path ? path : basePath ? basePath : '',
                    value: contents
                }];
            });
        } else if (stats.isDirectory()) {
            return readDir(fullPath).then(function (files) {
                var promises = files.filter(function (file) {
                    return !file.startsWith('.');
                }).map(function (file) {
                    return readPath(basePath, path ? path + '/' + file : file);
                });
                return Q.all(promises).then(function (results) {
                    return [].concat.apply([], results);
                });
            });
        }
    });
}

function kv2object(kv) {
    var obj = {};
    kv.forEach(function (item) {
        obj[item.key] = item.value;
    });
    return obj;
}

function solcCompile(sources) {
    input = { language: 'Solidity', sources: {},settings: {}};
    input.sources[sources[0].key] = {};
    input.sources[sources[0].key]['content']=sources[0].value;
    input.settings['outputSelection']={}
    input.settings['outputSelection']['*'] = {};
    input.settings['outputSelection']['*']['*'] = {};
    input.settings['outputSelection']['*']['*'] = ['*'];
    contr = JSON.parse(solc.compile(JSON.stringify(input)));
    return contr.contracts;
}

function compileContracts(path) {
    return readPath(path).then(solcCompile);
}

function deployer(web3, from) {
    return function deploy(compiledContract, gas) {
      console.log(JSON.stringify(compiledContract.evm.bytecode));
        var contract = new web3.eth.Contract(compiledContract.abi); //,"0x0928f2028e49a678231cd44cc360027f7b8dd369");
        var deferred = Q.defer();


            deferred.notify({ submitted: false });
            contract.deploy({data: '0x' + compiledContract.evm.bytecode.object  }).send({ from: from, gas: gas})
            .then(function(deployedContract)
            {
                 if (deployedContract.options.address) {
                     deferred.resolve(deployedContract);
                 } else {
                     deferred.notify({ submitted: true, contract: deployedContract });
                 }

            })

        .catch(function (error) {
            deferred.reject(error);
        });
        return deferred.promise;

return contract;
    }
}

function bytes32tostring(bytes32) {
    if (bytes32.substring(0, 2) != '0x') {
        throw 'input is not bytes32';
    } else if (bytes32.length % 2 != 0) {
        throw 'input is not bytes32';
    } else {
        return bytes32.match(/.{2}/g).filter(function (hex) {
            return hex != '0x' && hex != '00';
        }).map(function (hex) {
            return String.fromCharCode(parseInt(hex, 16));
        }).join('');
    }
}

var Web3 = require('web3');
var net =  require('net');


var web3 = new Web3("\\\\.\\pipe\\geth.ipc",net);
var from = "0xf68ca8afa54a47de377fa96515568e6ae708a1bb";
var deploy = deployer(web3, from);
console.log('Compiling...');
compileContracts('HelloWorld.sol')
  .then(function (contracts) {
        console.log('Deploying...');
        return deploy(contracts['HelloWorld.sol']['HelloWorld'], 2000000);
   })
      .then(function (contract) {
        function printEvent(err, evt) {
          if (err)
          {
            console.log('Error', err);
          }
          else {


          console.log('Event', evt.returnValues);
        }
        }
        console.log('HelloWorld contract at', contract.options.address);
        contract.events.Print(printEvent);
        var defer = Q.defer();

        contract.methods.SayHello().send({from: from, gas: 2000000},callbackForDefer(defer));
        return defer.promise;
    })
    .then(function (tx) {
        console.log(JSON.stringify(tx));
        getMinedTransaction(tx).then(function(tx)
      {
        console.log(tx);
      })
    })

    .catch(function (err) {
        console.error(err);
        process.exit(1);
    });
