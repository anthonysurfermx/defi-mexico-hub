// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title Bobby Agent Trader — On-Chain Track Record
/// @notice Immutable record of Bobby's trading predictions and outcomes
/// @dev Deployed on X Layer (Chain ID 196) — the first verifiable AI trader
/// @author Bobby Agent Trader × DeFi México

contract BobbyTrackRecord {

    // ---- Types ----

    enum Result { PENDING, WIN, LOSS, EXPIRED, BREAK_EVEN }

    struct Trade {
        bytes32 debateHash;      // Hash of the forum thread ID
        string symbol;           // Token symbol (BTC, ETH, OKB, etc.)
        string agent;            // Which agent's call (alpha, redteam, cio)
        int256 pnlBps;           // PnL in basis points (550 = +5.50%, -300 = -3.00%)
        uint8 conviction;        // Bobby's conviction 0-10
        Result result;           // WIN, LOSS, EXPIRED, BREAK_EVEN
        uint256 entryPrice;      // Entry price × 1e8 (8 decimals)
        uint256 exitPrice;       // Exit/resolution price × 1e8
        uint256 timestamp;       // Block timestamp when recorded
        address recorder;        // Who recorded this (Bobby's operator)
    }

    // ---- State ----

    address public owner;
    address public bobby;        // Bobby's authorized recorder address

    Trade[] public trades;
    uint256 public totalTrades;
    uint256 public wins;
    uint256 public losses;
    int256 public totalPnlBps;   // Cumulative PnL in basis points

    // Per-agent stats
    mapping(string => uint256) public agentWins;
    mapping(string => uint256) public agentLosses;
    mapping(string => uint256) public agentTrades;

    // ---- Events ----

    event TradeRecorded(
        uint256 indexed tradeId,
        string symbol,
        string agent,
        Result result,
        int256 pnlBps,
        uint8 conviction,
        bytes32 debateHash
    );

    event BobbyUpdated(address indexed oldBobby, address indexed newBobby);

    // ---- Modifiers ----

    modifier onlyBobby() {
        require(msg.sender == bobby || msg.sender == owner, "Not authorized");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // ---- Constructor ----

    constructor(address _bobby) {
        owner = msg.sender;
        bobby = _bobby;
    }

    // ---- Core Functions ----

    /// @notice Record a resolved trade from Bobby's Resolution Engine
    /// @param _debateHash Hash of the forum thread ID
    /// @param _symbol Token symbol
    /// @param _agent Which agent's recommendation was followed
    /// @param _pnlBps PnL in basis points
    /// @param _conviction Bobby's conviction score 0-10
    /// @param _result Trade outcome
    /// @param _entryPrice Entry price × 1e8
    /// @param _exitPrice Exit price × 1e8
    function recordTrade(
        bytes32 _debateHash,
        string calldata _symbol,
        string calldata _agent,
        int256 _pnlBps,
        uint8 _conviction,
        Result _result,
        uint256 _entryPrice,
        uint256 _exitPrice
    ) external onlyBobby {
        require(_conviction <= 10, "Conviction must be 0-10");
        require(_result != Result.PENDING, "Cannot record pending trade");

        uint256 tradeId = trades.length;

        trades.push(Trade({
            debateHash: _debateHash,
            symbol: _symbol,
            agent: _agent,
            pnlBps: _pnlBps,
            conviction: _conviction,
            result: _result,
            entryPrice: _entryPrice,
            exitPrice: _exitPrice,
            timestamp: block.timestamp,
            recorder: msg.sender
        }));

        totalTrades++;
        totalPnlBps += _pnlBps;

        if (_result == Result.WIN) {
            wins++;
            agentWins[_agent]++;
        } else if (_result == Result.LOSS) {
            losses++;
            agentLosses[_agent]++;
        }
        agentTrades[_agent]++;

        emit TradeRecorded(tradeId, _symbol, _agent, _result, _pnlBps, _conviction, _debateHash);
    }

    // ---- View Functions ----

    /// @notice Get Bobby's overall win rate (basis points, 10000 = 100%)
    function getWinRate() external view returns (uint256) {
        if (totalTrades == 0) return 0;
        return (wins * 10000) / totalTrades;
    }

    /// @notice Get stats for a specific agent
    function getAgentStats(string calldata _agent) external view returns (
        uint256 _wins, uint256 _losses, uint256 _total, uint256 _winRate
    ) {
        _wins = agentWins[_agent];
        _losses = agentLosses[_agent];
        _total = agentTrades[_agent];
        _winRate = _total > 0 ? (_wins * 10000) / _total : 0;
    }

    /// @notice Get the last N trades
    function getRecentTrades(uint256 _count) external view returns (Trade[] memory) {
        uint256 len = trades.length;
        uint256 count = _count > len ? len : _count;
        Trade[] memory recent = new Trade[](count);
        for (uint256 i = 0; i < count; i++) {
            recent[i] = trades[len - count + i];
        }
        return recent;
    }

    /// @notice Get total number of trades
    function getTradeCount() external view returns (uint256) {
        return trades.length;
    }

    // ---- Admin ----

    /// @notice Update Bobby's authorized address
    function setBobby(address _newBobby) external onlyOwner {
        emit BobbyUpdated(bobby, _newBobby);
        bobby = _newBobby;
    }

    /// @notice Transfer ownership
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid address");
        owner = _newOwner;
    }
}
