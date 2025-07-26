"use client";

import { formatDistanceToNow } from "date-fns";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  Check,
  CircleArrowOutUpLeft,
  FoldHorizontal,
  RefreshCcw,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface Transaction {
  id: string;
  type: "Send" | "Receive" | "Transfer";
  chainId: number;
  asset: string;
  amount: string;
  value: string;
  address: string;
  timestamp: Date;
  status: "completed" | "fail" | "pending";
  hash: string;
}

export interface TokenAction {
  chainId: string;
  address: string;
  standard: string;
}

export interface TransactionDetails {
  txHash: string;
  chainId: number;
  blockNumber: number;
  blockTimeSec: number;
  feeInSmallestNative: string;
  fromAddress: string;
  toAddress: string;
  nativeTokenPriceToUsd: number | null;
  nonce: number;
  orderInBlock: number;
  status: string;
  tokenActions?: TokenAction[];
  type: string;
}

export interface TransactionItem {
  address: string;
  direction: "in" | "out";
  eventOrderInTransaction: number;
  id: string;
  rating: string;
  timeMs: number;
  type: number | string; // could be "Receive" or numeric depending on source
  details?: TransactionDetails;
  tokenInfo?: TokenInfo;
}

export interface TokenInfo {
  address: string;
  chainId: number;
  decimals: number;
  eip2612: boolean;
  name: string;
  symbol: string;
  rating: number;
  providers: string[]; // assuming it's an array of strings
  tags: string[]; // assuming it's an array of strings
}

const chainIdToName: Record<number, string> = {
  1: "Ethereum",
  10: "Optimism",
  45: "PlatON",
  56: "BNB Smart Chain",
  100: "Gnosis",
  137: "Polygon",
  250: "Fantom",
  324: "zkSync Era",
  42161: "Arbitrum",
  43114: "Avalanche",
  8217: "Klaytn",
  8453: "Base",
  1313161554: "Aurora",
};

/**
 * Converts a base-unit amount (e.g. wei) to a human-readable decimal value.
 * @param amount - The raw amount as a string (e.g. "1000000000000000000")
 * @param decimals - Number of decimal places the token uses (e.g. 18 for ETH)
 * @returns A string representing the human-readable amount (e.g. "1.0")
 */
export function fromBaseUnits(
  amount: string | bigint,
  decimals: number
): string {
  if (!amount || isNaN(Number(amount))) return "-";
  if (!decimals || isNaN(Number(decimals))) return "-";

  const amountBig = BigInt(amount);
  const base = BigInt(10) ** BigInt(decimals);

  const whole = amountBig / base;
  const fraction = amountBig % base;

  // Pad the fractional part with leading zeros up to `decimals` length
  let fractionStr = fraction.toString().padStart(decimals, "0");

  // Optional: trim trailing zeros from fraction
  fractionStr = fractionStr.replace(/0+$/, "");

  return fractionStr.length > 0
    ? `${whole.toString()}.${fractionStr}`
    : whole.toString();
}

const shortenAddress = (address: string) => {
  return `${address.substring(0, 6)}...${address.substring(
    address.length - 4
  )}`;
};

interface TransactionHistoryProps {
  type?: string;
  address: string;
  chain_id: string;
  setTransactionTypes: Dispatch<SetStateAction<string[]>>;
}

