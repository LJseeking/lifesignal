// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SignalToken is ERC20, Ownable {
    constructor(uint256 initialSupply) ERC20("Signal Token", "SIGNAL") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);
    }

    /**
     * @dev Function to mint tokens, only owner can call.
     * Useful for testing purposes.
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
