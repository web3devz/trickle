import React, { useEffect, useState, useMemo } from 'react';
import { ArrowUpRight, ArrowDownLeft, ExternalLink } from 'lucide-react';

type Transaction = {
  hash: string;
  from: string;
  to: string;
  value: number;
  blockNumber: number;
  timestamp: string;
  status: string;
  failed: boolean;
};

type TransactionListProps = {
  data: {
    transactions: Transaction[];
    chain: string;
    walletAddress: string;
    total: number;
  };
  chain?: string;
};

const BLOCKCHAIN_EXPLORERS: { [key: string]: string } = {
  ethereum: 'etherscan.io',
  base: 'basescan.org',
};

export const TransactionList: React.FC<TransactionListProps> = ({ data, chain }) => {
  const [parsedData, setParsedData] = useState(() => {
    if (Array.isArray(data)) {
      return {
        transactions: data,
        walletAddress: data[0]?.from || '',
        total: data.length
      };
    }
    return typeof data === 'string' ? JSON.parse(data) : data;
  });

  // Control the number of visible rows for streaming effect
  const [visibleRows, setVisibleRows] = useState(0);

  useEffect(() => {
    const newData = Array.isArray(data) ? {
      transactions: data,
      walletAddress: data[0]?.from || 'ethereum',
      total: data.length
    } : typeof data === 'string' ? JSON.parse(data) : data;
    setParsedData(newData);
    
    // Reset visible rows when data changes
    setVisibleRows(0);
    
    // Gradually reveal rows to create streaming effect
    const transactions = newData.transactions || [];
    if (transactions.length > 0) {
      // Start with header visible
      const interval = setInterval(() => {
        setVisibleRows(prev => {
          if (prev >= transactions.length) {
            clearInterval(interval);
            return prev;
          }
          return prev + 1;
        });
      }, 150); // Adjust timing for desired speed
      
      return () => clearInterval(interval);
    }
  }, [data]);

  const { transactions = [], walletAddress = '', total = 0 } = parsedData || {};

  // Memoize helper functions
  const truncateAddress = useMemo(() => {
    return (address: string) => {
      if (!address) return 'Unknown';
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };
  }, []);

  const formatDate = useMemo(() => {
    return (timestamp: string) => {
      if (!timestamp) return 'Unknown';
      return new Date(timestamp).toLocaleString();
    };
  }, []);

  // Subtle fade-in for container
  const containerAnimation = "animate-in fade-in duration-300";
  
  if (!transactions || transactions.length === 0) {
    return (
      <div className={`p-4 rounded-[30px] border-2 border-black bg-white transition-all hover:shadow-[0px_6px_0px_0px_rgba(0,0,0,1)] ${containerAnimation}`}>
        <p className="text-black">No transactions found for this wallet address.</p>
      </div>
    );
  }

  return (
    <div className={`p-0 rounded-[30px] overflow-hidden border-2 border-black bg-white transition-all hover:shadow-[0px_6px_0px_0px_rgba(0,0,0,1)] ${containerAnimation}`}>
      <div className="bg-[#CCFF00] flex flex-row p-4 items-center justify-between">
      <h3 className="font-medium text-lg text-black">Transactions on {chain}</h3>
        <p className="text-sm text-black">
          Wallet: <span className="font-mono">{truncateAddress(walletAddress)}</span>
          <span className="ml-2 text-xs bg-black text-[#CCFF00] px-2 py-1 rounded-[30px]">{total} transactions</span>
        </p>
      </div>

      <div className="overflow-hidden bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="p-3 text-left text-xs font-medium text-black uppercase">Type</th>
              <th className="p-3 text-left text-xs font-medium text-black uppercase">Hash</th>
              <th className="p-3 text-left text-xs font-medium text-black uppercase">From/To</th>
              <th className="p-3 text-left text-xs font-medium text-black uppercase">Value</th>
              <th className="p-3 text-left text-xs font-medium text-black uppercase">Time</th>
              <th className="p-3 text-left text-xs font-medium text-black uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-black">
            {transactions.slice(0, visibleRows).map((tx: Transaction, index: number) => {
              const isSent = tx.from.toLowerCase() === walletAddress?.toLowerCase();
              
              // Subtle animation for newly appearing row
              const isNewRow = index === visibleRows - 1;
              const rowAnimation = isNewRow ? "animate-in fade-in duration-150" : "";

              return (
                <tr 
                  key={tx.hash} 
                  className={`hover:bg-[#CCFF00] transition-all hover:shadow-[0px_6px_0px_0px_rgba(0,0,0,1)] ${rowAnimation}`}
                >
                  <td className="p-3">
                    <span className={`flex items-center ${isSent ? 'text-black' : 'text-black'}`}>
                      {isSent ?
                        <><ArrowUpRight size={16} className="mr-1" /> Sent</> :
                        <><ArrowDownLeft size={16} className="mr-1" /> Received</>
                      }
                    </span>
                  </td>
                  <td className="p-3 font-mono text-sm">
                    <div className="flex items-center">
                      {truncateAddress(tx.hash)}
                      <a
                        href={`https://${BLOCKCHAIN_EXPLORERS[chain?.toLowerCase() ?? 'ethereum']}/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1 text-black hover:text-[#CCFF00]"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </td>
                  <td className="p-3 font-mono text-sm text-black">
                    {isSent ?
                      <span>To: {truncateAddress(tx.to)}</span> :
                      <span>From: {truncateAddress(tx.from)}</span>
                    }
                  </td>
                  <td className="p-3">
                    <span className={`font-medium ${isSent ? 'text-red-600' : 'text-[#789504]'}`}>
                      {isSent ? '-' : '+'}{tx.value.toFixed(4)} ETH
                    </span>
                  </td>
                  <td className="p-3 text-sm text-black">
                    {formatDate(tx.timestamp.toString())}
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-[30px] text-xs font-medium border-2 border-black ${tx.failed ? 'bg-white text-black' : 'bg-[#CCFF00] text-black'}`}>
                      {tx.failed ? 'Failed' : 'Success'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};