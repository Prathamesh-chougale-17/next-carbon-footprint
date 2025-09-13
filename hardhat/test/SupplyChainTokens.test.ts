import { expect } from "chai";
import { ethers } from "hardhat";
import { SupplyChainTokens } from "../typechain-types";

describe("SupplyChainTokens", function () {
  let supplyChainTokens: SupplyChainTokens;
  let owner: any;
  let manufacturer: any;
  let partner: any;

  const BASE_URI = "https://api.carbontrack.com/metadata/";
  const BATCH_NUMBER = 12345;
  const TEMPLATE_ID = "TEMPLATE_001";
  const QUANTITY = 100;
  const CARBON_FOOTPRINT = 500; // 500 kg CO2
  const PLANT_ID = "PLANT_A";

  beforeEach(async function () {
    [owner, manufacturer, partner] = await ethers.getSigners();

    const SupplyChainTokensFactory = await ethers.getContractFactory("SupplyChainTokens");
    supplyChainTokens = await SupplyChainTokensFactory.deploy(BASE_URI);
    await supplyChainTokens.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct base URI", async function () {
      expect(await supplyChainTokens.uri(0)).to.equal(BASE_URI);
    });

    it("Should set the correct owner", async function () {
      expect(await supplyChainTokens.owner()).to.equal(owner.address);
    });

    it("Should start with token ID counter at 1", async function () {
      expect(await supplyChainTokens.getCurrentTokenId()).to.equal(1);
    });
  });

  describe("Batch Minting", function () {
    it("Should mint a new batch successfully", async function () {
      const productionDate = Math.floor(Date.now() / 1000);
      const expiryDate = productionDate + (30 * 24 * 60 * 60); // 30 days from now
      const metadataURI = "ipfs://QmTestMetadata";

      const tx = await supplyChainTokens.connect(manufacturer).mintBatch(
        BATCH_NUMBER,
        TEMPLATE_ID,
        QUANTITY,
        productionDate,
        expiryDate,
        CARBON_FOOTPRINT,
        PLANT_ID,
        metadataURI,
        "0x"
      );

      await expect(tx)
        .to.emit(supplyChainTokens, "BatchMinted")
        .withArgs(1, BATCH_NUMBER, manufacturer.address, TEMPLATE_ID, QUANTITY, CARBON_FOOTPRINT);

      // Check batch info
      const batchInfo = await supplyChainTokens.getBatchInfo(1);
      expect(batchInfo.batchNumber).to.equal(BATCH_NUMBER);
      expect(batchInfo.manufacturer).to.equal(manufacturer.address);
      expect(batchInfo.templateId).to.equal(TEMPLATE_ID);
      expect(batchInfo.quantity).to.equal(QUANTITY);
      expect(batchInfo.carbonFootprint).to.equal(CARBON_FOOTPRINT);
      expect(batchInfo.plantId).to.equal(PLANT_ID);
      expect(batchInfo.isActive).to.be.true;

      // Check token balance
      expect(await supplyChainTokens.balanceOf(manufacturer.address, 1)).to.equal(QUANTITY);
    });

    it("Should prevent minting duplicate batch numbers", async function () {
      const productionDate = Math.floor(Date.now() / 1000);
      const expiryDate = productionDate + (30 * 24 * 60 * 60);
      const metadataURI = "ipfs://QmTestMetadata";

      // First mint should succeed
      await supplyChainTokens.connect(manufacturer).mintBatch(
        BATCH_NUMBER,
        TEMPLATE_ID,
        QUANTITY,
        productionDate,
        expiryDate,
        CARBON_FOOTPRINT,
        PLANT_ID,
        metadataURI,
        "0x"
      );

      // Second mint with same batch number should fail
      await expect(
        supplyChainTokens.connect(manufacturer).mintBatch(
          BATCH_NUMBER,
          TEMPLATE_ID,
          QUANTITY,
          productionDate,
          expiryDate,
          CARBON_FOOTPRINT,
          PLANT_ID,
          metadataURI,
          "0x"
        )
      ).to.be.revertedWith("SupplyChainTokens: Batch already exists for this manufacturer");
    });

    it("Should prevent minting with zero quantity", async function () {
      const productionDate = Math.floor(Date.now() / 1000);
      const expiryDate = productionDate + (30 * 24 * 60 * 60);
      const metadataURI = "ipfs://QmTestMetadata";

      await expect(
        supplyChainTokens.connect(manufacturer).mintBatch(
          BATCH_NUMBER,
          TEMPLATE_ID,
          0, // Zero quantity
          productionDate,
          expiryDate,
          CARBON_FOOTPRINT,
          PLANT_ID,
          metadataURI,
          "0x"
        )
      ).to.be.revertedWith("SupplyChainTokens: Quantity must be greater than 0");
    });
  });

  describe("Partner Transfers", function () {
    beforeEach(async function () {
      const productionDate = Math.floor(Date.now() / 1000);
      const expiryDate = productionDate + (30 * 24 * 60 * 60);
      const metadataURI = "ipfs://QmTestMetadata";

      await supplyChainTokens.connect(manufacturer).mintBatch(
        BATCH_NUMBER,
        TEMPLATE_ID,
        QUANTITY,
        productionDate,
        expiryDate,
        CARBON_FOOTPRINT,
        PLANT_ID,
        metadataURI,
        "0x"
      );
    });

    it("Should transfer tokens to partner successfully", async function () {
      const transferQuantity = 50;
      const reason = "Delivery to customer";
      const metadata = "Order #12345";

      const tx = await supplyChainTokens.connect(manufacturer).transferToPartner(
        partner.address,
        1, // Token ID
        transferQuantity,
        reason,
        metadata
      );

      await expect(tx)
        .to.emit(supplyChainTokens, "BatchTransferred")
        .withArgs(1, manufacturer.address, partner.address, transferQuantity, reason);

      // Check balances
      expect(await supplyChainTokens.balanceOf(manufacturer.address, 1)).to.equal(QUANTITY - transferQuantity);
      expect(await supplyChainTokens.balanceOf(partner.address, 1)).to.equal(transferQuantity);

      // Check transfer history
      const transferHistory = await supplyChainTokens.getTransferHistory(1);
      expect(transferHistory.length).to.equal(2); // Initial mint + transfer
      expect(transferHistory[1].from).to.equal(manufacturer.address);
      expect(transferHistory[1].to).to.equal(partner.address);
      expect(transferHistory[1].quantity).to.equal(transferQuantity);
      expect(transferHistory[1].reason).to.equal(reason);
    });

    it("Should prevent transferring more tokens than owned", async function () {
      const transferQuantity = QUANTITY + 1; // More than owned
      const reason = "Delivery to customer";
      const metadata = "Order #12345";

      await expect(
        supplyChainTokens.connect(manufacturer).transferToPartner(
          partner.address,
          1,
          transferQuantity,
          reason,
          metadata
        )
      ).to.be.revertedWith("SupplyChainTokens: Insufficient balance");
    });

    it("Should prevent transferring to zero address", async function () {
      const transferQuantity = 50;
      const reason = "Delivery to customer";
      const metadata = "Order #12345";

      await expect(
        supplyChainTokens.connect(manufacturer).transferToPartner(
          ethers.ZeroAddress,
          1,
          transferQuantity,
          reason,
          metadata
        )
      ).to.be.revertedWith("SupplyChainTokens: Cannot transfer to zero address");
    });
  });

  describe("Batch Information", function () {
    beforeEach(async function () {
      const productionDate = Math.floor(Date.now() / 1000);
      const expiryDate = productionDate + (30 * 24 * 60 * 60);
      const metadataURI = "ipfs://QmTestMetadata";

      await supplyChainTokens.connect(manufacturer).mintBatch(
        BATCH_NUMBER,
        TEMPLATE_ID,
        QUANTITY,
        productionDate,
        expiryDate,
        CARBON_FOOTPRINT,
        PLANT_ID,
        metadataURI,
        "0x"
      );
    });

    it("Should return correct batch information", async function () {
      const batchInfo = await supplyChainTokens.getBatchInfo(1);
      expect(batchInfo.batchNumber).to.equal(BATCH_NUMBER);
      expect(batchInfo.manufacturer).to.equal(manufacturer.address);
      expect(batchInfo.templateId).to.equal(TEMPLATE_ID);
      expect(batchInfo.quantity).to.equal(QUANTITY);
      expect(batchInfo.carbonFootprint).to.equal(CARBON_FOOTPRINT);
      expect(batchInfo.plantId).to.equal(PLANT_ID);
      expect(batchInfo.isActive).to.be.true;
    });

    it("Should return correct token ID for batch", async function () {
      const tokenId = await supplyChainTokens.getTokenIdByBatch(BATCH_NUMBER, manufacturer.address);
      expect(tokenId).to.equal(1);
    });

    it("Should check if batch exists", async function () {
      expect(await supplyChainTokens.batchExists(BATCH_NUMBER, manufacturer.address)).to.be.true;
      expect(await supplyChainTokens.batchExists(99999, manufacturer.address)).to.be.false;
    });

    it("Should return transfer history", async function () {
      const transferHistory = await supplyChainTokens.getTransferHistory(1);
      expect(transferHistory.length).to.equal(1); // Only initial mint
      expect(transferHistory[0].from).to.equal(ethers.ZeroAddress);
      expect(transferHistory[0].to).to.equal(manufacturer.address);
      expect(transferHistory[0].reason).to.equal("Batch Creation");
    });
  });

  describe("Pausable", function () {
    it("Should pause and unpause contract", async function () {
      await supplyChainTokens.pause();
      expect(await supplyChainTokens.paused()).to.be.true;

      await supplyChainTokens.unpause();
      expect(await supplyChainTokens.paused()).to.be.false;
    });

    it("Should prevent minting when paused", async function () {
      await supplyChainTokens.pause();

      const productionDate = Math.floor(Date.now() / 1000);
      const expiryDate = productionDate + (30 * 24 * 60 * 60);
      const metadataURI = "ipfs://QmTestMetadata";

      await expect(
        supplyChainTokens.connect(manufacturer).mintBatch(
          BATCH_NUMBER,
          TEMPLATE_ID,
          QUANTITY,
          productionDate,
          expiryDate,
          CARBON_FOOTPRINT,
          PLANT_ID,
          metadataURI,
          "0x"
        )
      ).to.be.revertedWithCustomError(supplyChainTokens, "EnforcedPause");
    });
  });
});
