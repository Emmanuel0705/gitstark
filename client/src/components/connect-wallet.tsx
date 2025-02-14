/* eslint-disable @typescript-eslint/no-explicit-any */
// "use client";

// import { useAccount, useConnect, useStarkProfile } from "@starknet-react/core";
// import { StarknetkitConnector, useStarknetkitConnectModal } from "starknetkit";
// import { Button, buttonVariants } from "./ui/button";
// import { isMainnet, toHexChainid } from "@/helpers/chainId";
// import { ExternalLink, User } from "lucide-react";
// import { formatTruncatedAddress } from "@/helpers/formatAddress";
// import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
// import { useEffect, useState } from "react";

// export function WalletConnectButton() {
//   const { connectAsync, connectors } = useConnect();
//   const { address, isConnected, chainId } = useAccount();
//   const [isClient, setIsClient] = useState(false);

//   const { data } = useStarkProfile({ address });

//   const hexChainId = toHexChainid(chainId);
//   const { starknetkitConnectModal } = useStarknetkitConnectModal({
//     connectors: connectors as StarknetkitConnector[],
//     // modalTheme: "dark",
//   });
//   useEffect(() => {
//     setIsClient(true);
//   }, []);

//   if (!isClient) {
//     return null;
//   }
//   // console.log({ address, isConnected, chainId, balance, data, hexChainId });

//   return (
//     <>
//       {isConnected && address && (
//         <div
//           className={buttonVariants({
//             variant: "ghost",
//             className: "hover:bg-transparent",
//           })}
//         >
//           <div className="border-solid border-l-[1px] border-charcoal -my-1 mx-0  hidden md:flex" />
//           <Button
//             variant="ghost"
//             className="flex cursor-pointer items-center gap-2"
//             onClick={() =>
//               window.open(
//                 isMainnet(hexChainId)
//                   ? `https://voyager.online/contract/${address}`
//                   : `https://sepolia.voyager.online/contract/${address}`,
//                 "_blank"
//               )
//             }
//           >
//             {data?.profilePicture ? (
//               <Avatar className="size-5 rounded-sm">
//                 <AvatarImage
//                   src={data?.profilePicture}
//                   alt="@generic_profile"
//                 />
//                 <AvatarFallback></AvatarFallback>
//               </Avatar>
//             ) : (
//               <User />
//             )}
//             {formatTruncatedAddress(address || "")}
//             <ExternalLink />
//           </Button>
//         </div>
//       )}
//       {!isConnected && !address && (
//         <Button
//           onClick={async () => {
//             const { connector } = await starknetkitConnectModal();
//             if (!connector) {
//               // or throw error
//               return;
//             }
//             await connectAsync({ connector });
//           }}
//         >
//           Connect wallet
//         </Button>
//       )}
//     </>
//   );
// }
"use client";
import React, { useEffect, useState } from "react";
import { connect } from "starknetkit";
import { Button, buttonVariants } from "./ui/button";
import { isMainnet, toHexChainid } from "@/helpers/chainId";
import { useStarkProfile } from "@starknet-react/core";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ExternalLink, User } from "lucide-react";
import { formatTruncatedAddress } from "@/helpers/formatAddress";

export function WalletConnectButton() {
  const [connection, setConnection] = useState<any>();
  const [address, setAddress] = useState<any>();
  const [chainId, setChainId] = useState<any>();
  const { data } = useStarkProfile({ address });
  const connectWallet = async () => {
    const { wallet, connectorData } = await connect({
      // modalMode: "neverAsk",
      modalTheme: "dark",
    });

    if (wallet && connectorData) {
      setConnection(wallet);
      setAddress(connectorData.account);
      setChainId(connectorData.chainId);
    }
  };
  const hexChainId = toHexChainid(chainId);

  useEffect(() => {
    const connectToStarknet = async () => {
      const { wallet, connectorData } = await connect({
        modalMode: "neverAsk",
      });

      if (wallet && connectorData) {
        setConnection(wallet);
        setAddress(connectorData.account);
        setChainId(connectorData.chainId);
      }
    };

    connectToStarknet();
  }, []);

  if (connection && address) {
    return (
      <div
        className={buttonVariants({
          variant: "ghost",
          className: "hover:bg-transparent",
        })}
      >
        <div className="border-solid border-l-[1px] border-charcoal -my-1 mx-0  hidden md:flex" />
        <Button
          variant="ghost"
          className="flex cursor-pointer items-center gap-2"
          onClick={() =>
            window.open(
              isMainnet(hexChainId)
                ? `https://voyager.online/contract/${address}`
                : `https://sepolia.voyager.online/contract/${address}`,
              "_blank"
            )
          }
        >
          {data?.profilePicture ? (
            <Avatar className="size-5 rounded-sm">
              <AvatarImage src={data?.profilePicture} alt="@generic_profile" />
              <AvatarFallback></AvatarFallback>
            </Avatar>
          ) : (
            <User />
          )}
          {formatTruncatedAddress(address || "")}
          <ExternalLink />
        </Button>
      </div>
    );
  }

  return <Button onClick={connectWallet}>Connect Wallet</Button>;
}