export function TransactionHistory({
  type,
  address,
  chain_id,
  setTransactionTypes,
}: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<
    Transaction[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [availableChains, setAvailableChains] = useState<number[]>([]);
  const [selectedChainId, setSelectedChainId] = useState<number | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);

        const params = new URLSearchParams();
        params.append("chainId", chain_id);
        params.append("address", address);

        const transactionRes = await fetch(
          `/api/1inch/history?${params.toString()}`
        );
        const transactionData = await transactionRes.json();

        const uniqueTypes: string[] = Array.from(
          new Set(
            transactionData.items
              .map((trx: any) => trx.details?.type)
              .filter((type): type is string => Boolean(type))
          ) as Set<string> // 👈 Assert Set<string>
        ).sort((a, b) => a.localeCompare(b));

        setTransactionTypes(uniqueTypes);

        const tokenParams = new URLSearchParams();
        tokenParams.append("chain_id", chain_id);
        transactionData.items?.forEach((tx: TransactionItem) => {
          const tokenActions = tx?.details?.tokenActions;
          const tokenAddress = tokenActions?.[tokenActions.length - 1]?.address;
          if (tokenAddress) {
            tokenParams.append("addresses", tokenAddress);
          }
        });

        const tokenRes = await fetch(
          `/api/1inch/token?${tokenParams.toString()}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        const tokenData = await tokenRes.json();

        const tokenTransactionData = transactionData.items.map(
          (trx: TransactionItem) => {
            const tokenActions = trx?.details?.tokenActions;

            return {
              ...trx,
              tokenInfo: {
                ...tokenData?.[
                  trx?.details?.tokenActions?.[tokenActions.length - 1]?.address
                ],
              },
            };
          }
        );

        // You may need to format the data depending on the API response
        const parsed: Transaction[] = tokenTransactionData?.map(
          (item: TransactionItem, index: number) => ({
            id: item.id || `${index}`,
            type: item.details.type || "Send", // You may need to map API event types to 'Send' | 'Receive' | 'Transfer'
            chainId: item.details.chainId || 1,
            asset: item.tokenInfo.symbol || "-",
            amount: item.details.feeInSmallestNative,

            value:
              fromBaseUnits(
                item.details.feeInSmallestNative,
                item.tokenInfo.decimals
              ) || "-",
            address: item.details.fromAddress || "-",
            timestamp: item.details.blockTimeSec ? new Date(item.timeMs) : "-",
            status: item.details.status || "confirmed",
            hash: item.details.txHash || "-",
          })
        );
        setTransactions(parsed || []);
        const uniqueChains: number[] = [
          ...new Set(parsed.map((t: Transaction) => t.chainId)),
        ];
        setAvailableChains(uniqueChains);
        setSelectedChainId((prev) => prev ?? uniqueChains[0]); // only set once
      } catch (err) {
        console.error("Error fetching transactions:", err);
      } finally {
        setLoading(false);
      }
    };

    if (address) {
      fetchTransactions();
    }
  }, [address, chain_id]);

  useEffect(() => {
    setFilteredTransactions(
      transactions.filter((tx) => {
        const typeMatch =
          !type ||
          type.toLowerCase() === "all" ||
          tx.type.toLowerCase() === type.toLowerCase();
        const chainMatch = tx.chainId === selectedChainId;
        return typeMatch && chainMatch;
      })
    );
  }, [type, transactions, selectedChainId]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Send":
        return <ArrowUpIcon className="h-4 w-4 text-red-500" />;
      case "Receive":
        return <ArrowDownIcon className="h-4 w-4 text-blue-500" />;
      case "Transfer":
      case "SwapExactInput":
        return <RefreshCcw className="h-4 w-4 text-yellow-500" />;
      case "Approve":
        return <Check className="h-4 w-4 text-emerald-500" />;
      case "Wrap":
        return <FoldHorizontal className="h-4 w-4 text-purple-500" />;
      case "Unstake":
      case "RemoveLiquidity":
        return <CircleArrowOutUpLeft className="h-4 w-4 text-orange-500" />;
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "Send":
        return (
          <Badge
            variant="outline"
            className="text-red-500 border-red-200 bg-red-50"
          >
            {type}
          </Badge>
        );
      case "Receive":
        return (
          <Badge
            variant="outline"
            className="text-blue-500 border-blue-200 bg-blue-50"
          >
            {type}
          </Badge>
        );
      case "Transfer":
      case "SwapExactInput":
        return (
          <Badge
            variant="outline"
            className="text-yellow-500 border-yellow-200 bg-yellow-50"
          >
            {type}
          </Badge>
        );
      case "Approve":
        return (
          <Badge
            variant="outline"
            className="text-emerald-500 border-emerald-200 bg-emerald-50"
          >
            {type}
          </Badge>
        );
      case "Wrap":
        return (
          <Badge
            variant="outline"
            className="text-purple-500 border-purple-200 bg-purple-50"
          >
            {type}
          </Badge>
        );
      case "Unstake":
      case "RemoveLiquidity":
        return (
          <Badge
            variant="outline"
            className="text-orange-500 border-orange-200 bg-orange-50"
          >
            {type}
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="text-grey-500 border-grey-200 bg-grey-50"
          >
            {type}
          </Badge>
        );
    }
  };

  return (
    <div className="rounded-md border">
      {availableChains.length > 1 && (
        <div className="m-4 flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            Chain:
          </span>
          <Select
            onValueChange={(val) => setSelectedChainId(parseInt(val))}
            defaultValue={selectedChainId?.toString()}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Chain" />
            </SelectTrigger>
            <SelectContent>
              {availableChains.map((chainId) => (
                <SelectItem key={chainId} value={chainId.toString()}>
                  {chainIdToName[chainId] || `Chain ${chainId}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="rounded-md border">
        {availableChains.length > 1 && (
          <div className="m-4 flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              Chain:
            </span>
            <Select
              onValueChange={(val) => setSelectedChainId(parseInt(val))}
              defaultValue={selectedChainId?.toString()}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Chain" />
              </SelectTrigger>
              <SelectContent>
                {availableChains.map((chainId) => (
                  <SelectItem key={chainId} value={chainId.toString()}>
                    {chainIdToName[chainId] || `Chain ${chainId}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="relative">
          <div className="sticky top-0 bg-white z-10">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Chain</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead className="hidden md:table-cell">
                    From/To
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">Time</TableHead>
                  <TableHead className="hidden lg:table-cell">Status</TableHead>
                </TableRow>
              </TableHeader>
            </Table>
          </div>
          <div className="max-h-96 relative overflow-y-auto">
            <Table>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(tx.type)}
                          <span className="hidden sm:inline-block">
                            {getTypeBadge(tx.type)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {/* <Avatar className="h-6 w-6">
                          <img
                            src={`/placeholder.svg?height=24&width=24&text=${
                              tx.asset.split(" ")[0]
                            }`}
                            alt={tx.asset}
                          />
                        </Avatar> */}
                          <span>{chainIdToName[tx.chainId]}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{tx.asset}</span>
                        </div>
                      </TableCell>
                      <TableCell>{tx.amount}</TableCell>
                      <TableCell>{tx.value}</TableCell>
                      <TableCell className="hidden md:table-cell font-mono text-xs">
                        {shortenAddress(tx.address)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {formatDistanceToNow(new Date(tx.timestamp), {
                          addSuffix: true,
                        })}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge
                          variant={
                            tx.status === "completed"
                              ? "default"
                              : tx.status === "fail"
                              ? "destructive"
                              : "outline"
                          }
                        >
                          {tx.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
