pragma solidity 0.6;
// SPDX-License-Identifier: UNLICENSED
contract HelloWorld {
	event Print(string out);
	function SayHello() public {
		emit Print("Hello, world");
	}
}
