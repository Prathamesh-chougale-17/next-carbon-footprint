import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
  console.log("🚀 Starting SupplyChainTokens deployment...");

  // Get the contract factory
  const SupplyChainTokens = await ethers.getContractFactory("SupplyChainTokens");

  // Base URI for metadata (can be updated later)
  const baseURI = "https://api.carbontrack.com/metadata/";

  console.log("📦 Deploying SupplyChainTokens...");

  // Deploy the contract
  const supplyChainTokens = await SupplyChainTokens.deploy(baseURI);
  await supplyChainTokens.waitForDeployment();

  const contractAddress = await supplyChainTokens.getAddress();
  const deploymentTx = supplyChainTokens.deploymentTransaction();

  console.log("✅ SupplyChainTokens deployed successfully!");
  console.log("📍 Contract Address:", contractAddress);
  console.log("🔗 Deployment Transaction:", deploymentTx?.hash);
  console.log("⛽ Gas Used:", deploymentTx?.gasLimit?.toString());

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const owner = await supplyChainTokens.owner();
  const currentTokenId = await supplyChainTokens.getCurrentTokenId();
  const isPaused = await supplyChainTokens.paused();

  console.log("👤 Owner:", owner);
  console.log("🆔 Current Token ID Counter:", currentTokenId.toString());
  console.log("⏸️  Is Paused:", isPaused);

  // Only try to get URI if tokens exist
  try {
    if (currentTokenId.gt(0)) {
      console.log("🌐 Sample URI:", await supplyChainTokens.uri(0));
    } else {
      console.log("🌐 No tokens minted yet - URI function ready");
    }
  } catch (error) {
    console.log("🌐 URI function ready (no tokens minted yet)");
  }

  console.log("\n📋 Deployment Summary:");
  console.log("===================");
  console.log("Contract: SupplyChainTokens");
  console.log("Address:", contractAddress);
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Chain ID:", (await ethers.provider.getNetwork()).chainId);

  // Save deployment info to file
  const fs = require('fs');
  const deploymentInfo = {
    contractName: "SupplyChainTokens",
    address: contractAddress,
    deploymentTx: deploymentTx?.hash,
    gasUsed: deploymentTx?.gasLimit?.toString(),
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployer: owner,
    timestamp: new Date().toISOString(),
    baseURI: baseURI
  };

  const deploymentFile = `deployments/${(await ethers.provider.getNetwork()).name}-${Date.now()}.json`;

  // Create deployments directory if it doesn't exist
  if (!fs.existsSync('deployments')) {
    fs.mkdirSync('deployments');
  }

  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`💾 Deployment info saved to: ${deploymentFile}`);

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📝 Next Steps:");
  console.log("1. Verify the contract on SnowTrace (if on Avalanche)");
  console.log("2. Update your frontend with the contract address");
  console.log("3. Test the contract functionality");
  console.log("4. Set up event listeners for batch creation");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
