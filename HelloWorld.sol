pragma solidity ^0.6.0;
contract HelloWorld {
	event Print(string out);
	function SayHello() public {
		emit Print("Hello, world");
	}
}
