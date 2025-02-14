/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
"use client";
import { Button } from "@/components/ui/button";
import {
  ChatBubble,
  ChatBubbleMessage,
  ChatBubbleTimestamp,
} from "@/components/ui/chat/chat-bubble";
import { ChatInput } from "@/components/ui/chat/chat-input";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";
import { useTransition, animated, type AnimatedProps } from "@react-spring/web";
import { Paperclip, Send, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Content, UUID } from "@elizaos/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { cn, moment } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import CopyButton from "./copy-button";
import ChatTtsButton from "./ui/chat/chat-tts-button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import AIWriter from "react-aiwriter";
import type { IAttachment } from "@/types";
import { AudioRecorder } from "./audio-recorder";
import { Badge } from "./ui/badge";
import { useAutoScroll } from "./ui/chat/hooks/useAutoScroll";
import { provider, STRKTokenAddress } from "@/constants";
import { parseInputAmountToUint256 } from "@/helpers/token";
import { erc20Abi } from "@/abi/erc20Abi";
import { connect, disconnect, StarknetWindowObject } from "starknetkit";
import { Contract, uint256 } from "starknet";
import { useRepoStore } from "@/stores/repo-store";
import useStore from "@/hooks/use-Store";

type ExtraContentFields = {
  user: string;
  createdAt: number;
  isLoading?: boolean;
  metadata?: TransactionData;
};

type ContentWithUser = Content & ExtraContentFields;

type AnimatedDivProps = AnimatedProps<{ style: React.CSSProperties }> & {
  children?: React.ReactNode;
};

type TransactionData = {
  amount: string;
  recipient: string;
};

