pragma solidity ^0.6.0;
abstract contract Player {
	function fizzbuzz(uint n) public pure virtual returns (bytes32 answer);
}

contract AlwaysFizz is Player {
	function fizzbuzz(uint n) public pure override returns (bytes32 answer) {
		answer = "Fizz";
	}
}

contract CorrectFizzBuzz is Player {
    function printInt(uint n) internal pure returns (uint value) {
        uint factor = 1;
        while (n > 0) {
            value |= (0x30 + (n % 10)) * factor;
            n /= 10;
            factor *= 0x100;
        }
    }

	function fizzbuzz(uint n) public pure override returns (bytes32 answer) {
		if (n % 15 == 0) {
			answer = "Fizz Buzz";
		} else if (n % 3 == 0) {
			answer = "Fizz";
		} else if (n % 5 == 0) {
			answer = "Buzz";
		} else {
            answer = bytes32(printInt(n));
		}
	}
}

contract Game is CorrectFizzBuzz {

 	struct PlayerData {
		Player player;
		address payable owner;
		string name;
	}

 	event NewPlayer(address indexed player, uint index, string name);
	event ReplacePlayer(address indexed player, uint index, string name);
    event Reward(address indexed player, string name, uint input, bytes32 output);
    event NoReward(address indexed player, string name, uint input, bytes32 expectedOutput, bytes32 actualOutput);

	// Maps name to index of the Player
	mapping (string => uint) playersByName;

	PlayerData[] playerData;

    address payable gameMaster;

	constructor() public {
		playerData.push(PlayerData(Player(0), address(0), ""));
        gameMaster = msg.sender;
 	}

	// Register a Player that plays on your behalf
	function register(address _player, string memory _name) public {
		uint index = playersByName[_name];
		if (index != 0) {
			PlayerData storage replacePlayer = playerData[index];
			replacePlayer.player = Player(_player);
			replacePlayer.owner = msg.sender;

			emit ReplacePlayer(_player, index, _name);
		} else {
			index = playerData.length;

            playerData.push(PlayerData(Player(_player), msg.sender, _name));
			playersByName[_name] = index;

			emit NewPlayer(_player, index, _name);
		}
	}

    function playerCount() public view returns (uint count) {
        count = playerData.length - 1;
    }

    function playerName(uint _index) public view returns (string memory name) {
        name = playerData[_index].name;
    }

    function payout() public {
        gameMaster.transfer(address(this).balance);
    }

	function play(uint n) public payable{
		uint reward = msg.value / playerData.length;
		bytes32 expectedAnswer = fizzbuzz(n);
		for (uint i = 1; i < playerData.length; i++) {
			PlayerData storage player = playerData[i];
			bytes32 givenAnswer = player.player.fizzbuzz(n);
			if (givenAnswer == expectedAnswer) {
				player.owner.transfer(reward);
                emit Reward(address(player.player), player.name, n, givenAnswer);
			} else {
                emit NoReward(address(player.player), player.name, n, expectedAnswer, givenAnswer);
            }
		}
	}

}

