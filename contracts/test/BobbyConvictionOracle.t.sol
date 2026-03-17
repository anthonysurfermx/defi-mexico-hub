// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../BobbyConvictionOracle.sol";

contract BobbyConvictionOracleTest is Test {

    event SignalPublished(string indexed symbol, BobbyConvictionOracle.Direction direction, uint8 conviction, BobbyConvictionOracle.Agent indexed agent, uint256 entryPrice, bytes32 indexed debateHash);

    BobbyConvictionOracle public oracle;

    address owner = address(this);
    address bobby = address(0xB0B);
    address attacker = address(0xDEAD);
    address protocol = address(0xCAFE);

    bytes32 constant HASH_1 = keccak256("btc-debate-001");
    bytes32 constant HASH_2 = keccak256("eth-debate-001");
    bytes32 constant HASH_3 = keccak256("btc-debate-002");

    function setUp() public {
        oracle = new BobbyConvictionOracle(bobby);
    }

    // ── Constructor ──

    function test_constructor() public view {
        assertEq(oracle.owner(), owner);
        assertEq(oracle.bobby(), bobby);
        assertFalse(oracle.paused());
        assertEq(oracle.defaultTTL(), 24 hours);
    }

    function test_constructor_rejectsZero() public {
        vm.expectRevert("Invalid bobby");
        new BobbyConvictionOracle(address(0));
    }

    // ── Publish Signal ──

    function test_publish_basic() public {
        vm.prank(bobby);
        oracle.publishSignal("BTC", BobbyConvictionOracle.Direction.LONG, 8,
            BobbyConvictionOracle.Agent.ALPHA, 9500000000000, 10500000000000, 9000000000000, HASH_1, 0);

        assertEq(oracle.symbolCount(), 1);
    }

    function test_publish_emitsEvent() public {
        vm.prank(bobby);
        vm.expectEmit(true, true, true, true);
        emit SignalPublished("BTC", BobbyConvictionOracle.Direction.LONG, 8,
            BobbyConvictionOracle.Agent.ALPHA, 9500000000000, HASH_1);
        oracle.publishSignal("BTC", BobbyConvictionOracle.Direction.LONG, 8,
            BobbyConvictionOracle.Agent.ALPHA, 9500000000000, 10500000000000, 9000000000000, HASH_1, 0);
    }

    function test_publish_unauthorized() public {
        vm.prank(attacker);
        vm.expectRevert("Not authorized");
        oracle.publishSignal("BTC", BobbyConvictionOracle.Direction.LONG, 8,
            BobbyConvictionOracle.Agent.ALPHA, 9500000000000, 10500000000000, 9000000000000, HASH_1, 0);
    }

    function test_publish_whenPaused() public {
        oracle.pause();
        vm.prank(bobby);
        vm.expectRevert("Paused");
        oracle.publishSignal("BTC", BobbyConvictionOracle.Direction.LONG, 8,
            BobbyConvictionOracle.Agent.ALPHA, 9500000000000, 10500000000000, 9000000000000, HASH_1, 0);
    }

    function test_publish_rejectsConvictionOver10() public {
        vm.prank(bobby);
        vm.expectRevert("Conviction 0-10");
        oracle.publishSignal("BTC", BobbyConvictionOracle.Direction.LONG, 11,
            BobbyConvictionOracle.Agent.ALPHA, 9500000000000, 10500000000000, 9000000000000, HASH_1, 0);
    }

    function test_publish_rejectsEmptySymbol() public {
        vm.prank(bobby);
        vm.expectRevert("Empty symbol");
        oracle.publishSignal("", BobbyConvictionOracle.Direction.LONG, 8,
            BobbyConvictionOracle.Agent.ALPHA, 9500000000000, 10500000000000, 9000000000000, HASH_1, 0);
    }

    function test_publish_rejectsZeroEntry() public {
        vm.prank(bobby);
        vm.expectRevert("Entry price required");
        oracle.publishSignal("BTC", BobbyConvictionOracle.Direction.LONG, 8,
            BobbyConvictionOracle.Agent.ALPHA, 0, 10500000000000, 9000000000000, HASH_1, 0);
    }

    function test_publish_updatesLatest() public {
        // First signal: LONG 8
        vm.prank(bobby);
        oracle.publishSignal("BTC", BobbyConvictionOracle.Direction.LONG, 8,
            BobbyConvictionOracle.Agent.ALPHA, 9500000000000, 10500000000000, 9000000000000, HASH_1, 0);

        // Second signal: SHORT 6
        vm.prank(bobby);
        oracle.publishSignal("BTC", BobbyConvictionOracle.Direction.SHORT, 6,
            BobbyConvictionOracle.Agent.REDTEAM, 9500000000000, 8500000000000, 10000000000000, HASH_3, 0);

        (BobbyConvictionOracle.Direction dir, uint8 conv, , ) = oracle.getConviction("BTC");
        assertEq(uint8(dir), uint8(BobbyConvictionOracle.Direction.SHORT));
        assertEq(conv, 6);

        // Symbol count should still be 1
        assertEq(oracle.symbolCount(), 1);
    }

    function test_publish_multipleSymbols() public {
        vm.startPrank(bobby);
        oracle.publishSignal("BTC", BobbyConvictionOracle.Direction.LONG, 8,
            BobbyConvictionOracle.Agent.ALPHA, 9500000000000, 10500000000000, 9000000000000, HASH_1, 0);
        oracle.publishSignal("ETH", BobbyConvictionOracle.Direction.SHORT, 5,
            BobbyConvictionOracle.Agent.REDTEAM, 350000000000, 300000000000, 380000000000, HASH_2, 0);
        vm.stopPrank();

        assertEq(oracle.symbolCount(), 2);
    }

    function test_publish_customTTL() public {
        vm.prank(bobby);
        oracle.publishSignal("BTC", BobbyConvictionOracle.Direction.LONG, 9,
            BobbyConvictionOracle.Agent.CIO, 9500000000000, 10500000000000, 9000000000000, HASH_1, 1 hours);

        (, , , bool active) = oracle.getConviction("BTC");
        assertTrue(active);

        // Warp past 1 hour TTL
        vm.warp(block.timestamp + 1 hours + 1);
        (, , , active) = oracle.getConviction("BTC");
        assertFalse(active);
    }

    // ── Read Functions (other protocols consume these) ──

    function test_getConviction_unknown() public view {
        (BobbyConvictionOracle.Direction dir, uint8 conv, uint256 price, bool active) = oracle.getConviction("DOGE");
        assertEq(uint8(dir), uint8(BobbyConvictionOracle.Direction.NEUTRAL));
        assertEq(conv, 0);
        assertEq(price, 0);
        assertFalse(active);
    }

    function test_getConviction_active() public {
        vm.prank(bobby);
        oracle.publishSignal("BTC", BobbyConvictionOracle.Direction.LONG, 9,
            BobbyConvictionOracle.Agent.CIO, 9500000000000, 10500000000000, 9000000000000, HASH_1, 0);

        (BobbyConvictionOracle.Direction dir, uint8 conv, uint256 price, bool active) = oracle.getConviction("BTC");
        assertEq(uint8(dir), uint8(BobbyConvictionOracle.Direction.LONG));
        assertEq(conv, 9);
        assertEq(price, 9500000000000);
        assertTrue(active);
    }

    function test_getConviction_expired() public {
        vm.prank(bobby);
        oracle.publishSignal("BTC", BobbyConvictionOracle.Direction.LONG, 9,
            BobbyConvictionOracle.Agent.CIO, 9500000000000, 10500000000000, 9000000000000, HASH_1, 0);

        vm.warp(block.timestamp + 25 hours);
        (, , , bool active) = oracle.getConviction("BTC");
        assertFalse(active);
    }

    function test_getSignal_full() public {
        vm.prank(bobby);
        oracle.publishSignal("ETH", BobbyConvictionOracle.Direction.SHORT, 7,
            BobbyConvictionOracle.Agent.REDTEAM, 350000000000, 300000000000, 380000000000, HASH_2, 0);

        BobbyConvictionOracle.Signal memory sig = oracle.getSignal("ETH");
        assertEq(sig.conviction, 7);
        assertEq(sig.targetPrice, 300000000000);
        assertEq(sig.stopPrice, 380000000000);
        assertEq(sig.debateHash, HASH_2);
    }

    function test_getActiveSignals() public {
        vm.startPrank(bobby);
        oracle.publishSignal("BTC", BobbyConvictionOracle.Direction.LONG, 8,
            BobbyConvictionOracle.Agent.ALPHA, 9500000000000, 10500000000000, 9000000000000, HASH_1, 0);
        oracle.publishSignal("ETH", BobbyConvictionOracle.Direction.SHORT, 5,
            BobbyConvictionOracle.Agent.REDTEAM, 350000000000, 300000000000, 380000000000, HASH_2, 0);
        vm.stopPrank();

        (string[] memory syms, BobbyConvictionOracle.Direction[] memory dirs,
         uint8[] memory convs, bool[] memory actives) = oracle.getActiveSignals();

        assertEq(syms.length, 2);
        assertTrue(actives[0]);
        assertTrue(actives[1]);
    }

    function test_getSignalHistory() public {
        vm.startPrank(bobby);
        oracle.publishSignal("BTC", BobbyConvictionOracle.Direction.LONG, 8,
            BobbyConvictionOracle.Agent.ALPHA, 9500000000000, 10500000000000, 9000000000000, HASH_1, 0);
        oracle.publishSignal("BTC", BobbyConvictionOracle.Direction.SHORT, 6,
            BobbyConvictionOracle.Agent.REDTEAM, 9500000000000, 8500000000000, 10000000000000, HASH_3, 0);
        vm.stopPrank();

        BobbyConvictionOracle.Signal[] memory history = oracle.getSignalHistory("BTC");
        assertEq(history.length, 2);
        assertEq(history[0].conviction, 8);
        assertEq(history[1].conviction, 6);
    }

    // ── Protocol Integration Scenario ──

    function test_scenario_protocolReadsBeforeTrade() public {
        // Bobby publishes a LONG signal on OKB
        vm.prank(bobby);
        oracle.publishSignal("OKB", BobbyConvictionOracle.Direction.LONG, 9,
            BobbyConvictionOracle.Agent.CIO, 9500000000, 11000000000, 8500000000, HASH_1, 0);

        // A DeFi protocol reads Bobby's conviction before executing
        vm.prank(protocol);
        (BobbyConvictionOracle.Direction dir, uint8 conv, uint256 entry, bool active) = oracle.getConviction("OKB");

        // Protocol decides: only trade if Bobby's conviction >= 7 and active
        assertTrue(active);
        assertTrue(conv >= 7);
        assertEq(uint8(dir), uint8(BobbyConvictionOracle.Direction.LONG));
        assertEq(entry, 9500000000);
    }

    // ── Admin ──

    function test_setDefaultTTL() public {
        oracle.setDefaultTTL(12 hours);
        assertEq(oracle.defaultTTL(), 12 hours);
    }

    function test_admin_onlyOwner() public {
        vm.startPrank(attacker);

        vm.expectRevert("Not owner");
        oracle.setBobby(attacker);

        vm.expectRevert("Not owner");
        oracle.setDefaultTTL(0);

        vm.expectRevert("Not owner");
        oracle.pause();

        vm.expectRevert("Not owner");
        oracle.transferOwnership(attacker);

        vm.stopPrank();
    }

    function test_ownable2Step() public {
        address newOwner = address(0x1234);
        oracle.transferOwnership(newOwner);
        assertEq(oracle.owner(), owner);

        vm.prank(newOwner);
        oracle.acceptOwnership();
        assertEq(oracle.owner(), newOwner);
    }
}
