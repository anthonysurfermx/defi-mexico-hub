// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title Bobby Conviction Oracle — On-Chain AI Decision Feed
/// @notice Other protocols can read Bobby's latest conviction on any asset
/// @dev Any DeFi protocol on X Layer can call getConviction("BTC") before executing
/// @dev This turns Bobby from a chatbot into INFRASTRUCTURE
/// @author Bobby Agent Trader × DeFi México

contract BobbyConvictionOracle {

    enum Direction { NEUTRAL, LONG, SHORT }
    enum Agent { CIO, ALPHA, REDTEAM }

    struct Signal {
        string symbol;           // Token symbol
        Direction direction;     // LONG, SHORT, or NEUTRAL
        uint8 conviction;        // 0-10 conviction score
        Agent agent;             // Which agent made the call
        uint256 entryPrice;      // Suggested entry × 1e8
        uint256 targetPrice;     // Target × 1e8
        uint256 stopPrice;       // Stop loss × 1e8
        bytes32 debateHash;      // Link to on-chain commitment
        uint256 timestamp;       // When signal was published
        uint256 expiresAt;       // Signal validity window
    }

    // ---- State ----

    address public owner;
    address public pendingOwner;
    address public bobby;
    bool public paused;

    /// @dev Latest signal per symbol (e.g., "BTC" → Signal)
    mapping(string => Signal) public latestSignal;

    /// @dev All symbols that have been signaled
    string[] public symbols;
    mapping(string => bool) public symbolExists;

    /// @dev Signal history per symbol
    mapping(string => Signal[]) public signalHistory;

    /// @dev Default signal TTL (24 hours)
    uint256 public defaultTTL = 24 hours;

    uint256 public constant MAX_HISTORY = 50;

    // ---- Events ----

    event SignalPublished(
        string indexed symbol,
        Direction direction,
        uint8 conviction,
        Agent indexed agent,
        uint256 entryPrice,
        bytes32 indexed debateHash
    );

    event SignalExpired(string indexed symbol, bytes32 indexed debateHash);
    event BobbyUpdated(address indexed oldBobby, address indexed newBobby);
    event OwnershipTransferStarted(address indexed from, address indexed to);
    event OwnershipTransferred(address indexed from, address indexed to);
    event Paused(address indexed by);
    event Unpaused(address indexed by);

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
        require(!paused, "Paused");
        _;
    }

    // ---- Constructor ----

    constructor(address _bobby) {
        require(_bobby != address(0), "Invalid bobby");
        owner = msg.sender;
        bobby = _bobby;
        emit OwnershipTransferred(address(0), msg.sender);
        emit BobbyUpdated(address(0), _bobby);
    }

    // ============================================================
    //  PUBLISH SIGNAL
    // ============================================================

    /// @notice Publish Bobby's conviction on an asset
    /// @dev Called after a debate concludes with a directional view
    function publishSignal(
        string calldata _symbol,
        Direction _direction,
        uint8 _conviction,
        Agent _agent,
        uint256 _entryPrice,
        uint256 _targetPrice,
        uint256 _stopPrice,
        bytes32 _debateHash,
        uint256 _ttl
    ) external onlyBobby whenNotPaused {
        require(_conviction <= 10, "Conviction 0-10");
        require(bytes(_symbol).length > 0, "Empty symbol");
        require(_entryPrice > 0, "Entry price required");

        uint256 ttl = _ttl > 0 ? _ttl : defaultTTL;

        Signal memory sig = Signal({
            symbol: _symbol,
            direction: _direction,
            conviction: _conviction,
            agent: _agent,
            entryPrice: _entryPrice,
            targetPrice: _targetPrice,
            stopPrice: _stopPrice,
            debateHash: _debateHash,
            timestamp: block.timestamp,
            expiresAt: block.timestamp + ttl
        });

        latestSignal[_symbol] = sig;

        // Track symbol list
        if (!symbolExists[_symbol]) {
            symbols.push(_symbol);
            symbolExists[_symbol] = true;
        }

        // Append to history (capped)
        if (signalHistory[_symbol].length < MAX_HISTORY) {
            signalHistory[_symbol].push(sig);
        } else {
            // Rotate: shift left and append
            for (uint256 i = 0; i < MAX_HISTORY - 1; i++) {
                signalHistory[_symbol][i] = signalHistory[_symbol][i + 1];
            }
            signalHistory[_symbol][MAX_HISTORY - 1] = sig;
        }

        emit SignalPublished(_symbol, _direction, _conviction, _agent, _entryPrice, _debateHash);
    }

    // ============================================================
    //  READ — For other protocols to consume
    // ============================================================

    /// @notice Get Bobby's latest conviction on a symbol
    /// @dev Other DeFi protocols call this to inform their strategies
    /// @return direction LONG/SHORT/NEUTRAL
    /// @return conviction 0-10 score
    /// @return entryPrice suggested entry × 1e8
    /// @return isActive whether the signal hasn't expired
    function getConviction(string calldata _symbol) external view returns (
        Direction direction,
        uint8 conviction,
        uint256 entryPrice,
        bool isActive
    ) {
        Signal storage sig = latestSignal[_symbol];
        if (sig.timestamp == 0) {
            return (Direction.NEUTRAL, 0, 0, false);
        }
        bool active = block.timestamp <= sig.expiresAt;
        return (sig.direction, sig.conviction, sig.entryPrice, active);
    }

    /// @notice Full signal data for a symbol
    function getSignal(string calldata _symbol) external view returns (Signal memory) {
        return latestSignal[_symbol];
    }

    /// @notice Get all active symbols with their conviction
    function getActiveSignals() external view returns (
        string[] memory _symbols,
        Direction[] memory _directions,
        uint8[] memory _convictions,
        bool[] memory _active
    ) {
        uint256 len = symbols.length;
        _symbols = new string[](len);
        _directions = new Direction[](len);
        _convictions = new uint8[](len);
        _active = new bool[](len);

        for (uint256 i = 0; i < len; i++) {
            Signal storage sig = latestSignal[symbols[i]];
            _symbols[i] = symbols[i];
            _directions[i] = sig.direction;
            _convictions[i] = sig.conviction;
            _active[i] = block.timestamp <= sig.expiresAt;
        }
    }

    /// @notice Signal history for a symbol
    function getSignalHistory(string calldata _symbol) external view returns (Signal[] memory) {
        return signalHistory[_symbol];
    }

    /// @notice How many unique symbols have been signaled
    function symbolCount() external view returns (uint256) {
        return symbols.length;
    }

    // ============================================================
    //  ADMIN
    // ============================================================

    function setBobby(address _newBobby) external onlyOwner {
        require(_newBobby != address(0), "Invalid");
        emit BobbyUpdated(bobby, _newBobby);
        bobby = _newBobby;
    }

    function setDefaultTTL(uint256 _ttl) external onlyOwner {
        defaultTTL = _ttl;
    }

    function transferOwnership(address _new) external onlyOwner {
        require(_new != address(0), "Invalid");
        pendingOwner = _new;
        emit OwnershipTransferStarted(owner, _new);
    }

    function acceptOwnership() external {
        require(msg.sender == pendingOwner, "Not pending");
        emit OwnershipTransferred(owner, pendingOwner);
        owner = pendingOwner;
        pendingOwner = address(0);
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
