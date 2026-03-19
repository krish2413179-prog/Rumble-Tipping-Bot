// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TippingPool
 * @dev Community-driven tipping pools for Rumble creators
 */
contract TippingPool is Ownable, ReentrancyGuard {
    struct Pool {
        string name;
        address beneficiary;
        uint256 goal;
        uint256 totalRaised;
        uint256 deadline;
        bool distributed;
        address[] contributors;
        mapping(address => uint256) contributions;
    }

    IERC20 public usdtToken;
    uint256 public poolCount;
    mapping(uint256 => Pool) public pools;
    
    event PoolCreated(uint256 indexed poolId, string name, address beneficiary, uint256 goal, uint256 deadline);
    event Contribution(uint256 indexed poolId, address contributor, uint256 amount);
    event PoolDistributed(uint256 indexed poolId, uint256 amount);

    constructor(address _usdtToken) Ownable(msg.sender) {
        usdtToken = IERC20(_usdtToken);
    }

    function createPool(
        string memory name,
        address beneficiary,
        uint256 goal,
        uint256 durationDays
    ) external returns (uint256) {
        require(beneficiary != address(0), "Invalid beneficiary");
        require(goal > 0, "Goal must be positive");
        
        uint256 poolId = poolCount++;
        Pool storage pool = pools[poolId];
        pool.name = name;
        pool.beneficiary = beneficiary;
        pool.goal = goal;
        pool.deadline = block.timestamp + (durationDays * 1 days);
        pool.distributed = false;
        
        emit PoolCreated(poolId, name, beneficiary, goal, pool.deadline);
        return poolId;
    }

    function contribute(uint256 poolId, uint256 amount) external nonReentrant {
        Pool storage pool = pools[poolId];
        require(block.timestamp < pool.deadline, "Pool expired");
        require(!pool.distributed, "Pool already distributed");
        require(amount > 0, "Amount must be positive");
        
        require(usdtToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        if (pool.contributions[msg.sender] == 0) {
            pool.contributors.push(msg.sender);
        }
        
        pool.contributions[msg.sender] += amount;
        pool.totalRaised += amount;
        
        emit Contribution(poolId, msg.sender, amount);
    }

    function distributeFunds(uint256 poolId) external nonReentrant {
        Pool storage pool = pools[poolId];
        require(!pool.distributed, "Already distributed");
        require(block.timestamp >= pool.deadline || pool.totalRaised >= pool.goal, "Pool not ready");
        
        pool.distributed = true;
        uint256 amount = pool.totalRaised;
        
        require(usdtToken.transfer(pool.beneficiary, amount), "Transfer failed");
        
        emit PoolDistributed(poolId, amount);
    }

    function getPoolInfo(uint256 poolId) external view returns (
        string memory name,
        address beneficiary,
        uint256 goal,
        uint256 totalRaised,
        uint256 deadline,
        bool distributed,
        uint256 contributorCount
    ) {
        Pool storage pool = pools[poolId];
        return (
            pool.name,
            pool.beneficiary,
            pool.goal,
            pool.totalRaised,
            pool.deadline,
            pool.distributed,
            pool.contributors.length
        );
    }

    function getContribution(uint256 poolId, address contributor) external view returns (uint256) {
        return pools[poolId].contributions[contributor];
    }
}
