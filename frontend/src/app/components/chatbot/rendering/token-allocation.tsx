"use client"

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface Token {
  token: string;
  tokenAddress: string;
  proportion: number;
}

interface TokenAllocationProps {
  data: {
    type: "allocation";
    message?: string;
    portfolio: Token[];
  };
  onSendMessage?: (message: string) => void;
}

function formatAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function TokenAllocation({ data, onSendMessage }: TokenAllocationProps) {
  const { portfolio: initialPortfolio, message } = data;
  const [portfolio, setPortfolio] = useState(initialPortfolio);
  const [isEditing, setIsEditing] = useState(false);

  const handleProportionChange = (tokenAddress: string, newPercent: number) => {
    const newProportion = newPercent / 100;
    const oldToken = portfolio.find(t => t.tokenAddress === tokenAddress);
    const diff = newProportion - (oldToken?.proportion || 0);
    
    // Adjust other tokens proportionally to maintain total of 1.0
    const otherTokens = portfolio.filter(t => t.tokenAddress !== tokenAddress);
    const otherTotal = otherTokens.reduce((sum, t) => sum + t.proportion, 0);
    
    setPortfolio(prev => 
      prev.map(token => {
        if (token.tokenAddress === tokenAddress) {
          return { ...token, proportion: newProportion };
        } else {
          // Adjust other tokens proportionally
          const adjustmentFactor = (otherTotal - diff) / otherTotal;
          return { ...token, proportion: token.proportion * adjustmentFactor };
        }
      })
    );
  };

  const handleUpdateClick = () => {
    const total = portfolio.reduce((sum, token) => sum + token.proportion, 0);
    if (Math.abs(total - 1.0) > 0.0001) {
      alert("Total allocation must equal 100%");
      return;
    }

    const message = `Please update my portfolio allocation to:\n${portfolio
      .map(token => `${token.token}: ${(token.proportion * 100).toFixed(1)}%`)
      .join('\n')}`;

    onSendMessage?.(message);
    setIsEditing(false);
  };

  if (!portfolio.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Token Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No tokens found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">Token Allocation</CardTitle>
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
        </div>
        <Button
          variant="default"
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? "Cancel" : "Edit"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {portfolio.map(({ token, tokenAddress, proportion }) => {
          const percent = Math.max(0, Math.min(100, proportion * 100));
          return (
            <div key={tokenAddress} className="space-y-2">
              <div className="flex justify-between text-sm items-center">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{token}</span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {formatAddress(tokenAddress)}
                  </span>
                </div>
                <span className="text-muted-foreground w-16 text-right">
                  {percent.toFixed(1)}%
                </span>
              </div>
              {isEditing ? (
                <Slider
                  value={[percent]}
                  onValueChange={([value]) => handleProportionChange(tokenAddress, value)}
                  min={0}
                  max={100}
                  step={0.1}
                  className="py-2"
                />
              ) : (
                <Progress value={percent} className="h-2" aria-label={`${token} ${percent.toFixed(1)}%`} />
              )}
            </div>
          );
        })}
        {isEditing && (
          <Button 
            className="w-full mt-4" 
            onClick={handleUpdateClick}
          >
            Update Allocation
          </Button>
        )}
      </CardContent>
    </Card>
  );
}