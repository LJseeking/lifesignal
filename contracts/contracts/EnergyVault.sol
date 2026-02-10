// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract EnergyVault {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;
    address public immutable treasury;
    uint256 public constant CREDIT_PER_TOKEN = 10;

    event EnergyCharged(address indexed user, uint256 tokenAmount, uint256 energyCredit);

    constructor(address _token, address _treasury) {
        require(_token != address(0), "INVALID_TOKEN");
        require(_treasury != address(0), "INVALID_TREASURY");
        token = IERC20(_token);
        treasury = _treasury;
    }

    /**
     * @dev Charges energy by transferring SIGNAL tokens to the treasury.
     * @param tokenAmount The amount of tokens to charge (in wei).
     */
    function charge(uint256 tokenAmount) external {
        require(tokenAmount > 0, "INVALID_AMOUNT");

        // Calculate energy credit before transfer
        uint256 energyCredit = quoteEnergyCredit(tokenAmount);

        // Transfer tokens directly to treasury
        token.safeTransferFrom(msg.sender, treasury, tokenAmount);

        emit EnergyCharged(msg.sender, tokenAmount, energyCredit);
    }

    /**
     * @dev Quotes the energy credit for a given token amount.
     * Formula: energyCredit = tokenAmount * 10 / 1e18
     */
    function quoteEnergyCredit(uint256 tokenAmount) public pure returns (uint256) {
        return (tokenAmount * CREDIT_PER_TOKEN) / 1e18;
    }
}
