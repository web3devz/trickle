import React, { useEffect, useState, useMemo } from 'react';
import { ArrowUpRight, ArrowDownLeft, ExternalLink, Clock, Wallet, CreditCard, ChevronDown, ChevronUp } from 'lucide-react';
import { formatAddress, formatDate, formatNumber, get1InchUrl } from "@/lib/utils";

interface TokenTransfersProps {
  data: {
    transfers: TokenTransfer;
    metadata: {
      account: string;
      protocol: string;
      network: string;
      timeRange: {
        from: string;
        to: string;
      };
    };
  };
}

interface Contract {
  address: string;
  deployedTransactionHash: string;
  deployedAt: string;
  deployerAddress: string;
  logoUrl: string;
  type: string;
  name: string;
  symbol: string;
  totalSupply: string;
  decimals: number;
}

interface TokenTransfer {
  items: {
    transactionHash: string;
    contract: Contract;
    from: string;
    to: string;
    value: string;
    timestamp: string;
    tokenSymbol: string;
    tokenDecimals: number;
  }[];
}

export function TokenTransfers({ data }: TokenTransfersProps) {
  const [expandedTransfer, setExpandedTransfer] = useState<string | null>(null);
  const [activeContract, setActiveContract] = useState<string | null>(null);
  const containerAnimation = "animate-in fade-in duration-300";

  // Group transactions by contract
  const contractTransfers = useMemo(() => {
    const grouped = data.transfers.items.reduce((acc, transfer) => {
      const contractAddr = transfer.contract.address;
      if (!acc[contractAddr]) {
        acc[contractAddr] = {
          contract: transfer.contract,
          transfers: []
        };
      }
      acc[contractAddr].transfers.push(transfer);
      return acc;
    }, {} as Record<string, { contract: Contract; transfers: typeof data.transfers.items }>);

    // Sort by number of transfers (descending)
    return Object.values(grouped).sort((a, b) => b.transfers.length - a.transfers.length);
  }, [data.transfers.items]);

  // Set first contract as active on initial load
  useEffect(() => {
    if (contractTransfers.length > 0 && !activeContract) {
      setActiveContract(contractTransfers[0].contract.address);
    }
  }, [contractTransfers, activeContract]);

  // Filter transfers by active contract
  const activeTransfers = useMemo(() => {
    if (!activeContract) return [];
    const group = contractTransfers.find(group => group.contract.address === activeContract);
    return group ? group.transfers : [];
  }, [contractTransfers, activeContract]);

  const toggleExpand = (transactionHash: string) => {
    setExpandedTransfer(prev => prev === transactionHash ? null : transactionHash);
  };

  return (
    <div className={`p-0 rounded-[30px] overflow-visible border-2 border-black bg-white transition-all hover:shadow-[0px_6px_0px_0px_rgba(0,0,0,1)] ${containerAnimation}`}>
      <div className="p-6 rounded-4xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-xl">Token Transfers</h3>
          <div className="text-sm bg-black/10 px-3 py-1 rounded-lg">
            Network: <span className="font-medium">{data.metadata.network}</span>
          </div>
        </div>

        {/* Contract Tabs */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-2 pb-2">
            {contractTransfers.map(({ contract, transfers }) => (
              <button
                key={contract.address}
                onClick={() => setActiveContract(contract.address)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${activeContract === contract.address
                  ? 'bg-[#CCFF00] font-medium'
                  : 'bg-black/5 hover:bg-black/10'
                  }`}
              >
                <img src={contract.logoUrl || `/api/placeholder/24/24`} alt={contract.name} className="w-6 h-6 rounded-full" />
                <span>{contract.symbol}</span>
                <span className="bg-black/10 text-xs px-2 py-1 rounded-full">
                  {transfers.length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Active Contract Info */}
        {activeContract && (
          <div className="mb-6">
            {contractTransfers
              .filter(group => group.contract.address === activeContract)
              .map(({ contract }) => (
                <div key={contract.address} className="flex items-center gap-4 p-4 bg-black/5 rounded-xl">
                  <img src={contract.logoUrl || `/api/placeholder/48/48`} alt={contract.name} className="w-12 h-12 rounded-full" />
                  <div className="flex-1">
                    <h4 className="font-bold text-lg">{contract.name}</h4>
                    <div className="flex items-center justify-between w-full gap-1 text-sm">
                      <div className='flex flex-row gap-1 items-center'>
                      <span className="opacity-75">{formatAddress(contract.address)}</span>
                      <ExternalLink
                        className="w-3 h-3 cursor-pointer opacity-50 hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`https://etherscan.io/address/${contract.address}`, '_blank');
                        }}
                      />
                      </div>
                      <a
                        href={get1InchUrl({ symbol: contract.symbol, contractAddress: '' })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-gradient-to-r from-[#0A0B1E] to-[#E8384C] text-white text-md rounded-lg font-medium hover:opacity-90 transition-all whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Swap on 1inch
                      </a>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Transfers Grid */}
        <div className="grid gap-4">
          {activeTransfers.map((transfer) => {
            const isSent = transfer.from.toLowerCase() === data.metadata.account.toLowerCase();
            const value = Number(transfer.value) / Math.pow(10, 18);
            const counterparty = isSent ? transfer.to : transfer.from;
            const isExpanded = expandedTransfer === transfer.transactionHash;

            return (
              <div
                key={transfer.transactionHash}
                className="relative overflow-hidden transition-all duration-300 ease-in-out"
              >
                {/* Main Transaction Card */}
                <div
                  className={`p-4 rounded-xl border transition-all cursor-pointer
                    ${isExpanded
                      ? 'border-[#CCFF00] bg-[#CCFF00]/20 rounded-b-none'
                      : 'border-black/10 bg-white hover:bg-[#CCFF00]/10 hover:border-[#CCFF00]/50'}`}
                  onClick={() => toggleExpand(transfer.transactionHash)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`flex items-center gap-2 ${isSent ? 'text-red-600' : 'text-[#789504]'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isSent ? 'bg-red-100' : 'bg-[#CCFF00]/30'}`}>
                        {isSent ?
                          <ArrowUpRight className="w-4 h-4" /> :
                          <ArrowDownLeft className="w-4 h-4" />
                        }
                      </div>
                      <span className="font-medium">
                        {isSent ? 'Sent' : 'Received'}
                      </span>
                    </div>
                    <div className="text-xs bg-black/5 px-2 py-1 rounded-lg">
                      {formatDate(transfer.timestamp)}
                    </div>
                  </div>

                  <div className={`font-bold text-lg mb-2 ${isSent ? 'text-red-600' : 'text-[#789504]'}`}>
                    {isSent ? '-' : '+'}{formatNumber(value)} {transfer.contract.symbol}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm">
                      <span className="opacity-75">{isSent ? 'To: ' : 'From: '}{formatAddress(counterparty)}</span>
                      <ExternalLink
                        className="w-3 h-3 cursor-pointer opacity-50 hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`https://etherscan.io/address/${counterparty}`, '_blank');
                        }}
                      />
                    </div>
                    {isExpanded ?
                      <ChevronUp className="w-4 h-4 opacity-50" /> :
                      <ChevronDown className="w-4 h-4 opacity-50" />
                    }
                  </div>
                </div>
                {/* Expandable Details Section */}
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out border-x border-b border-[#CCFF00] rounded-b-xl
                    ${isExpanded ? 'max-h-72 opacity-100' : 'max-h-0 opacity-0 border-opacity-0'}`}
                >
                  <div className="p-4 bg-white space-y-3">
                    <div className="flex items-center gap-2 border-t border-black/10 pt-3">
                      <CreditCard className="w-4 h-4 opacity-50" />
                      <div>
                        <p className="text-xs opacity-50">Amount</p>
                        <p className="font-bold">{formatNumber(value)} {transfer.contract.symbol}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 border-t border-black/10 pt-3">
                      <Wallet className="w-4 h-4 opacity-50" />
                      <div>
                        <p className="text-xs opacity-50">{isSent ? 'To' : 'From'}</p>
                        <p className="font-mono text-sm">{formatAddress(counterparty)}</p>
                        <button
                          className="text-xs text-blue-600 hover:underline mt-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`https://etherscan.io/address/${counterparty}`, '_blank');
                          }}
                        >
                          View on Etherscan
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 border-t border-black/10 pt-3">
                      <Clock className="w-4 h-4 opacity-50" />
                      <div>
                        <p className="text-xs opacity-50">Time</p>
                        <p>{formatDate(transfer.timestamp)}</p>
                      </div>
                    </div>

                    <button
                      className="w-full mt-2 p-2 bg-[#CCFF00] hover:bg-[#CCFF00]/80 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`https://etherscan.io/tx/${transfer.transactionHash}`, '_blank');
                      }}
                    >
                      View Transaction <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {activeTransfers.length === 0 && (
          <div className="text-center py-12 bg-black/5 rounded-xl">
            <p className="text-lg opacity-75">No transfers found for this token</p>
          </div>
        )}
      </div>
    </div>
  );
}