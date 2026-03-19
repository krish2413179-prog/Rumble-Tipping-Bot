// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SplitPayment
 * @dev Smart splits between creators, collaborators, or causes
 */
contract SplitPayment is ReentrancyGuard {
    struct Split {
        address recipient;
        uint256 percentage; // basis points (10000 = 100%)
    }

    struct SplitConfig {
        Split[] splits;
        address creator;
        bool active;
    }

    IERC20 public usdtToken;
    uint256 public splitCount;
    mapping(uint256 => SplitConfig) public splitConfigs;
    
    event SplitCreated(uint256 indexed splitId, address creator);
    event SplitExecuted(uint256 indexed splitId, uint256 totalAmount);
    event PaymentSplit(uint256 indexed splitId, address recipient, uint256 amount);

    constructor(address _usdtToken) {
        usdtToken = IERC20(_usdtToken);
    }

    function createSplit(Split[] memory splits) external returns (uint256) {
        require(splits.length > 0, "No splits provided");
        
        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < splits.length; i++) {
            require(splits[i].recipient != address(0), "Invalid recipient");
            require(splits[i].percentage > 0, "Invalid percentage");
            totalPercentage += splits[i].percentage;
        }
        require(totalPercentage == 10000, "Percentages must sum to 100%");
        
        uint256 splitId = splitCount++;
        SplitConfig storage config = splitConfigs[splitId];
        config.creator = msg.sender;
        config.active = true;
        
        for (uint256 i = 0; i < splits.length; i++) {
            config.splits.push(splits[i]);
        }
        
        emit SplitCreated(splitId, msg.sender);
        return splitId;
    }

    function executeSplit(uint256 splitId, uint256 amount) external nonReentrant {
        SplitConfig storage config = splitConfigs[splitId];
        require(config.active, "Split not active");
        require(amount > 0, "Amount must be positive");
        
        require(usdtToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        for (uint256 i = 0; i < config.splits.length; i++) {
            Split memory split = config.splits[i];
            uint256 splitAmount = (amount * split.percentage) / 10000;
            
            require(usdtToken.transfer(split.recipient, splitAmount), "Split transfer failed");
            emit PaymentSplit(splitId, split.recipient, splitAmount);
        }
        
        emit SplitExecuted(splitId, amount);
    }

    function getSplitInfo(uint256 splitId) external view returns (
        address creator,
        bool active,
        uint256 recipientCount
    ) {
        SplitConfig storage config = splitConfigs[splitId];
        return (config.creator, config.active, config.splits.length);
    }

    function getSplitRecipient(uint256 splitId, uint256 index) external view returns (
        address recipient,
        uint256 percentage
    ) {
        require(index < splitConfigs[splitId].splits.length, "Index out of bounds");
        Split memory split = splitConfigs[splitId].splits[index];
        return (split.recipient, split.percentage);
    }

    function deactivateSplit(uint256 splitId) external {
        require(splitConfigs[splitId].creator == msg.sender, "Not creator");
        splitConfigs[splitId].active = false;
    }
}
