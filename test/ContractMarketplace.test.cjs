const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ContractMarketplace", function () {
  let marketplace;
  let token;
  let owner;
  let feeWallet;
  let user1;
  let user2;
  let MockERC20;

  beforeEach(async function () {
    [owner, feeWallet, user1, user2] = await ethers.getSigners();

    // Deploy a mock ERC-20 token for testing
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    token = await MockERC20Factory.deploy("Test Token", "TEST");
    await token.waitForDeployment();

    // Deploy the marketplace
    const MarketplaceFactory = await ethers.getContractFactory("ContractMarketplace");
    marketplace = await MarketplaceFactory.deploy(await token.getAddress(), feeWallet.address);
    await marketplace.waitForDeployment();

    // Mint tokens to users for testing
    const amount = ethers.parseEther("10000");
    await token.mint(user1.address, amount);
    await token.mint(user2.address, amount);
  });

  describe("Deployment", function () {
    it("Should set the correct token address", async function () {
      expect(await marketplace.TOKEN_ADDRESS()).to.equal(await token.getAddress());
    });

    it("Should set the correct fee wallet", async function () {
      expect(await marketplace.feeWallet()).to.equal(feeWallet.address);
    });

    it("Should set owner correctly", async function () {
      expect(await marketplace.owner()).to.equal(owner.address);
    });
  });

  describe("Deposits", function () {
    it("Should allow users to deposit tokens", async function () {
      const amount = ethers.parseEther("100");
      await token.connect(user1).approve(await marketplace.getAddress(), amount);
      
      await expect(marketplace.connect(user1).deposit(amount))
        .to.emit(marketplace, "Deposit")
        .withArgs(user1.address, amount);

      expect(await marketplace.balances(user1.address)).to.equal(amount);
    });

    it("Should revert if amount is zero", async function () {
      await expect(marketplace.connect(user1).deposit(0))
        .to.be.revertedWith("Amount must be greater than zero");
    });

    it("Should revert if amount is below minimum deposit (10 USD)", async function () {
      const minDeposit = await marketplace.minDepositAmount();
      const belowMinimum = minDeposit - ethers.parseEther("1");
      
      await token.connect(user1).approve(await marketplace.getAddress(), belowMinimum);
      
      await expect(marketplace.connect(user1).deposit(belowMinimum))
        .to.be.revertedWith("Amount below minimum deposit");
    });

    it("Should allow deposit at exactly minimum amount", async function () {
      const minDeposit = await marketplace.minDepositAmount();
      await token.connect(user1).approve(await marketplace.getAddress(), minDeposit);
      
      await expect(marketplace.connect(user1).deposit(minDeposit))
        .to.emit(marketplace, "Deposit")
        .withArgs(user1.address, minDeposit);
    });

    it("Should revert if contract is paused", async function () {
      await marketplace.pause();
      const amount = ethers.parseEther("100");
      await token.connect(user1).approve(await marketplace.getAddress(), amount);
      
      await expect(marketplace.connect(user1).deposit(amount))
        .to.be.revertedWith("Contract is paused");
    });
  });

  describe("Product Management", function () {
    it("Should allow owner to create products", async function () {
      const productId = 1;
      const price = ethers.parseEther("10");
      
      await expect(marketplace.createProduct(productId, price))
        .to.emit(marketplace, "ProductCreated")
        .withArgs(productId, price);

      const product = await marketplace.products(productId);
      expect(product.id).to.equal(productId);
      expect(product.price).to.equal(price);
      expect(product.active).to.be.true;
    });

    it("Should allow owner to update products", async function () {
      const productId = 1;
      const price = ethers.parseEther("10");
      await marketplace.createProduct(productId, price);

      const newPrice = ethers.parseEther("15");
      await expect(marketplace.updateProduct(productId, newPrice, false))
        .to.emit(marketplace, "ProductUpdated")
        .withArgs(productId, newPrice, false);

      const product = await marketplace.products(productId);
      expect(product.price).to.equal(newPrice);
      expect(product.active).to.be.false;
    });

    it("Should allow owner to deactivate products", async function () {
      const productId = 1;
      const price = ethers.parseEther("10");
      await marketplace.createProduct(productId, price);

      await expect(marketplace.deactivateProduct(productId))
        .to.emit(marketplace, "ProductDeactivated")
        .withArgs(productId);

      const product = await marketplace.products(productId);
      expect(product.active).to.be.false;
    });

    it("Should not allow non-owner to create products", async function () {
      const productId = 1;
      const price = ethers.parseEther("10");
      
      await expect(marketplace.connect(user1).createProduct(productId, price))
        .to.be.revertedWithCustomError(marketplace, "OwnableUnauthorizedAccount");
    });
  });

  describe("Buying Contracts", function () {
    beforeEach(async function () {
      // Create a product
      const productId = 1;
      const price = ethers.parseEther("100");
      await marketplace.createProduct(productId, price);

      // User deposits tokens
      const depositAmount = ethers.parseEther("200");
      await token.connect(user1).approve(await marketplace.getAddress(), depositAmount);
      await marketplace.connect(user1).deposit(depositAmount);
    });

    it("Should allow users to buy contracts", async function () {
      const productId = 1;
      const product = await marketplace.products(productId);
      const price = product.price;

      // Calculate expected fee: price * 25 / 1000 = 2.5%
      const expectedFee = (price * 25n) / 1000n;
      const expectedPoolAmount = price - expectedFee;

      const feeWalletBalanceBefore = await token.balanceOf(feeWallet.address);
      const poolBalanceBefore = await marketplace.totalPoolBalance();

      await expect(marketplace.connect(user1).buyContract(productId))
        .to.emit(marketplace, "ContractPurchased")
        .withArgs(user1.address, productId, price, expectedFee, expectedPoolAmount);

      // Check user balance decreased
      expect(await marketplace.balances(user1.address)).to.equal(ethers.parseEther("100"));

      // Check fee was transferred
      expect(await token.balanceOf(feeWallet.address)).to.equal(feeWalletBalanceBefore + expectedFee);

      // Check pool balance increased
      expect(await marketplace.totalPoolBalance()).to.equal(poolBalanceBefore + expectedPoolAmount);
    });

    it("Should revert if user has insufficient balance", async function () {
      const productId = 1;
      // User only has 200, but product costs 100, so this should work
      // Let's create a more expensive product
      const expensiveProductId = 2;
      const expensivePrice = ethers.parseEther("300");
      await marketplace.createProduct(expensiveProductId, expensivePrice);

      await expect(marketplace.connect(user1).buyContract(expensiveProductId))
        .to.be.revertedWith("Insufficient balance");
    });

    it("Should revert if product is not active", async function () {
      const productId = 1;
      await marketplace.deactivateProduct(productId);

      await expect(marketplace.connect(user1).buyContract(productId))
        .to.be.revertedWith("Product is not active");
    });

    it("Should calculate fees correctly (2.5%)", async function () {
      const productId = 1;
      const product = await marketplace.products(productId);
      const price = product.price;

      // Fee should be exactly 2.5%: price * 25 / 1000
      const expectedFee = (price * 25n) / 1000n;
      
      // For 100 tokens: 100 * 25 / 1000 = 2.5 tokens
      expect(expectedFee).to.equal(ethers.parseEther("2.5"));

      await marketplace.connect(user1).buyContract(productId);

      const feeWalletBalance = await token.balanceOf(feeWallet.address);
      expect(feeWalletBalance).to.equal(expectedFee);
    });
  });

  describe("Payouts", function () {
    beforeEach(async function () {
      // Setup: create product, deposit, and buy
      const productId = 1;
      const price = ethers.parseEther("100");
      await marketplace.createProduct(productId, price);

      const depositAmount = ethers.parseEther("200");
      await token.connect(user1).approve(await marketplace.getAddress(), depositAmount);
      await marketplace.connect(user1).deposit(depositAmount);
      await marketplace.connect(user1).buyContract(productId);
    });

    it("Should allow owner to payout from pool", async function () {
      const poolBalance = await marketplace.totalPoolBalance();
      const payoutAmount = poolBalance / 2n; // Half the pool

      const recipientBalanceBefore = await token.balanceOf(user2.address);

      await expect(marketplace.payout(user2.address, payoutAmount))
        .to.emit(marketplace, "Payout")
        .withArgs(user2.address, payoutAmount);

      expect(await marketplace.totalPoolBalance()).to.equal(poolBalance - payoutAmount);
      expect(await token.balanceOf(user2.address)).to.equal(recipientBalanceBefore + payoutAmount);
    });

    it("Should revert if payout amount exceeds pool balance", async function () {
      const poolBalance = await marketplace.totalPoolBalance();
      const excessiveAmount = poolBalance + ethers.parseEther("1");

      await expect(marketplace.payout(user2.address, excessiveAmount))
        .to.be.revertedWith("Insufficient pool balance");
    });

    it("Should not allow non-owner to payout", async function () {
      const poolBalance = await marketplace.totalPoolBalance();
      
      await expect(marketplace.connect(user1).payout(user2.address, poolBalance))
        .to.be.revertedWithCustomError(marketplace, "OwnableUnauthorizedAccount");
    });
  });

  describe("Pause/Unpause", function () {
    it("Should allow owner to pause and unpause", async function () {
      expect(await marketplace.paused()).to.be.false;

      await marketplace.pause();
      expect(await marketplace.paused()).to.be.true;

      await marketplace.unpause();
      expect(await marketplace.paused()).to.be.false;
    });

    it("Should not allow non-owner to pause", async function () {
      await expect(marketplace.connect(user1).pause())
        .to.be.revertedWithCustomError(marketplace, "OwnableUnauthorizedAccount");
    });
  });

  describe("Fee Wallet Management", function () {
    it("Should allow owner to update fee wallet", async function () {
      await expect(marketplace.setFeeWallet(user2.address))
        .to.emit(marketplace, "FeeWalletUpdated")
        .withArgs(feeWallet.address, user2.address);

      expect(await marketplace.feeWallet()).to.equal(user2.address);
    });

    it("Should not allow setting zero address as fee wallet", async function () {
      await expect(marketplace.setFeeWallet(ethers.ZeroAddress))
        .to.be.revertedWith("Fee wallet cannot be zero");
    });
  });

  describe("Minimum Deposit Management", function () {
    it("Should have default minimum deposit of 10 tokens (10 USD)", async function () {
      const minDeposit = await marketplace.minDepositAmount();
      expect(minDeposit).to.equal(ethers.parseEther("10"));
    });

    it("Should allow owner to update minimum deposit", async function () {
      const newMin = ethers.parseEther("20");
      const oldMin = await marketplace.minDepositAmount();
      
      await expect(marketplace.setMinDepositAmount(newMin))
        .to.emit(marketplace, "MinDepositUpdated")
        .withArgs(oldMin, newMin);

      expect(await marketplace.minDepositAmount()).to.equal(newMin);
    });

    it("Should not allow setting zero as minimum deposit", async function () {
      await expect(marketplace.setMinDepositAmount(0))
        .to.be.revertedWith("Minimum deposit must be greater than zero");
    });

    it("Should not allow non-owner to update minimum deposit", async function () {
      const newMin = ethers.parseEther("20");
      await expect(marketplace.connect(user1).setMinDepositAmount(newMin))
        .to.be.revertedWithCustomError(marketplace, "OwnableUnauthorizedAccount");
    });
  });
});

