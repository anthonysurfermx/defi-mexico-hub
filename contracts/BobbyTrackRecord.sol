// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title Bobby Agent Trader — On-Chain Track Record (Audited v3)
/// @notice Commit-reveal track record: predictions are committed BEFORE outcomes are known
/// @dev Deployed on X Layer (Chain ID 196) — the first verifiable AI trader
/// @dev Audit v2: Gemini Pro (2026-03-17) — duplicates, gas, events, pause
/// @dev Audit v3: Codex (2026-03-17) — commit-reveal, invariants, Ownable2Step, coherence
/// @author Bobby Agent Trader × DeFi México

contract BobbyTrackRecord {

    // ---- Types ----

    enum Result { PENDING, WIN, LOSS, EXPIRED, BREAK_EVEN }

    /// @dev Fixed enum for sub-agents (Gemini Audit #5)
    enum Agent { CIO, ALPHA, REDTEAM }

    /// @dev Phase 1: Commitment — recorded BEFORE outcome is known
    struct Commitment {
        bytes32 debateHash;      // keccak256(forumThreadId)
        string symbol;           // Token symbol
        Agent agent;             // Which agent made the call
        uint8 conviction;        // Bobby's conviction 0-10
        uint256 entryPrice;      // Entry price × 1e8
        uint256 targetPrice;     // Target price × 1e8
        uint256 stopPrice;       // Stop loss × 1e8
        uint256 committedAt;     // Block timestamp of commitment
        address recorder;        // Who committed this
        bool resolved;           // Has this been resolved?
    }

    /// @dev Phase 2: Resolution — recorded AFTER outcome is known
    struct Trade {
        bytes32 debateHash;      // Links back to commitment
        string symbol;
        Agent agent;
        int256 pnlBps;           // PnL in basis points
        uint8 conviction;
        Result result;
        uint256 entryPrice;      // × 1e8
        uint256 exitPrice;       // × 1e8
        uint256 committedAt;     // When the prediction was made
        uint256 resolvedAt;      // When the outcome was recorded
        address recorder;
    }

    // ---- State ----

    address public owner;
    address public pendingOwner;  // Ownable2Step (Codex Audit — low)
    address public bobby;
    bool public paused;

    /// @dev Minimum time between commit and resolve (anti-backfill)
    uint256 public minCommitAge = 1 hours;

    Commitment[] public commitments;
    Trade[] public trades;
    uint256 public wins;
    uint256 public losses;
    int256 public totalPnlBps;

    /// @dev Prevent duplicate commits (Gemini Audit #1)
    mapping(bytes32 => bool) public commitExists;
    mapping(bytes32 => uint256) public commitIndex;

    // Per-agent stats (Gemini Audit #5 — enum keys)
    mapping(Agent => uint256) public agentWins;
    mapping(Agent => uint256) public agentLosses;
    mapping(Agent => uint256) public agentTrades;

    uint256 public constant MAX_RECENT = 100;

    // ---- Events ----

    /// @dev Codex Audit — commit phase event
    event TradeCommitted(
        uint256 indexed commitId,
        string symbol,
        Agent indexed agent,
        uint8 conviction,
        uint256 entryPrice,
        bytes32 indexed debateHash
    );

    event TradeResolved(
        uint256 indexed tradeId,
        string symbol,
        Agent indexed agent,
        Result result,
        int256 pnlBps,
        uint8 conviction,
        bytes32 indexed debateHash
    );

    event BobbyUpdated(address indexed oldBobby, address indexed newBobby);
    event OwnershipTransferStarted(address indexed currentOwner, address indexed pendingOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event Paused(address indexed by);
    event Unpaused(address indexed by);
    event MinCommitAgeUpdated(uint256 oldAge, uint256 newAge);

    // ---- Modifiers ----

    modifier onlyBobby() {
        require(msg.sender == bobby || msg.sender == owner, "Not authorized");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    // ---- Constructor ----

    constructor(address _bobby) {
        require(_bobby != address(0), "Invalid bobby address");
        owner = msg.sender;
        bobby = _bobby;
        emit OwnershipTransferred(address(0), msg.sender);
        emit BobbyUpdated(address(0), _bobby);
    }

    // ============================================================
    //  PHASE 1: COMMIT — Before the outcome is known
    // ============================================================

    /// @notice Commit a trade prediction BEFORE the outcome is known
    /// @dev This creates a timestamped, immutable record of the prediction
    function commitTrade(
        bytes32 _debateHash,
        string calldata _symbol,
        Agent _agent,
        uint8 _conviction,
        uint256 _entryPrice,
        uint256 _targetPrice,
        uint256 _stopPrice
    ) external onlyBobby whenNotPaused {
        require(_debateHash != bytes32(0), "Invalid debate hash");
        require(!commitExists[_debateHash], "Already committed");
        require(_conviction <= 10, "Conviction must be 0-10");
        require(_entryPrice > 0, "Entry price required");
        require(_targetPrice > 0 || _stopPrice > 0, "Target or stop required");

        uint256 commitId = commitments.length;

        commitments.push(Commitment({
            debateHash: _debateHash,
            symbol: _symbol,
            agent: _agent,
            conviction: _conviction,
            entryPrice: _entryPrice,
            targetPrice: _targetPrice,
            stopPrice: _stopPrice,
            committedAt: block.timestamp,
            recorder: msg.sender,
            resolved: false
        }));

        commitExists[_debateHash] = true;
        commitIndex[_debateHash] = commitId;

        emit TradeCommitted(commitId, _symbol, _agent, _conviction, _entryPrice, _debateHash);
    }

    // ============================================================
    //  PHASE 2: RESOLVE — After the outcome is known
    // ============================================================

    /// @notice Resolve a previously committed trade with the actual outcome
    /// @dev Must be called AFTER minCommitAge has elapsed since commitment
    function resolveTrade(
        bytes32 _debateHash,
        int256 _pnlBps,
        Result _result,
        uint256 _exitPrice
    ) external onlyBobby whenNotPaused {
        require(commitExists[_debateHash], "No commitment found");
        require(_result != Result.PENDING, "Cannot resolve as pending");
        require(_exitPrice > 0, "Exit price required");

        uint256 cIdx = commitIndex[_debateHash];
        Commitment storage c = commitments[cIdx];

        require(!c.resolved, "Already resolved");
        /// @dev Codex Audit [Medio-alto] — anti-backfill: enforce time gap
        require(block.timestamp >= c.committedAt + minCommitAge, "Too soon to resolve");

        /// @dev Codex Audit [Medio] — coherence invariants
        if (_result == Result.WIN) {
            require(_pnlBps > 0, "WIN must have positive PnL");
        } else if (_result == Result.LOSS) {
            require(_pnlBps < 0, "LOSS must have negative PnL");
        } else if (_result == Result.BREAK_EVEN) {
            require(_pnlBps == 0, "BREAK_EVEN must have zero PnL");
        }

        c.resolved = true;

        uint256 tradeId = trades.length;

        trades.push(Trade({
            debateHash: _debateHash,
            symbol: c.symbol,
            agent: c.agent,
            pnlBps: _pnlBps,
            conviction: c.conviction,
            result: _result,
            entryPrice: c.entryPrice,
            exitPrice: _exitPrice,
            committedAt: c.committedAt,
            resolvedAt: block.timestamp,
            recorder: msg.sender
        }));

        totalPnlBps += _pnlBps;

        if (_result == Result.WIN) {
            wins++;
            agentWins[c.agent]++;
        } else if (_result == Result.LOSS) {
            losses++;
            agentLosses[c.agent]++;
        }
        agentTrades[c.agent]++;

        emit TradeResolved(tradeId, c.symbol, c.agent, _result, _pnlBps, c.conviction, _debateHash);
    }

    // ---- View Functions ----

    function totalTrades() external view returns (uint256) {
        return trades.length;
    }

    function totalCommitments() external view returns (uint256) {
        return commitments.length;
    }

    /// @notice Pending commitments that haven't been resolved yet
    function pendingCount() external view returns (uint256) {
        uint256 pending = 0;
        uint256 len = commitments.length;
        // Cap iteration for gas safety on-chain calls
        uint256 start = len > MAX_RECENT ? len - MAX_RECENT : 0;
        for (uint256 i = start; i < len; i++) {
            if (!commitments[i].resolved) pending++;
        }
        return pending;
    }

    function getWinRate() external view returns (uint256) {
        uint256 total = trades.length;
        if (total == 0) return 0;
        return (wins * 10000) / total;
    }

    function getAgentStats(Agent _agent) external view returns (
        uint256 _wins, uint256 _losses, uint256 _total, uint256 _winRate
    ) {
        _wins = agentWins[_agent];
        _losses = agentLosses[_agent];
        _total = agentTrades[_agent];
        _winRate = _total > 0 ? (_wins * 10000) / _total : 0;
    }

    function getRecentTrades(uint256 _count) external view returns (Trade[] memory) {
        uint256 len = trades.length;
        uint256 count = _count > len ? len : _count;
        if (count > MAX_RECENT) count = MAX_RECENT;
        Trade[] memory recent = new Trade[](count);
        for (uint256 i = 0; i < count; i++) {
            recent[i] = trades[len - count + i];
        }
        return recent;
    }

    function getRecentCommitments(uint256 _count) external view returns (Commitment[] memory) {
        uint256 len = commitments.length;
        uint256 count = _count > len ? len : _count;
        if (count > MAX_RECENT) count = MAX_RECENT;
        Commitment[] memory recent = new Commitment[](count);
        for (uint256 i = 0; i < count; i++) {
            recent[i] = commitments[len - count + i];
        }
        return recent;
    }

    // ---- Admin ----

    function setBobby(address _newBobby) external onlyOwner {
        require(_newBobby != address(0), "Invalid address");
        emit BobbyUpdated(bobby, _newBobby);
        bobby = _newBobby;
    }

    /// @dev Codex Audit [Bajo] — Ownable2Step: initiate transfer
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid address");
        pendingOwner = _newOwner;
        emit OwnershipTransferStarted(owner, _newOwner);
    }

    /// @dev Ownable2Step: new owner must accept
    function acceptOwnership() external {
        require(msg.sender == pendingOwner, "Not pending owner");
        emit OwnershipTransferred(owner, pendingOwner);
        owner = pendingOwner;
        pendingOwner = address(0);
    }

    function setMinCommitAge(uint256 _newAge) external onlyOwner {
        emit MinCommitAgeUpdated(minCommitAge, _newAge);
        minCommitAge = _newAge;
    }

    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }
}