export default function Chat({
  agentId,
  userImage,
  userName,
  accessToken,
}: {
  agentId: UUID;
  userImage?: string;
  userName?: string;
  accessToken?: string;
}) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [input, setInput] = useState("");
  const [connection, setConnection] = useState<StarknetWindowObject>();
  const [address, setAddress] = useState<string | undefined | null>();
  const [isClient, setIsClient] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const selectedRepo = useStore(useRepoStore, (state) => state.selectedRepo);
  const queryClient = useQueryClient();
  const connectWallet = async () => {
    const { wallet, connectorData } = await connect({});
    if (wallet) {
      setConnection(wallet);
      setAddress(connectorData?.account);
    }
  };

  useEffect(() => {
    const connectToStarknet = async () => {
      const { wallet, connectorData } = await connect({
        modalMode: "neverAsk",
      });

      if (wallet && connectorData) {
        setConnection(wallet);
        setAddress(connectorData?.account);
      }
    };

    connectToStarknet();
  }, [address]);

  const getMessageVariant = (role: string) =>
    role !== "user" ? "received" : "sent";

  const { scrollRef, isAtBottom, scrollToBottom, disableAutoScroll } =
    useAutoScroll({
      smooth: true,
    });

  useEffect(() => {
    scrollToBottom();
  }, [queryClient.getQueryData(["messages", agentId])]);

  useEffect(() => {
    scrollToBottom();
  }, []);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const contract = new Contract(erc20Abi, STRKTokenAddress, provider);

  const sendTransaction = async (recipient: string, amount: string) => {
    console.log({ amount });

    if (!connection) {
      alert("Wallet not connected. Please connect your wallet.");
      return;
    }

    try {
      // Convert amount to Uint256
      const amountUint256 = uint256.bnToUint256(
        BigInt(parseFloat(amount) * 1e18)
      ); // Adjust for token decimals

      // Encode the function call using the ABI
      console.log({
        low: parseInputAmountToUint256(amount).low.toString(),
        high: parseInputAmountToUint256(amount).high.toString(),
      });

      const call = {
        contract_address: STRKTokenAddress,
        entry_point: "transfer",
        calldata: [
          recipient,
          parseInputAmountToUint256(amount).low.toString(),
          parseInputAmountToUint256(amount).high.toString(),
        ], // Uint256 is split into low and high parts
      };

      // Send the transaction
      await connection.request({
        type: "wallet_addInvokeTransaction",
        params: {
          calls: [call],
        },
      });

      alert("Transaction sent successfully!");
    } catch (error) {
      console.error(error, "error in sending transaction");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (e.nativeEvent.isComposing) return;
      handleSendMessage(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };
  const sendMessageMutation = useMutation({
    mutationKey: ["send_message", agentId],
    mutationFn: ({
      message,
      selectedFile,
    }: {
      message: string;
      selectedFile?: File | null;
    }) => apiClient.sendMessage(agentId, message, selectedFile),

    onSuccess: (newMessages: ContentWithUser[]) => {
      function containsTrx() {
        return newMessages.some((obj) => obj.metadata);
      }
      function findTrxObjects() {
        return newMessages.find((obj) => obj.metadata);
      }

      if (containsTrx()) {
        const dataObject = findTrxObjects();
        const trxDataObject = dataObject?.metadata as TransactionData;
        console.log(trxDataObject);

        sendTransaction(trxDataObject.recipient, String(trxDataObject.amount));
      }
      queryClient.setQueryData(
        ["messages", agentId],
        (old: ContentWithUser[] = []) => [
          ...old.filter((msg) => !msg.isLoading),
          ...newMessages.map((msg) => ({
            ...msg,
            createdAt: Date.now(),
          })),
        ]
      );
    },
    onError: (e) => {
      toast({
        variant: "destructive",
        title: "Unable to send message",
        description: e.message,
      });
    },
  });
  const handleSendMessage = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!input) return;

      const attachments: IAttachment[] | undefined = selectedFile
        ? [
            {
              url: URL.createObjectURL(selectedFile),
              contentType: selectedFile.type,
              title: selectedFile.name,
            },
          ]
        : undefined;

      const newMessages = [
        {
          text: input,
          user: "user",
          createdAt: Date.now(),
          attachments,
        },
        {
          text: input,
          user: "system",
          isLoading: true,
          createdAt: Date.now(),
        },
      ];

      queryClient.setQueryData(
        ["messages", agentId],
        (old: ContentWithUser[] = []) => [...old, ...newMessages]
      );

      sendMessageMutation.mutate({
        message: `${input} my repository is ${selectedRepo} and accessToken is ${accessToken}`,
        selectedFile: selectedFile ? selectedFile : null,
      });

      setSelectedFile(null);
      setInput("");
      formRef.current?.reset();
    },
    [
      accessToken,
      input,
      queryClient,
      selectedFile,
      sendMessageMutation,
      agentId,
      selectedRepo,
    ]
  );

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type.startsWith("image/")) {
      setSelectedFile(file);
    }
  };

  const messages =
    queryClient.getQueryData<ContentWithUser[]>(["messages", agentId]) || [];

  const transitions = useTransition(messages, {
    keys: (message) => `${message.createdAt}-${message.user}-${message.text}`,
    from: { opacity: 0, transform: "translateY(50px)" },
    enter: { opacity: 1, transform: "translateY(0px)" },
    leave: { opacity: 0, transform: "translateY(10px)" },
  });

  const CustomAnimatedDiv = animated.div as React.FC<AnimatedDivProps>;

  if (!isClient) {
    return null;
  }

  return (
    <div
      suppressHydrationWarning
      className="w-full flex flex-col h-[calc(100dvh-7dvh)] mx-auto max-w-6xl"
    >
      <div className="flex-1 overflow-y-auto">
        <ChatMessageList
          scrollRef={scrollRef}
          isAtBottom={isAtBottom}
          scrollToBottom={scrollToBottom}
          disableAutoScroll={disableAutoScroll}
        >
          {transitions((style, message: ContentWithUser) => {
            const variant = getMessageVariant(message?.user);
            return (
              <CustomAnimatedDiv
                style={{
                  ...style,
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  padding: "1rem",
                }}
              >
                <ChatBubble
                  variant={variant}
                  className="flex flex-row items-start gap-2"
                >
                  {message?.user !== "user" ? (
                    <Avatar className="size-8 p-1 border rounded-full select-none mt-1">
                      <AvatarImage src="/mira2.png" />
                    </Avatar>
                  ) : null}
                  <div className="flex flex-col">
                    <ChatBubbleMessage isLoading={message?.isLoading}>
                      {message?.user !== "user" ? (
                        <AIWriter>{message?.text}</AIWriter>
                      ) : (
                        message?.text
                      )}
                      {/* Attachments */}
                      <div>
                        {message?.attachments?.map((attachment) => (
                          <div
                            className="flex flex-col gap-1 mt-2"
                            key={`${attachment.url}-${attachment.title}`}
                          >
                            <img
                              alt="attachment"
                              src={attachment.url as string}
                              width="100%"
                              height="100%"
                              className="w-64 rounded-md"
                            />
                            <div className="flex items-center justify-between gap-4">
                              <span />
                              <span />
                            </div>
                          </div>
                        ))}
                      </div>
                    </ChatBubbleMessage>
                    <div className="flex items-center gap-4 justify-between w-full mt-1">
                      {message?.text && !message?.isLoading ? (
                        <div className="flex items-center gap-1">
                          <CopyButton text={message?.text} />
                          <ChatTtsButton
                            agentId={agentId}
                            text={message?.text}
                          />
                        </div>
                      ) : null}
                      <div
                        className={cn([
                          message?.isLoading ? "mt-2" : "",
                          "flex items-center justify-between gap-4 select-none",
                        ])}
                      >
                        {message?.source ? (
                          <Badge variant="outline">{message.source}</Badge>
                        ) : null}
                        {message?.action ? (
                          <Badge variant="outline">{message.action}</Badge>
                        ) : null}
                        {message?.createdAt ? (
                          <ChatBubbleTimestamp
                            timestamp={moment(message?.createdAt).format("LT")}
                          />
                        ) : null}
                      </div>
                    </div>
                  </div>
                  {message?.user === "user" ? (
                    <Avatar className="size-8 border rounded-full select-none mt-1">
                      <AvatarImage src={userImage} />
                      <AvatarFallback className="text-xs font-semibold">
                        {userName?.split(" ")[0][0]}
                        {userName?.split(" ")[1][0] || ""}
                      </AvatarFallback>
                    </Avatar>
                  ) : null}
                </ChatBubble>
              </CustomAnimatedDiv>
            );
          })}
        </ChatMessageList>
      </div>
      <div className=" pb-2 px-4 sticky bottom-0">
        <form
          ref={formRef}
          onSubmit={handleSendMessage}
          className=" rounded-md border bg-card w-full mx-auto"
        >
          {selectedFile ? (
            <div className="p-3 flex">
              <div className="relative rounded-md border p-2">
                <Button
                  onClick={() => setSelectedFile(null)}
                  className="absolute -right-2 -top-2 size-[22px] ring-2 ring-background"
                  variant="outline"
                  size="icon"
                >
                  <X />
                </Button>
                <img
                  alt="Selected file"
                  src={URL.createObjectURL(selectedFile)}
                  height="100%"
                  width="100%"
                  className="aspect-square object-contain w-16"
                />
              </div>
            </div>
          ) : null}
          <ChatInput
            ref={inputRef}
            onKeyDown={handleKeyDown}
            value={input}
            onChange={({ target }) => setInput(target.value)}
            placeholder="Type your message here..."
            className="min-h-12 resize-none rounded-md bg-card border-0 p-3 shadow-none focus-visible:ring-0"
          />
          <div className="flex items-center p-3 pt-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.click();
                        }
                      }}
                    >
                      <Paperclip className="size-4" />
                      <span className="sr-only">Attach file</span>
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Attach file</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <AudioRecorder
              agentId={agentId}
              onChange={(newInput: string) => setInput(newInput)}
            />
            <Button
              disabled={!input || sendMessageMutation?.isPending}
              type="submit"
              size="sm"
              className="ml-auto gap-1.5 h-[30px]"
            >
              {sendMessageMutation?.isPending ? "..." : "Send Message"}
              <Send className="size-3.5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
