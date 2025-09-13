import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SupplyChainTokensModule = buildModule("SupplyChainTokensModule", (m) => {
  // Base URI for metadata (can be updated later)
  const baseURI = "https://api.carbontrack.com/metadata/";

  const supplyChainTokens = m.contract("SupplyChainTokens", [baseURI]);

  return { supplyChainTokens };
});

export default SupplyChainTokensModule;
