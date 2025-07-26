"use client";

import { CheckCircle2Icon, ChevronDown, CopyIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AssetAllocationCard } from "@/components/dashboard/assetAllocation/asset-allocation-card";
import { PortfolioCard } from "@/components/dashboard/portfolio/portfolio-card";
import { TransactionHistory } from "@/components/dashboard/transaction-history";
import { createClient } from "@/lib/supabase";

export default function Dashboard() {
  const [copied, setCopied] = useState(false);
  const [transactionType, setTransactionType] = useState<
    "All" | "Send" | "Receive" | "Transfer" | undefined
  >(undefined);
  const [portfolioTimeRange, setPortfolioTimeRange] = useState<string>("1day");
  //   const dummyWalletAddress = "0x7bfee91193d9df2ac0bfe90191d40f23c773c060";
  const [walletAddress, setWalletAddress] = useState("");
  const [selectedChain, setSelectedChain] = useState<string>("Base");
  const [loading, setLoading] = useState(false);
  const supaBase = createClient();
  const [transactionTypes, setTransactionTypes] = useState<string[]>([]);

  const chains = [
    { name: "Base", id: "8453" },
    { name: "Celo", id: "42220" },
  ];
  const copyToClipboard = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shortenAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  };

  useEffect(() => {
    const getCurrentWallet = async () => {
      setLoading(true);
      const { data, error } = await supaBase.from("users").select("*").single();
      if (error) {
        console.error(error);
      } else {
        setWalletAddress(data?.walletAddress);
        console.log("Address: ", data?.walletAddress);
      }
      setLoading(false);
    };

    getCurrentWallet();
  }, []);

  return loading || !walletAddress ? (
    <div className="flex min-h-screen w-full items-center justify-center">
      <p className="text-muted-foreground text-sm">Loading wallet...</p>
    </div>
  ) : (
    <div className="flex min-h-screen w-full justify-center">
      <div className="w-full max-w-md lg:max-w-7xl px-0 md:px-4 mb-24 md:mb-0">
        <main className="grid max-w-md lg:max-w-7xl flex-1 items-start gap-4 p-0 md:grid-cols-2 lg:grid-cols-3 md:gap-6 md:p-6">
          <h1 className="text-2xl font-bold tracking-tight text-black col-span-full mb-4 inline-flex items-center">
            <span className="bg-gradient-to-r from-[#CCFF00]/90 to-transparent bg-[length:100%_40%] bg-no-repeat bg-bottom">
              Dashboard
            </span>
          </h1>
          <div className="col-span-full max-w-md lg:max-w-7xl">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-base font-medium">
                    Wallet Address
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <CardDescription className="text-xs sm:text-sm font-mono">
                      {walletAddress}
                    </CardDescription>
                    <Button
                      variant="default"
                      size="icon"
                      className="h-6 w-6"
                      onClick={copyToClipboard}
                    >
                      {copied ? (
                        <CheckCircle2Icon className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <CopyIcon className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="col-span-full">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="neutral"
                        className="w-full justify-between rounded-xl font-medium"
                      >
                        {selectedChain}
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="" align="start">
                      {chains.map((chain) => (
                        <DropdownMenuItem
                          key={chain.id}
                          onClick={() => setSelectedChain(chain.name)}
                        >
                          {chain.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
            </Card>
          </div>
          <PortfolioCard
            address={walletAddress}
            timerange={portfolioTimeRange}
            setTimerange={setPortfolioTimeRange}
            chain_id={chains.find((c) => c.name == selectedChain).id}
          />
          <AssetAllocationCard
            address={walletAddress}
            chain_id={chains.find((c) => c.name == selectedChain).id}
          />

          <Card className="col-span-full max-w-md lg:max-w-7xl">
            <CardHeader className="flex flex-row items-center">
              <div className="grid gap-2">
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>
                  Recent activity on your wallet
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs
                defaultValue="All"
                onValueChange={(value) =>
                  setTransactionType(
                    value as "All" | "Send" | "Receive" | "Transfer"
                  )
                }
              >
                <TabsList className="mb-4 outline-none border-none w-full overflow-x-auto items-start justify-start flex whitespace-nowrap">
                  <TabsTrigger value="All">All</TabsTrigger>
                  {transactionTypes &&
                    transactionTypes.map((txType, index) => (
                      <TabsTrigger value={txType} key={index}>
                        {txType}
                      </TabsTrigger>
                    ))}
                  {/* <TabsTrigger value="Send">Sent</TabsTrigger>
                  <TabsTrigger value="Receive">Received</TabsTrigger>
                  <TabsTrigger value="Transfer">Transfers</TabsTrigger>
                  <TabsTrigger value="Approve">Approve</TabsTrigger>
                  <TabsTrigger value="SwapExactInput">
                    SwapExactInput
                  </TabsTrigger> */}
                </TabsList>

                {/* All tabs show the same content, just filtered by state */}
                {transactionTypes &&
                  transactionTypes.map((txType, index) => (
                    <TabsContent value={txType} key={index}>
                      {txType}
                    </TabsContent>
                  ))}
                {/* <TabsContent value="All" />
                <TabsContent value="Send" />
                <TabsContent value="Receive" />
                <TabsContent value="Transfer" />
                <TabsContent value="Approve" />
                <TabsContent value="SwapExactInput" /> */}
              </Tabs>

              {/* Pass state-based `type` into TransactionHistory */}
              <TransactionHistory
                address={walletAddress}
                type={transactionType}
                setTransactionTypes={setTransactionTypes}
                chain_id={chains.find((c) => c.name == selectedChain).id}
              />
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
