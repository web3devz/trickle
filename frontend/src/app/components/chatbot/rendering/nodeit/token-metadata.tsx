import { get1InchUrl } from '@/lib/utils';
import React from 'react';

interface TokenMetadataProps {
  data: {
    metadata: Array<{
      name: string;
      symbol: string;
      decimals: number;
      totalSupply: string;
      contractAddress: string;
    }>;
    protocol: string;
    network: string;
    contracts: string[];
  };
  chain: string;
}

export function TokenMetadata({ data, chain }: TokenMetadataProps) {
  return (
    <div className="p-6 rounded-[30px] border-2 border-black bg-white transition-all hover:shadow-[0px_6px_0px_0px_rgba(0,0,0,1)]">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xl">Token Metadata</h3>
          <div className="flex gap-2">
            <div className="text-sm bg-black/10 px-3 py-1 rounded-lg">
              Chain: <span className="font-medium">{chain}</span>
            </div>
            <div className="text-sm bg-black/10 px-3 py-1 rounded-lg">
              Network: <span className="font-medium">{data.network}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {data.metadata.map((token, index) => (
          <div key={`${token.contractAddress}-${index}`} className="p-4 bg-black/5 rounded-xl">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-bold">{token.name}</h4>
                <p className="text-sm opacity-60">{token.symbol}</p>
              </div>
              <div className="text-sm bg-black/10 px-2 py-1 rounded-lg">
                Decimals: {token.decimals}
              </div>
            </div>
            <div className="mt-2">
              <p className="text-sm opacity-60">Contract Address:</p>
              <p className="text-sm font-mono break-all">{token.contractAddress}</p>
            </div>
            <div className="mt-2">
              <p className="text-sm opacity-60">Total Supply:</p>
              <p className="text-lg font-bold">
                {Number(token.totalSupply).toLocaleString()}
              </p>
            </div>
            <div className="mt-4 w-full items-end justify-self-end">
              <a
                href={get1InchUrl(token)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gradient-to-r from-[#0A0B1E] to-[#E8384C] text-white text-md rounded-lg font-medium hover:opacity-90 transition-all whitespace-nowrap"
              >
                Swap on 1inch
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}