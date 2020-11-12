pragma solidity 0.6.0;
// SPDX-License-Identifier: UNLICENSED
contract HelloWorld {
	event Print(string out);
	function SayHello() public {
		emit Print("Hello, world");
	}
}
