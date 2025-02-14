"use client";

import { connectors } from "@/connectors";
import { mainnet, sepolia } from "@starknet-react/chains";
import { publicProvider, StarknetConfig } from "@starknet-react/core";

export default function StarknetProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const chains = [mainnet, sepolia];
  const providers = publicProvider();

  return (
    <StarknetConfig
      chains={chains}
      provider={providers}
      connectors={connectors}
    >
      {children}
    </StarknetConfig>
  );
}
