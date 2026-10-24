// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ShiftToken} from "./ShiftToken.sol";

/// @title ShiftLaunchpad — launches STS-1 tokens on a virtual-reserve bonding curve and holds their update authority.
/// Buy/sell against the curve until 800M of the 1B supply is sold; then the pool graduates and the migrator
/// moves the raised ETH plus the remaining 200M tokens into a Uniswap v4 pool.
contract ShiftLaunchpad {
    uint256 public constant SUPPLY = 1_000_000_000 ether;
    uint256 public constant CURVE_SUPPLY = 800_000_000 ether;

    struct Params {
        uint256 virtualEth;    // virtual ETH reserve at launch (sets the starting price)
        uint256 virtualTokens; // virtual token reserve at launch
        uint16 feeBps;         // trading fee on ETH in/out
    }

    struct Pool {
        address creator;
        uint8 mode;            // 0 manual, 1 auto, 2 scheduled, 3 vote (informational, enforced off-chain)
        bool graduated;
        bool migrated;
        uint256 ethReserve;    // real ETH held for this pool
        uint256 tokensSold;
        Params params;
    }

    address public owner;
    address public authority;     // performs shifts (the keeper / creator-signed requests)
    address public feeRecipient;
    address public migrator;      // receives graduated pools' funds to seed the DEX pool
    Params public params;

    address[] public tokens;
    mapping(address => Pool) public pools;

    event Launched(address indexed token, address indexed creator, string name, string symbol, string uri, uint8 mode, bytes32 salt);
    event Trade(address indexed token, address indexed trader, bool isBuy, uint256 ethAmount, uint256 tokenAmount, uint256 fee, uint256 ethReserve, uint256 tokensSold);
    event Graduated(address indexed token, uint256 ethReserve, uint256 tokensSold);
    event Migrated(address indexed token, address indexed to, uint256 eth, uint256 tokens);
    event Shifted(address indexed token, uint256 indexed generation, string name, string symbol, string uri, bytes32 by);

    error NotOwner();
    error NotAuthority();
    error NotMigrator();
    error UnknownToken();
    error PoolGraduated();
    error PoolNotGraduated();
    error ZeroAmount();
    error Slippage();
    error BadParams();

    modifier onlyOwner() { if (msg.sender != owner) revert NotOwner(); _; }

    constructor(address authority_, address feeRecipient_, address migrator_, Params memory params_) {
        owner = msg.sender;
        authority = authority_;
        feeRecipient = feeRecipient_;
        migrator = migrator_;
        _setParams(params_);
    }

    // ---------- admin ----------
    function setAuthority(address a) external onlyOwner { authority = a; }
    function setFeeRecipient(address a) external onlyOwner { feeRecipient = a; }
    function setMigrator(address a) external onlyOwner { migrator = a; }
    function setOwner(address a) external onlyOwner { owner = a; }
    function setParams(Params calldata p) external onlyOwner { _setParams(p); }

    function _setParams(Params memory p) internal {
        if (p.virtualEth == 0 || p.virtualTokens <= CURVE_SUPPLY || p.feeBps > 1000) revert BadParams();
        params = p;
    }

    // ---------- launch ----------
    /// @notice Deploys an STS-1 token (CREATE2 so the address is known in advance) and opens its curve.
    /// Any ETH sent is spent as the creator's first buy.
    function launch(string calldata name, string calldata symbol, string calldata uri, uint8 mode, bytes32 salt, uint256 minTokensOut)
        external
        payable
        returns (address token)
    {
        token = address(new ShiftToken{salt: salt}(name, symbol, uri, msg.sender, SUPPLY));
        Pool storage p = pools[token];
        p.creator = msg.sender;
        p.mode = mode;
        p.params = params;
        tokens.push(token);
        emit Launched(token, msg.sender, name, symbol, uri, mode, salt);
        if (msg.value > 0) _buy(token, msg.sender, msg.value, minTokensOut);
    }

    function tokenCount() external view returns (uint256) { return tokens.length; }

    // ---------- curve ----------
    function reserves(address token) public view returns (uint256 vEth, uint256 vTok) {
        Pool storage p = pools[token];
        vEth = p.params.virtualEth + p.ethReserve;
        vTok = p.params.virtualTokens - p.tokensSold;
    }

    /// @notice ETH-in → tokens-out (after fee). Capped at what is left on the curve.
    function quoteBuy(address token, uint256 ethIn) public view returns (uint256 tokensOut, uint256 ethUsed, uint256 fee) {
        Pool storage p = pools[token];
        if (p.creator == address(0)) revert UnknownToken();
        fee = (ethIn * p.params.feeBps) / 10_000;
        uint256 net = ethIn - fee;
        (uint256 vEth, uint256 vTok) = reserves(token);
        tokensOut = vTok - (vEth * vTok) / (vEth + net);
        uint256 left = CURVE_SUPPLY - p.tokensSold;
        if (tokensOut >= left) {
            tokensOut = left;
            // ETH needed to buy exactly `left`: vEth*vTok/(vTok-left) - vEth, rounded up
            uint256 need = (vEth * vTok + (vTok - left) - 1) / (vTok - left) - vEth;
            fee = (need * p.params.feeBps) / (10_000 - p.params.feeBps);
            ethUsed = need + fee;
        } else {
            ethUsed = ethIn;
        }
    }

    /// @notice tokens-in → ETH-out (after fee).
    function quoteSell(address token, uint256 tokensIn) public view returns (uint256 ethOut, uint256 fee) {
        Pool storage p = pools[token];
        if (p.creator == address(0)) revert UnknownToken();
        (uint256 vEth, uint256 vTok) = reserves(token);
        uint256 gross = vEth - (vEth * vTok) / (vTok + tokensIn);
        if (gross > p.ethReserve) gross = p.ethReserve;
        fee = (gross * p.params.feeBps) / 10_000;
        ethOut = gross - fee;
    }

    /// @notice Spot price in wei per whole token (1e18 units).
    function price(address token) external view returns (uint256) {
        (uint256 vEth, uint256 vTok) = reserves(token);
        return (vEth * 1e18) / vTok;
    }

    function buy(address token, uint256 minTokensOut) external payable {
        if (msg.value == 0) revert ZeroAmount();
        _buy(token, msg.sender, msg.value, minTokensOut);
    }

    function _buy(address token, address buyer, uint256 ethIn, uint256 minTokensOut) internal {
        Pool storage p = pools[token];
        if (p.creator == address(0)) revert UnknownToken();
        if (p.graduated) revert PoolGraduated();
        (uint256 tokensOut, uint256 ethUsed, uint256 fee) = quoteBuy(token, ethIn);
        if (tokensOut == 0 || tokensOut < minTokensOut) revert Slippage();
        p.ethReserve += ethUsed - fee;
        p.tokensSold += tokensOut;
        ShiftToken(token).transfer(buyer, tokensOut);
        _pay(feeRecipient, fee);
        if (ethIn > ethUsed) _pay(buyer, ethIn - ethUsed);
        emit Trade(token, buyer, true, ethUsed, tokensOut, fee, p.ethReserve, p.tokensSold);
        if (p.tokensSold >= CURVE_SUPPLY) {
            p.graduated = true;
            emit Graduated(token, p.ethReserve, p.tokensSold);
        }
    }

    function sell(address token, uint256 tokensIn, uint256 minEthOut) external {
        Pool storage p = pools[token];
        if (p.creator == address(0)) revert UnknownToken();
        if (p.graduated) revert PoolGraduated();
        if (tokensIn == 0) revert ZeroAmount();
        (uint256 ethOut, uint256 fee) = quoteSell(token, tokensIn);
        if (ethOut < minEthOut) revert Slippage();
        ShiftToken(token).transferFrom(msg.sender, address(this), tokensIn);
        p.ethReserve -= ethOut + fee;
        p.tokensSold -= tokensIn;
        _pay(feeRecipient, fee);
        _pay(msg.sender, ethOut);
        emit Trade(token, msg.sender, false, ethOut, tokensIn, fee, p.ethReserve, p.tokensSold);
    }

    /// @notice After graduation the migrator takes the ETH and the unsold supply to seed the DEX pool.
    function migrate(address token) external {
        if (msg.sender != migrator) revert NotMigrator();
        Pool storage p = pools[token];
        if (!p.graduated) revert PoolNotGraduated();
        if (p.migrated) revert PoolGraduated();
        p.migrated = true;
        uint256 eth = p.ethReserve;
        p.ethReserve = 0;
        uint256 toks = ShiftToken(token).balanceOf(address(this));
        ShiftToken(token).transfer(migrator, toks);
        _pay(migrator, eth);
        emit Migrated(token, migrator, eth, toks);
    }

    // ---------- shift ----------
    /// @notice The STS-1 shift, performed by the launchpad's authority on behalf of the creator, a schedule, a vote or the keeper.
    function shift(address token, string calldata name, string calldata symbol, string calldata uri, bytes32 by) external {
        if (msg.sender != authority && msg.sender != owner) revert NotAuthority();
        if (pools[token].creator == address(0)) revert UnknownToken();
        ShiftToken(token).shift(name, symbol, uri, by);
        emit Shifted(token, ShiftToken(token).generation(), name, symbol, uri, by);
    }

    function _pay(address to, uint256 amount) internal {
        if (amount == 0) return;
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "ETH transfer failed");
    }
}
