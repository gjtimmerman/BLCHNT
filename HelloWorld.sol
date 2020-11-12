pragma solidity ^0.5.0;
contract HelloWorld {
	event Print(string out);
	function SayHello() public {
		emit Print("Hello, world");
	}
}
