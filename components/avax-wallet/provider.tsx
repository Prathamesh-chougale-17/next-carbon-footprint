"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, http, WagmiProvider } from "wagmi";
import { avalanche, avalancheFuji } from "wagmi/chains";

const queryClient = new QueryClient();

const config = createConfig({
  chains: [avalanche, avalancheFuji],
  transports: {
    [avalanche.id]: http(),
    [avalancheFuji.id]: http(),
  },
});

const AvaxWalletProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
};

export default AvaxWalletProvider;
