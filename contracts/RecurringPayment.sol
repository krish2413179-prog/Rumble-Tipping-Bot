// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
}

/**
 * @title RecurringPayment
 * @notice Enables scheduled recurring payments with user approval
 * Users approve this contract once, then authorized executors can trigger payments on schedule
 */
contract RecurringPayment {
    struct Schedule {
        address token;          // ERC-20 token address (USDT)
        address recipient;      // Payment recipient
        uint256 amount;         // Amount per payment
        uint256 interval;       // Seconds between payments
        uint256 lastPayment;    // Timestamp of last payment
        uint256 maxPayments;    // Maximum number of payments (0 = unlimited)
        uint256 paymentCount;   // Number of payments executed
        bool active;            // Schedule is active
    }

    // scheduleId => Schedule
    mapping(uint256 => Schedule) public schedules;
    
    // user => scheduleId => exists
    mapping(address => mapping(uint256 => bool)) public userSchedules;
    
    address public owner;
    uint256 public nextScheduleId;

    event ScheduleCreated(
        uint256 indexed scheduleId,
        address indexed user,
        address token,
        address recipient,
        uint256 amount,
        uint256 interval
    );
    
    event PaymentExecuted(
        uint256 indexed scheduleId,
        address indexed user,
        address recipient,
        uint256 amount,
        uint256 paymentNumber
    );
    
    event ScheduleCancelled(uint256 indexed scheduleId, address indexed user);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Create a recurring payment schedule
     * @param token ERC-20 token address (USDT)
     * @param recipient Payment recipient address
     * @param amount Amount per payment (in token's smallest unit)
     * @param interval Seconds between payments
     * @param maxPayments Maximum payments (0 = unlimited)
     */
    function createSchedule(
        address token,
        address recipient,
        uint256 amount,
        uint256 interval,
        uint256 maxPayments
    ) external returns (uint256) {
        require(token != address(0), "Invalid token");
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be > 0");
        require(interval > 0, "Interval must be > 0");

        uint256 scheduleId = nextScheduleId++;
        
        schedules[scheduleId] = Schedule({
            token: token,
            recipient: recipient,
            amount: amount,
            interval: interval,
            lastPayment: 0,
            maxPayments: maxPayments,
            paymentCount: 0,
            active: true
        });

        userSchedules[msg.sender][scheduleId] = true;

        emit ScheduleCreated(scheduleId, msg.sender, token, recipient, amount, interval);
        return scheduleId;
    }

    /**
     * @notice Execute a scheduled payment (can be called by anyone if payment is due)
     * @param scheduleId The schedule ID
     * @param user The user who created the schedule
     */
    function executePayment(uint256 scheduleId, address user) external {
        require(userSchedules[user][scheduleId], "Schedule not found");
        
        Schedule storage schedule = schedules[scheduleId];
        require(schedule.active, "Schedule inactive");
        
        // Check if enough time has passed
        require(
            block.timestamp >= schedule.lastPayment + schedule.interval,
            "Too soon"
        );

        // Check max payments limit
        if (schedule.maxPayments > 0) {
            require(schedule.paymentCount < schedule.maxPayments, "Max payments reached");
        }

        // Check user has approved this contract
        IERC20 token = IERC20(schedule.token);
        uint256 allowance = token.allowance(user, address(this));
        require(allowance >= schedule.amount, "Insufficient allowance");

        // Execute transfer
        bool success = token.transferFrom(user, schedule.recipient, schedule.amount);
        require(success, "Transfer failed");

        // Update schedule
        schedule.lastPayment = block.timestamp;
        schedule.paymentCount++;

        // Auto-deactivate if max reached
        if (schedule.maxPayments > 0 && schedule.paymentCount >= schedule.maxPayments) {
            schedule.active = false;
        }

        emit PaymentExecuted(scheduleId, user, schedule.recipient, schedule.amount, schedule.paymentCount);
    }

    /**
     * @notice Cancel a recurring payment schedule
     * @param scheduleId The schedule ID to cancel
     */
    function cancelSchedule(uint256 scheduleId) external {
        require(userSchedules[msg.sender][scheduleId], "Schedule not found");
        
        Schedule storage schedule = schedules[scheduleId];
        require(schedule.active, "Already inactive");
        
        schedule.active = false;
        
        emit ScheduleCancelled(scheduleId, msg.sender);
    }

    /**
     * @notice Check if a payment is due
     * @param scheduleId The schedule ID
     * @param user The user address
     */
    function isPaymentDue(uint256 scheduleId, address user) external view returns (bool) {
        if (!userSchedules[user][scheduleId]) return false;
        
        Schedule memory schedule = schedules[scheduleId];
        if (!schedule.active) return false;
        if (schedule.maxPayments > 0 && schedule.paymentCount >= schedule.maxPayments) return false;
        
        return block.timestamp >= schedule.lastPayment + schedule.interval;
    }

    /**
     * @notice Get schedule details
     */
    function getSchedule(uint256 scheduleId) external view returns (
        address token,
        address recipient,
        uint256 amount,
        uint256 interval,
        uint256 lastPayment,
        uint256 maxPayments,
        uint256 paymentCount,
        bool active
    ) {
        Schedule memory s = schedules[scheduleId];
        return (s.token, s.recipient, s.amount, s.interval, s.lastPayment, s.maxPayments, s.paymentCount, s.active);
    }
}
