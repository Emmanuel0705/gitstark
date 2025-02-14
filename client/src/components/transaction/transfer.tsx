"use client";
import { STRKTokenAddress } from "@/constants";
import { parseInputAmountToUint256 } from "@/helpers/token";
import {
  useAccount,
  useContract,
  useSendTransaction,
} from "@starknet-react/core";
import { useState } from "react";
import { erc20Abi } from "../../abi/erc20Abi";
import { Button } from "../ui/button";

export function Transfer() {
  const { account } = useAccount();

  const [lastTxStatus, setLastTxStatus] = useState("idle");
  const [lastTxError, setLastTxError] = useState("");

  const { contract } = useContract({
    abi: erc20Abi,
    address: STRKTokenAddress,
  });

  const { sendAsync } = useSendTransaction({
    calls:
      contract && account?.address
        ? [
            contract.populate("transfer", [
              "0x044015e4766d36f6d31458fed9f292c3afafd08f1991b1f58f5a14826d7fa22a",
              parseInputAmountToUint256("0.000000001"),
            ]),
          ]
        : undefined,
  });

  const buttonsDisabled = ["approve"].includes(lastTxStatus);

  const handleTransferSubmit = async (e: React.FormEvent) => {
    try {
      setLastTxError("");
      e.preventDefault();
      setLastTxStatus("approve");
      const { transaction_hash } = await sendAsync();
      setTimeout(() => {
        alert(`Transaction sent: ${transaction_hash}`);
      });
    } catch (error) {
      setLastTxError((error as Error).message);
    } finally {
      setLastTxStatus("idle");
    }
  };

  return (
    <div className="flex w-full column gap-2">
      <Button
        className="w-full"
        onClick={handleTransferSubmit}
        disabled={buttonsDisabled}
      >
        {lastTxStatus === "approve" ? "Waiting for transaction" : "Send ERC20"}
      </Button>
      {lastTxError ? (
        <span style={{ color: "red" }}>Error: {lastTxError}</span>
      ) : null}
    </div>
  );
}
