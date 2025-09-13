import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
  console.log("🧪 Testing deployed SupplyChainTokens contract...");

  const contractAddress = "0xD6B231A6605490E83863D3B71c1C01e4E5B1212D";

  // Get the contract factory and attach to deployed contract
  const SupplyChainTokens = await ethers.getContractFactory("SupplyChainTokens");
  const contract = SupplyChainTokens.attach(contractAddress);

  console.log("📋 Contract Information:");
  console.log("=======================");

  // Test basic contract functions
  try {
    const owner = await contract.owner();
    console.log("👤 Owner:", owner);

    const currentTokenId = await contract.getCurrentTokenId();
    console.log("🆔 Current Token ID Counter:", currentTokenId.toString());

    const isPaused = await contract.paused();
    console.log("⏸️  Is Paused:", isPaused);

    const baseURI = await contract.uri(0);
    console.log("🌐 Base URI:", baseURI);

    console.log("\n✅ Contract is working correctly!");
    console.log("🎉 Ready for integration with your frontend!");

  } catch (error) {
    console.error("❌ Error testing contract:", error);
  }
}

main().catch((error) => {
  console.error("❌ Test failed:", error);
  process.exitCode = 1;
});
