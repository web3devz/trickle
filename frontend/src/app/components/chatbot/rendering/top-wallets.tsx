import React from 'react';

type DuneWallet = {
  address: string;
  balance: number;
  rank: number;
  detailLink?: string;
  etherscanLink: string;
};

type DuneAnalyticsProps = {
  data: DuneWallet[];
};



export function DuneAnalytics({ data }: DuneAnalyticsProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`p-4 rounded-[30px] border-2 border-black bg-white transition-all hover:shadow-[0px_6px_0px_0px_rgba(0,0,0,1)]`}>
        <p className="text-black">No Dune Analytics data available</p>
      </div>
    );
  }

  // Format balance with appropriate number of decimal places
  const formatBalance = (balance: number) => {
    if (balance >= 1000000) {
      return `${(balance / 1000000).toFixed(2)}M`;
    } else if (balance >= 1000) {
      return `${(balance / 1000).toFixed(2)}K`;
    } else {
      return balance.toFixed(2);
    }
  };

  // Truncate wallet address for display
  const truncateAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className={`p-0 rounded-[30px] overflow-hidden border-2 border-black bg-white transition-all hover:shadow-[0px_6px_0px_0px_rgba(0,0,0,1)]`}>
      <div className="bg-[#CCFF00] flex flex-row p-4 items-center justify-between">
        <h3 className="font-medium text-lg text-black">Top Ethereum Wallets</h3>
          <span className="ml-2 text-xs bg-black text-[#CCFF00] px-2 py-1 rounded-[30px]">{data.length} wallets</span>
      </div>

      <div className="overflow-hidden bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="p-3 text-left text-xs font-medium text-black uppercase">Rank</th>
              <th className="p-3 text-left text-xs font-medium text-black uppercase">Wallet Address</th>
              <th className="p-3 text-right text-xs font-medium text-black uppercase">ETH Balance</th>
              <th className="p-3 text-center text-xs font-medium text-black uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-black">
            {data.map((wallet, index) => (
              <tr
                key={wallet.address}
                className="hover:bg-[#CCFF00] transition-all hover:shadow-[0px_6px_0px_0px_rgba(0,0,0,1)]"
              >
                <td className="p-3 text-black">{wallet.rank}</td>
                <td className="p-3 text-left font-mono text-sm text-black">
                  {truncateAddress(wallet.address)}
                </td>
                <td className="p-3 text-right text-black">
                  <span className="font-medium">{formatBalance(wallet.balance)} ETH</span>
                </td>
                <td className="p-3 text-center">
                  <div className="flex justify-center space-x-2">
                    <a
                      href={wallet.etherscanLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-2 py-1 rounded-[30px] border-2 border-black bg-[#CCFF00] text-black hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                      Etherscan
                    </a>
                    {wallet.detailLink && (
                      <a
                        href={wallet.detailLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs px-2 py-1 rounded-[30px] border-2 border-black bg-white text-black hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                      >
                        Details
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="bg-[#CCFF00] p-2 text-center text-xs text-black border-t-2 border-black">
        <p>Data sourced from Dune Analytics</p>
      </div>
    </div>
  );
}

export default DuneAnalytics;