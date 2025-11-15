// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title ContractMarketplace
 * @notice A marketplace where users deposit ERC-20 tokens and purchase contract products
 * @dev Uses OpenZeppelin contracts for security (Ownable, ReentrancyGuard, SafeERC20)
 * 
 * MAIN RISKS:
 * - Smart contract bugs: This code has not been audited. Use at your own risk.
 * - Centralized payout control: Only owner can withdraw funds from the pool
 * - Regulatory compliance: Ensure compliance with local regulations before production use
 * - Token approval risks: Users must approve this contract to spend their tokens
 */
contract ContractMarketplace is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // The ERC-20 token address used for deposits and purchases
    address public immutable TOKEN_ADDRESS;
    
    // Fee wallet that receives transaction fees
    address public feeWallet;
    
    // Fee rate: 25 = 2.5% (25/1000)
    uint256 public constant FEE_RATE = 25; // 2.5%
    uint256 public constant FEE_DENOMINATOR = 1000;
    
    // User balances mapping
    mapping(address => uint256) public balances;
    
    // Total pool balance available for payouts
    uint256 public totalPoolBalance;
    
    // Contract products structure
    struct ContractProduct {
        uint256 id;
        uint256 price;
        bool active;
    }
    
    // Products mapping
    mapping(uint256 => ContractProduct) public products;
    uint256[] public productIds;
    
    // Pause functionality
    bool public paused = false;
    
    // Minimum deposit amount (in tokens, represents 10 USD worth)
    // Default: 10 * 10^18 (10 tokens with 18 decimals)
    // For USDC (6 decimals), this would be 10 * 10^6 = 10000000
    // IMPORTANT: Minimum is always 10 USD worth, regardless of token type
    // Gas fees are NOT included in this minimum - they are separate
    uint256 public minDepositAmount;
    
    // Events
    event Deposit(address indexed user, uint256 amount);
    event ContractPurchased(address indexed user, uint256 productId, uint256 price, uint256 fee, uint256 poolAmount);
    event ProductCreated(uint256 indexed productId, uint256 price);
    event ProductUpdated(uint256 indexed productId, uint256 price, bool active);
    event ProductDeactivated(uint256 indexed productId);
    event Payout(address indexed to, uint256 amount);
    event FeeWalletUpdated(address indexed oldWallet, address indexed newWallet);
    event MinDepositUpdated(uint256 oldAmount, uint256 newAmount);
    event Paused(address account);
    event Unpaused(address account);
    
    /**
     * @notice Constructor sets the token address and initial owner
     * @param _tokenAddress The ERC-20 token contract address
     * @param _feeWallet The address that will receive transaction fees
     */
    constructor(address _tokenAddress, address _feeWallet) Ownable(msg.sender) {
        require(_tokenAddress != address(0), "Token address cannot be zero");
        require(_feeWallet != address(0), "Fee wallet cannot be zero");
        TOKEN_ADDRESS = _tokenAddress;
        feeWallet = _feeWallet;
        // Default minimum deposit: 10 USD worth (10 * 10^18 for 18 decimals)
        // Owner can update this based on token decimals and USD price
        // Note: Minimum is always 10 USD equivalent, gas fees are separate
        minDepositAmount = 10 * 10**18;
    }
    
    /**
     * @notice Deposit tokens into the contract
     * @param amount The amount of tokens to deposit
     * @dev User must approve this contract to spend tokens before calling
     */
    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than zero");
        require(amount >= minDepositAmount, "Amount below minimum deposit");
        require(!paused, "Contract is paused");
        
        IERC20 token = IERC20(TOKEN_ADDRESS);
        token.safeTransferFrom(msg.sender, address(this), amount);
        
        balances[msg.sender] += amount;
        
        emit Deposit(msg.sender, amount);
    }
    
    /**
     * @notice Purchase a contract product
     * @param productId The ID of the product to purchase
     * @dev Calculates fee (2.5%) and adds remainder to pool
     */
    function buyContract(uint256 productId) external nonReentrant {
        require(!paused, "Contract is paused");
        ContractProduct storage product = products[productId];
        require(product.active, "Product is not active");
        require(balances[msg.sender] >= product.price, "Insufficient balance");
        
        // Calculate fee: price * 25 / 1000 (2.5%)
        uint256 fee = (product.price * FEE_RATE) / FEE_DENOMINATOR;
        uint256 poolAmount = product.price - fee;
        
        // Deduct from user balance
        balances[msg.sender] -= product.price;
        
        // Transfer fee to fee wallet
        IERC20 token = IERC20(TOKEN_ADDRESS);
        token.safeTransfer(feeWallet, fee);
        
        // Add to pool balance
        totalPoolBalance += poolAmount;
        
        emit ContractPurchased(msg.sender, productId, product.price, fee, poolAmount);
    }
    
    /**
     * @notice Owner: Create a new product
     * @param productId The unique ID for the product
     * @param price The price in tokens
     */
    function createProduct(uint256 productId, uint256 price) external onlyOwner {
        require(price > 0, "Price must be greater than zero");
        require(products[productId].id == 0 || !products[productId].active, "Product already exists");
        
        products[productId] = ContractProduct({
            id: productId,
            price: price,
            active: true
        });
        
        // Add to productIds array if new
        bool exists = false;
        for (uint i = 0; i < productIds.length; i++) {
            if (productIds[i] == productId) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            productIds.push(productId);
        }
        
        emit ProductCreated(productId, price);
    }
    
    /**
     * @notice Owner: Update an existing product
     * @param productId The product ID
     * @param price The new price
     * @param active Whether the product is active
     */
    function updateProduct(uint256 productId, uint256 price, bool active) external onlyOwner {
        require(products[productId].id != 0, "Product does not exist");
        require(price > 0, "Price must be greater than zero");
        
        products[productId].price = price;
        products[productId].active = active;
        
        emit ProductUpdated(productId, price, active);
    }
    
    /**
     * @notice Owner: Deactivate a product
     * @param productId The product ID
     */
    function deactivateProduct(uint256 productId) external onlyOwner {
        require(products[productId].id != 0, "Product does not exist");
        products[productId].active = false;
        emit ProductDeactivated(productId);
    }
    
    /**
     * @notice Owner: Withdraw tokens from the pool
     * @param to The address to send tokens to
     * @param amount The amount to withdraw
     */
    function payout(address to, uint256 amount) external onlyOwner nonReentrant {
        require(to != address(0), "Cannot payout to zero address");
        require(amount > 0, "Amount must be greater than zero");
        require(amount <= totalPoolBalance, "Insufficient pool balance");
        
        totalPoolBalance -= amount;
        
        IERC20 token = IERC20(TOKEN_ADDRESS);
        token.safeTransfer(to, amount);
        
        emit Payout(to, amount);
    }
    
    /**
     * @notice Owner: Update the fee wallet address
     * @param _feeWallet The new fee wallet address
     */
    function setFeeWallet(address _feeWallet) external onlyOwner {
        require(_feeWallet != address(0), "Fee wallet cannot be zero");
        address oldWallet = feeWallet;
        feeWallet = _feeWallet;
        emit FeeWalletUpdated(oldWallet, _feeWallet);
    }
    
    /**
     * @notice Owner: Update the minimum deposit amount
     * @param _minDepositAmount The new minimum deposit amount (in tokens)
     * @dev Should be set based on token decimals and USD equivalent (10 USD minimum)
     *      For 18 decimals: 10 * 10^18 = 10000000000000000000
     *      For 6 decimals (USDC): 10 * 10^6 = 10000000
     *      IMPORTANT: Minimum is always 10 USD worth, regardless of token type
     *      Gas fees are NOT included in this minimum - they are separate
     */
    function setMinDepositAmount(uint256 _minDepositAmount) external onlyOwner {
        require(_minDepositAmount > 0, "Minimum deposit must be greater than zero");
        uint256 oldAmount = minDepositAmount;
        minDepositAmount = _minDepositAmount;
        emit MinDepositUpdated(oldAmount, _minDepositAmount);
    }
    
    /**
     * @notice Owner: Pause all purchases and deposits
     */
    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }
    
    /**
     * @notice Owner: Unpause purchases and deposits
     */
    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }
    
    /**
     * @notice Get the number of products
     * @return The total number of products
     */
    function getProductCount() external view returns (uint256) {
        return productIds.length;
    }
    
    /**
     * @notice Get product ID at index
     * @param index The index in the productIds array
     * @return The product ID
     */
    function getProductId(uint256 index) external view returns (uint256) {
        require(index < productIds.length, "Index out of bounds");
        return productIds[index];
    }
}

