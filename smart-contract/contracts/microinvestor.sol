// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MicroInvestment {
    address public owner;
    uint256 public minBatchAmount;
    uint256 public accumulatedAmount;
    
    event InvestmentDetected(address indexed user, uint256 amount);
    event BatchReady(uint256 totalAmount);
    event SwapPerformed(uint256 amount, string token);
    
    mapping(address => uint256) public userBalances;
    
    constructor(uint256 _minBatchAmount) {
        owner = msg.sender;
        minBatchAmount = _minBatchAmount;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    function detectInvestment(address user, uint256 amount) external {
        require(amount > 0, "Invalid amount");
        userBalances[user] += amount;
        accumulatedAmount += amount;
        emit InvestmentDetected(user, amount);
        
        if (accumulatedAmount >= minBatchAmount) {
            emit BatchReady(accumulatedAmount);
            accumulatedAmount = 0;
        }
    }
    
    function recordSwap(uint256 amount, string calldata token) external {
        emit SwapPerformed(amount, token);
    }
    
    function updateMinBatchAmount(uint256 _newMin) external {
        minBatchAmount = _newMin;
    }
    
    receive() external payable {}
}