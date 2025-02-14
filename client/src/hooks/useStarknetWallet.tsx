"use client";

import { useState, useEffect, useCallback } from "react";
import { connect, disconnect } from "starknetkit";
import type { AccountInterface, ProviderInterface } from "starknet";
import type { Call, InvocationsDetails } from "starknet";

export function useStarknetWallet() {
  const [account, setAccount] = useState<AccountInterface | null>(null);
  const [provider, setProvider] = useState<ProviderInterface | null>(null);
  const [address, setAddress] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(false);
  const { wallet, connector, connectorData } = await connect();

  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    try {
      const connection = await connect();
      if (connection && connection.isConnected) {
        setAccount(connection.account);
        setProvider(connection.provider);
        setAddress(connection.selectedAddress);
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(async () => {
    try {
      await disconnect();
      setAccount(null);
      setProvider(null);
      setAddress("");
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
  }, []);

  const signTransaction = useCallback(
    async (calls: Call[], invocationsDetails: InvocationsDetails) => {
      if (!account) {
        throw new Error("Wallet not connected");
      }
      try {
        const response = await account.execute(
          calls,
          undefined,
          invocationsDetails
        );
        return response;
      } catch (error) {
        console.error("Error signing transaction:", error);
        throw error;
      }
    },
    [account]
  );

  useEffect(() => {
    const checkConnection = async () => {
      const connection = await connect({ showList: false });
      if (connection && connection.isConnected) {
        setAccount(connection.account);
        setProvider(connection.provider);
        setAddress(connection.selectedAddress);
      }
    };
    checkConnection();
  }, []);

  return {
    account,
    provider,
    address,
    isConnecting,
    connectWallet,
    disconnectWallet,
    signTransaction,
  };
}
