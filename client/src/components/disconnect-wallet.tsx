"use client";
import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { useAccount, useDisconnect } from "@starknet-react/core";
import { DisconnectSVGComponent } from "./icon";

export default function DisconnectWallet() {
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect({});
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }
  return (
    <Button onClick={() => disconnect()} disabled={!isConnected}>
      <DisconnectSVGComponent />
      Disconnect
    </Button>
  );
}
