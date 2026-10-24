// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ShiftToken — an STS-1 token: ERC-20 whose name, symbol and metadata URI can be rewritten by the launchpad.
/// Supply, balances and the address never change. Only the identity does.
contract ShiftToken {
    string public name;
    string public symbol;
    string public tokenURI;
    uint8 public constant decimals = 18;
    uint256 public immutable totalSupply;
    address public immutable launchpad;
    address public immutable creator;
    uint256 public generation;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Shift(uint256 indexed generation, string name, string symbol, string uri, bytes32 by);

    error NotLaunchpad();
    error InsufficientBalance();
    error InsufficientAllowance();

    constructor(string memory name_, string memory symbol_, string memory uri_, address creator_, uint256 supply_) {
        name = name_;
        symbol = symbol_;
        tokenURI = uri_;
        creator = creator_;
        launchpad = msg.sender;
        totalSupply = supply_;
        balanceOf[msg.sender] = supply_;
        emit Transfer(address(0), msg.sender, supply_);
    }

    /// @notice The shift. Only the launchpad (update authority) may rewrite the identity.
    function shift(string calldata name_, string calldata symbol_, string calldata uri_, bytes32 by) external {
        if (msg.sender != launchpad) revert NotLaunchpad();
        generation += 1;
        name = name_;
        symbol = symbol_;
        tokenURI = uri_;
        emit Shift(generation, name_, symbol_, uri_, by);
    }

    function transfer(address to, uint256 value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 a = allowance[from][msg.sender];
        if (a != type(uint256).max) {
            if (a < value) revert InsufficientAllowance();
            allowance[from][msg.sender] = a - value;
        }
        _transfer(from, to, value);
        return true;
    }

    function _transfer(address from, address to, uint256 value) internal {
        uint256 b = balanceOf[from];
        if (b < value) revert InsufficientBalance();
        unchecked {
            balanceOf[from] = b - value;
            balanceOf[to] += value;
        }
        emit Transfer(from, to, value);
    }
}
