"use client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FormEvent, useEffect, useState } from "react";
import { MemoizedReactMarkdown } from "./rendering/common/markdown";
import { useScrollAnchor } from "@/hooks/use-scroll-anchor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { systemPrompt } from "@/app/app/chatbot/page";
import EmptyScreen from "./empty-screen";
import { Textarea } from "../ui/textarea";
import { TransactionList } from "./rendering/transaction-list";
import DuneAnalytics from "./rendering/top-wallets";
import ProfileData from "./rendering/profile-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TokenAllocation } from "./rendering/token-allocation";
import { TokenTransfers } from "./rendering/nodeit/token-transfers";
import { ChainTokenTransfers } from "./rendering/nodeit/token-transfer-chain";
import { DailyStats } from "./rendering/nodeit/daily-stats";
import { TransactionStats } from "./rendering/nodeit/transaction-stats";
import { TokenMetadata } from "./rendering/nodeit/token-metadata";

interface ToolAnnotation {
  type: string;
  toolCallId: string;
  status: string;
  componentName?: string;
  data?: any;
  chain?: string;
}

interface Message {
  id: string;
  role: string;
  content: string;
}

export default function ChatComponent({
  error,
  openModal,
}: {
  error: any;
  openModal: () => void;
}) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const { containerRef, messagesRef, scrollToBottom } = useScrollAnchor();
  const [useNano, setUseNano] = useState(false);
  const [toolAnnotations, setToolAnnotations] = useState<{
    [messageId: string]: ToolAnnotation[];
  }>({});

  const handleSendMessage = async (message: string) => {
    // Set input and mesages
    await Promise.all([
      new Promise<void>((resolve) => {
        setInput(message);
        resolve();
      }),
    ]);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const form = document.querySelector("form");
    if (form) {
      const submitEvent = new SubmitEvent("submit", {
        bubbles: true,
        cancelable: true,
      });
      form.dispatchEvent(submitEvent);
    }
  };

  const handleKeyDown = (e: {
    key: string;
    shiftKey: any;
    preventDefault: () => void;
  }) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        e.preventDefault();
        setInput((prevInput) => prevInput + "\n");
      } else {
        e.preventDefault();
        const form = (
          e as unknown as { target: HTMLTextAreaElement }
        ).target.closest("form");
        if (form) form.requestSubmit();
      }
    }
  };

  const [toolDefaults, setToolDefaults] = useState({
    chain: "base",
    walletAddress: "0x9369d176081C548c9E72997e61A03E0e6DB94697",
    limit: 5,
    offset: 0,
    userId: 1,
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const userMessageId = `user-${Date.now()}`;
    const userMessage: Message = {
      id: userMessageId,
      content: input,
      role: "user",
    };

    const messagesForApi = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const newMessages: Message[] = [...messages, userMessage];
    setInput("");
    setMessages(newMessages);
    scrollToBottom();

    try {
      const assistantMessageId = `assistant-${Date.now()}`;

      if (useNano) {
        //@ts-ignore
        const model = await window.ai.languageModel.create({
          systemPrompt: systemPrompt,
        });
        const stream = await model.promptStreaming(
          "User: " + userMessage.content
        );
        let result = "";
        let previousChunk = "";
        for await (const chunk of stream) {
          const newChunk = chunk.startsWith(previousChunk)
            ? chunk.slice(previousChunk.length)
            : chunk;
          result += newChunk;
          previousChunk = chunk;

          setMessages([
            ...newMessages,
            {
              id: assistantMessageId,
              role: "assistant",
              content: result,
            },
          ]);
          scrollToBottom();
          toast("New message", {
            description: "Trickle AI has responded to your message",
            duration: 3000,
          });
        }
      } else {
        const apiMessages = [
          ...messagesForApi,
          { role: userMessage.role, content: userMessage.content },
        ];

        const response = await fetch("/api/chat/gemini", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: apiMessages,
            toolDefaults: toolDefaults,
          }),
        });

        if (!response.ok) {
          throw new Error(
            `Failed to fetch response from ${useNano ? "Nano" : "Gemini"} model`
          );
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let result = "";
        let currentAnnotations: ToolAnnotation[] = [];

        if (reader) {
          try {
            let buffer = "";

            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                toast("New message", {
                  description: "Trickle AI has responded to your message",
                  duration: 3000,
                });
                break;
              }

              const chunk = decoder.decode(value);
              buffer += chunk;
              const lines = buffer.split("\n");
              buffer = lines.pop() || ""; // Keep the last incomplete line in the buffer

              // Inside the section where you process data lines
              for (const line of lines) {
                if (!line.trim()) continue;
                if (line.startsWith("data:")) {
                  try {
                    const dataContent = line.slice(5).trim();
                    if (!dataContent || dataContent === "[DONE]") continue;
                    const jsonData = JSON.parse(dataContent);

                    if (
                      jsonData.type === "tool-status" ||
                      jsonData.type === "custom-render"
                    ) {
                      currentAnnotations.push(jsonData);
                      setToolAnnotations((prev) => ({
                        ...prev,
                        [assistantMessageId]: currentAnnotations,
                      }));
                    }
                  } catch (e) {
                    console.log('Error parsing annotation data:', e, line);
                  }
                } else if (line.startsWith("0:")) {
                  try {
                    const content = line
                      .slice(2)
                      .trim()
                      .replace(/^"|\"$/g, "")
                      .replace(/\\n/g, "\n");
                    result += content;
                  } catch (e) {
                    console.log('Error parsing content:', e, line);
                  }
                } else if (line.startsWith("a:")) {
                  try {
                    const lineJson = JSON.parse(line.slice(2)).result;
                    const toolResultJson = JSON.parse(lineJson);
                    console.log("Tool result:", toolResultJson);

                    if (toolResultJson.transactions) {
                      currentAnnotations.push({
                        type: "tool-result",
                        toolCallId: toolResultJson.toolCallId,
                        status: "success",
                        data: toolResultJson.transactions,
                        chain: toolResultJson.chain,
                        componentName: "TransactionList",
                      });
                    } else if (toolResultJson.wallets) {
                      currentAnnotations.push({
                        type: "tool-result",
                        toolCallId: toolResultJson.toolCallId,
                        status: "success",
                        data: toolResultJson.wallets,
                        chain: toolResultJson.chain,
                        componentName: "DuneAnalytics",
                      });
                    } else if (toolResultJson.table) {
                      console.log('Table result:', toolResultJson.table);
                      currentAnnotations.push({
                        type: 'tool-result',
                        toolCallId: toolResultJson.toolCallId,
                        status: 'success',
                        data: toolResultJson.data,
                        componentName: 'ProfileData',
                      })
                    } else if (toolResultJson.type === 'allocation') {
                      console.log('Token allocation result:', toolResultJson);
                      currentAnnotations.push({
                        type: 'tool-result',
                        toolCallId: toolResultJson.toolCallId,
                        status: 'success',
                        data: toolResultJson,
                        componentName: 'TokenAllocation',
                      })
                    } else if (toolResultJson.type === 'tool-result' && toolResultJson.componentName === 'TokenTransfers') {
                      console.log('Token transfers result:', toolResultJson);
                      currentAnnotations.push({
                        type: 'tool-result',
                        toolCallId: toolResultJson.toolCallId,
                        status: toolResultJson.status,
                        data: toolResultJson.data,
                        componentName: 'TokenTransfers'
                      });
                    } else if (toolResultJson.type === 'tool-result' && toolResultJson.componentName === 'ContractTokenTransfers') {
                      console.log('Token transfers result:', toolResultJson);
                      currentAnnotations.push({
                        type: 'tool-result',
                        toolCallId: toolResultJson.toolCallId,
                        status: toolResultJson.status,
                        data: toolResultJson.data,
                        chain: toolResultJson.data.metadata.network,
                        componentName: 'ContractTokenTransfers'
                      });
                    } else if (toolResultJson.type === 'tool-result' && toolResultJson.componentName === 'DailyStats') {
                      console.log('Daily stats result:', toolResultJson);
                      currentAnnotations.push({
                        type: 'tool-result',
                        toolCallId: toolResultJson.toolCallId,
                        status: toolResultJson.status,
                        data: toolResultJson.data,
                        chain: toolResultJson.data.metadata.network,
                        componentName: 'DailyStats'
                      });
                    } else if (toolResultJson.type === 'tool-result' && toolResultJson.componentName === 'TransactionStats') {
                      console.log('Transaction stats result:', toolResultJson);
                      currentAnnotations.push({
                        type: 'tool-result',
                        toolCallId: toolResultJson.toolCallId,
                        status: toolResultJson.status,
                        data: toolResultJson.data,
                        chain: toolResultJson.data.metadata.network,
                        componentName: 'TransactionStats'
                      });
                    } else if (toolResultJson.type === 'tool-result' && toolResultJson.componentName === 'TokenMetadata') {
                      console.log('Token metadata result:', toolResultJson);
                      currentAnnotations.push({
                        type: 'tool-result',
                        toolCallId: toolResultJson.toolCallId,
                        status: toolResultJson.status,
                        data: toolResultJson.data,
                        chain: toolResultJson.data.protocol,
                        componentName: 'TokenMetadata'
                      });
                    }
                    setToolAnnotations((prev) => ({
                      ...prev,
                      [assistantMessageId]: currentAnnotations,
                    }));
                  } catch (e) {
                    console.log('Error parsing tool result:', e, line);
                  }
                } else if (line.startsWith("e:")) {
                  break; // Exit the loop after receiving the error message
                } else {
                  console.log("Unknown line format:", line);
                }
              }

              setMessages([
                ...newMessages,
                {
                  id: assistantMessageId,
                  role: "assistant",
                  content: result,
                },
              ]);
              scrollToBottom();
            }
          } finally {
            reader.releaseLock();
          }
        }
      }
    } catch (e) {
      console.log('Chat error:', e);
      const errorMessageId = `error-${Date.now()}`;
      setMessages([
        ...newMessages,
        {
          id: errorMessageId,
          role: "assistant",
          content: `Error: Failed to get response from ${
            useNano ? "Nano" : "Gemini"
          } model. Please try again.`,
        },
      ]);
      scrollToBottom();
    }
  };

  const renderToolComponent = (annotation: ToolAnnotation) => {
    if (annotation.data) {
      console.log(annotation, "AAAAAAA");
      if (annotation.componentName === "TransactionList") {
        return (
          <TransactionList
            data={annotation.data}
            chain={annotation.chain ?? toolDefaults.chain}
          />
        );
      } else if (annotation.componentName === "DuneAnalytics") {
        return <DuneAnalytics data={annotation.data} />;
      } else if (annotation.componentName === "ProfileData") {
        return <ProfileData data={annotation.data} />;
      } else if (annotation.componentName === 'TokenAllocation') {
        return <TokenAllocation data={annotation.data} onSendMessage={handleSendMessage} />;
      } else if (annotation.componentName === 'TokenTransfers') {
        return <TokenTransfers data={annotation.data} />;
      } else if (annotation.componentName === 'ContractTokenTransfers') {
        return <ChainTokenTransfers data={annotation.data} chain={annotation.chain} />;
      } else if (annotation.componentName === 'DailyStats') {
        return <DailyStats data={annotation.data} chain={annotation.chain} />;
      } else if (annotation.componentName === 'TransactionStats') {
        return <TransactionStats data={annotation.data} chain={annotation.chain} />;
      } else if (annotation.componentName === 'TokenMetadata') {
        return <TokenMetadata data={annotation.data} chain={annotation.chain} />;
      } 
    }

    return null;
  };

  useEffect(() => {
    const savedMessages = localStorage.getItem("chatMessages");
    const savedAnnotations = localStorage.getItem("chatAnnotations");
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
    if (savedAnnotations) {
      setToolAnnotations(JSON.parse(savedAnnotations));
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("chatMessages", JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    if (Object.keys(toolAnnotations).length > 0) {
      localStorage.setItem("chatAnnotations", JSON.stringify(toolAnnotations));
    }
  }, [toolAnnotations]);

  const clearChatHistory = () => {
    setMessages([]);
    setToolAnnotations({});
    localStorage.removeItem("chatMessages");
    localStorage.removeItem("chatAnnotations");
  };

  return (
    <div className="flex flex-col flex-1 h-screen items-center">
      <div
        className="flex-1 p-2 overflow-auto mb-[120px] md:mb-[140px] h-full max-w-[720px]"
        ref={containerRef}
      >
        <div
          className="flex min-h-full mb-32 md:mb-0 flex-col gap-4 py-4 overflow-visible"
          ref={messagesRef}
        >
          {messages.length > 0 ? (
            messages.map((m) => {
              const annotations = toolAnnotations[m.id] || [];
              if (m.role === "user") {
                return <UserMessage key={m.id} message={m} />;
              } else if (m.role === "assistant") {
                return (
                  <div key={m.id} className="flex flex-col gap-4">
                    <BotMessage message={m} />
                    {annotations.length > 0 && (
                      <div className="ml-11 flex flex-col gap-3 rounded-[30px]">
                        {annotations
                          .filter((ann) => ann.type === "tool-result")
                          .map((annotation, idx) => (
                            <div key={`tool-${m.id}-${idx}`} className="relative rounded-[30px] max-w-[80%]">
                              {renderToolComponent(annotation)}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            })
          ) : (
            <div className="mx-auto my-auto text-center w-full max-w-md flex items-center justify-center h-full">
              <EmptyScreen
                openModal={openModal}
                onSendMessage={handleSendMessage}
              />
            </div>
          )}
        </div>
      </div>
      <form
        onSubmit={handleSubmit}
        className="fixed bottom-18 md:bottom-0 w-full max-w-3xl mx-auto rounded-t-2xl border bg-muted/50 px-4 py-3 border-muted-foreground/20"
      >
        <div className="flex justify-start items-start gap-4 flex-col">
          <div className="relative flex-1 w-full">
            <Textarea
              placeholder="Type your message..."
              className="w-full shadow-none bg-transparent p-0 rounded-none pr-12 border-none ring-0 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none hover:border-none focus:border-none resize-none overflow-auto max-h-[90px]"
              disabled={error && useNano}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className="relative w-full flex">
            <Select
              value={useNano ? "nano" : "gemini"}
              onValueChange={(value) => setUseNano(value === "nano")}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini">Gemini 2.0</SelectItem>
                <SelectItem value="nano">Nano</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="submit"
              size="icon"
              className="absolute h-8 w-8 rounded-[10px] right-2 top-1/2 -translate-y-1/2 hover:bg-accent hover:text-accent-foreground"
            >
              <SendIcon className="h-2 w-2" />
              <span className="sr-only">Send</span>
            </Button>

            <div className="flex justify-between items-center w-full max-w-[720px] px-2">
              <Button
                variant="neutral"
                size="sm"
                disabled={messages.length === 0}
                onClick={clearChatHistory}
                className={cn(
                  "text-muted-foreground rounded-xl hover:text-foreground",
                  messages.length === 0
                    ? "hover:cursor-not-allowed"
                    : "hover:cursor-pointer"
                )}
              >
                Clear History
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function SendIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

const UserMessage = ({ message }: { message: Message }) => {
  return (
    <div className="flex items-start gap-3 justify-end w-ful max-w-[93%]">
      <div className="bg-primary rounded-lg p-3 max-w-[80%] text-primary-foreground break-words">
        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
      </div>
      <Avatar className="w-8 h-8 shrink-0">
        <AvatarImage src="/placeholder-user.jpg" />
        <AvatarFallback>Me</AvatarFallback>
      </Avatar>
    </div>
  );
};

const BotMessage = ({ message }: { message: Message }) => {
  return (
    <div className="flex items-start gap-3 w-full max-w-[93%]">
      <Avatar className="w-8 h-8 shrink-0">
        <AvatarImage src="/placeholder-user.jpg" />
        <AvatarFallback>BOT</AvatarFallback>
      </Avatar>
      <div className="bg-muted rounded-lg p-3 max-w-[80%] break-words">
        <div className="text-sm prose whitespace-pre-wrap">
          <MemoizedReactMarkdown>{message.content}</MemoizedReactMarkdown>
        </div>
      </div>
    </div>
  );
};
