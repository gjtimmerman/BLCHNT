//var abi = [{"constant":false,"inputs":[{"name":"prompt","type":"string"}],"name":"SayHello","outputs":[],"type":"function"},{"anonymous":false,"inputs":[{"indexed":false,"name":"prompt","type":"string"}],"name":"Hello","type":"event"}];
//var myContract = web3.eth.contract(abi);
//var myContractInstance = myContract.at('0xb0ab0be4e9df83fad917b855d127c7f10c63edda');
//var myEvent = myContractInstance.Print();
var myEvent = HWinstance.Print();

//myEvents.stopWatching();

myEvent.watch(function(error,event)
{
	if (!error)
	{

		console.log("Succeeded: " + JSON.stringify(event.args) );

	}
		else {

			console.log("Error");

		}
}
);
