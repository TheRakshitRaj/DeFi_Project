// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockOptionToken is ERC20, Ownable {
    uint256 public strikePrice;
    uint256 public expiry;
    bool public isSettled;
    bool public exercised;

    event OptionMinted(address indexed to, uint256 amount);
    event OptionSettled(bool exercised, uint256 settlementPrice);

    constructor(
        string memory name,
        string memory symbol,
        uint256 _strikePrice,
        uint256 _expiry
    ) ERC20(name, symbol) Ownable(msg.sender) {
        strikePrice = _strikePrice;
        expiry = _expiry;
        isSettled = false;
        exercised = false;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
        emit OptionMinted(to, amount);
    }

    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }

    function settle(
        bool _exercised,
        uint256 settlementPrice
    ) external onlyOwner {
        require(!isSettled, "Already settled");
        require(block.timestamp >= expiry, "Not yet expired");
        isSettled = true;
        exercised = _exercised;
        emit OptionSettled(_exercised, settlementPrice);
    }

    function isExpired() external view returns (bool) {
        return block.timestamp >= expiry;
    }
}
