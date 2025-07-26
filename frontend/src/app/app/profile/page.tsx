"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";
import Image from "next/image";

interface User {
  name: string;
  email: string;
  walletAddress: string;
  displayPicture?: string;
}
interface Portfolio {
  token: string;
  proportion: GLfloat;
  tokenAddress: string;
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supaBase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio[]>([]); // Change to array type
  const [trklBalance, setTrklBalance] = useState<string | null>(null);
  const [trklHistory, setTrklHistory] = useState<
    {
      txHash: string;
      amount: string;
      direction: "in" | "out";
      timestamp: number;
    }[]
  >([]);
  const [hasNFT, setHasNFT] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getUser = async () => {
    const { data, error } = await supaBase.from("users").select("*").single();
    if (error) {
      console.error(error);
      setError(error.message);
    } else {
      setUser(data);
    }
    setLoading(false);
  };

  const getPortfolio = async () => {
    const { data, error } = await supaBase.from("portfolio").select("*");
    if (error) {
      console.error(error);
      setError(error.message);
    } else {
      setPortfolio(data); // Set the entire array
    }
    setLoading(false);
  };

  const getTRKLBalance = async (walletAddress: string) => {
    try {
      const res = await fetch(`/api/trkl/balance?address=${walletAddress}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      setTrklBalance(data.balance || "0");
    } catch (err) {
      console.error("Failed to fetch TRKL balance", err);
      setTrklBalance("0");
    }
  };

  const getTRKLHistory = async (walletAddress: string) => {
    try {
      const res = await fetch(`/api/trkl/history?address=${walletAddress}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      setTrklHistory(data.history || []);
    } catch (err) {
      console.error("Failed to fetch TRKL history", err);
    }
  };

  const hasTRKLNFT = async (walletAddress: string) => {
    try {
      const res = await fetch(`/api/trkl/get-nft?address=${walletAddress}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (data.ownsNFT) {
        setHasNFT(true);
      }
    } catch (err) {
      console.error("Failed to fetch TRKL balance", err);
      setTrklBalance("0");
    }
  };

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      await getUser();
      await getPortfolio();
      setLoading(false);
    }
    fetchData();
  }, []);

  useEffect(() => {
    async function fetchTRKL() {
      if (!user?.walletAddress) return;

      setIsLoading(true);
      await getTRKLBalance(user.walletAddress);
      await getTRKLHistory(user.walletAddress);
      await hasTRKLNFT(user.walletAddress)
      setIsLoading(false);
    }
    fetchTRKL();
  }, [user]);

  return (
    <div className="container mx-auto p-4 max-w-xl">
      <h1 className="text-2xl font-bold tracking-tight text-black col-span-full mb-4 inline-flex items-center">
        <span className="bg-gradient-to-r from-[#CCFF00]/90 to-transparent bg-[length:100%_40%] bg-no-repeat bg-bottom">
          Profile
        </span>
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <div className="flex justify-center my-6">
            <Avatar className="h-50 w-50">
              <AvatarImage
                src={user?.displayPicture || ""}
                alt={user?.name || ""}
              />
              <AvatarFallback className="text-2xl">
                {user?.name?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading profile data...</p>
          ) : error ? (
            <p className="text-red-500">Error: {error}</p>
          ) : user ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="font-semibold">Name:</div>
                <div className="col-span-2">{user.name}</div>

                <div className="font-semibold">Email:</div>
                <div className="col-span-2">{user.email}</div>

                <div className="font-semibold">Address:</div>
                <div className="col-span-2 break-all">{user.walletAddress}</div>
              </div>
            </div>
          ) : (
            <p>No user data found.</p>
          )}
        </CardContent>
      </Card>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>TRKL Loyalty Tokens</CardTitle>
          {hasNFT ? <Image src="/nft-real.jpg" alt="nftbadge" width={100} height={100}/> : <></>}
          {hasNFT ? <div>TRKL Multiplier: x1.5</div> : <></>}
          <CardDescription>Your current balance of TRKL</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* Skeleton for Balance */}
              <Skeleton className="h-10 w-32 rounded-md" />

              {/* Skeleton for Transaction List */}
              <div className="w-full md:w-3/5 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                {[...Array(4)].map((_, idx) => (
                  <div key={idx} className="grid grid-cols-3 gap-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-start md:items-center md:justify-around gap-4 items-center">
              {/* Balance Display */}
              <div className="flex flex-col items-end">
                <div className="bg-[#dcf797] text-black text-4xl font-bold px-6 py-4 rounded-lg shadow-sm border border-black text-center min-w-[150px]">
                  {trklBalance ?? "0.0"}
                </div>
                <span className="text-sm font-semibold text-muted-foreground mt-1 pr-1">
                  TRKL
                </span>
              </div>

              {/* Activity List */}
              <div className="w-full md:w-3/5">
                <p className="mb-2 text-sm font-medium text-muted-foreground">
                  Recent TRKL Transactions
                </p>
                {trklHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No TRKL transactions found.
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {trklHistory.slice(0, 4).map((tx, idx) => (
                      <li
                        key={idx}
                        className="grid grid-cols-3 text-sm items-center gap-4"
                      >
                        <span
                          className={`font-md font-bold ${
                            tx.direction === "in"
                              ? "text-primary"
                              : "text-destructive"
                          }`}
                        >
                          {tx.direction === "in" ? "Received" : "Sent"}
                        </span>
                        <span className="font-mono">{tx.amount} TRKL</span>
                        <span className="text-muted-foreground text-xs">
                          {formatDistanceToNow(new Date(tx.timestamp * 1000), {
                            addSuffix: true,
                          })}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Portfolio Settings</CardTitle>
          <CardDescription>Your Portfolio information</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading Portfolio data...</p>
          ) : error ? (
            <p className="text-red-500">Error: {error}</p>
          ) : portfolio.length > 0 ? (
            <div className="space-y-6">
              {portfolio.map((item, index) => (
                <div key={index} className="space-y-4">
                  <div className="grid grid-cols-3">
                    <div className="font-semibold">Token:</div>
                    <div className="col-span-2">{item.token}</div>

                    <div className="font-semibold">Proportion:</div>
                    <div className="col-span-2 font-bold">
                      {item.proportion}
                    </div>

                    <div className="font-semibold">Token Address:</div>
                    <div className="col-span-2 break-all">
                      {item.tokenAddress}
                    </div>
                  </div>
                  {index < portfolio.length - 1 && <hr className="my-4" />}
                </div>
              ))}
            </div>
          ) : (
            <p>No portfolio data found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
