"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

interface UserData {
  id: number;
  walletAddress: string;
  name: string;
  displayPicture: string;
  email: string;
}

interface ProfileDataProps {
    data: UserData;
}

export default function ProfileData({ data }: ProfileDataProps) {
  console.log(data)
  if (!data) {
    return (
      <div className="p-4 rounded-[30px] border-2 border-black bg-white transition-all hover:shadow-[0px_6px_0px_0px_rgba(0,0,0,1)] animate-in fade-in duration-300">
        <p className="text-black">No profile data available.</p>
      </div>
    );
  }

  const user = data;

  return (
    <div className="p-0 rounded-[30px] overflow-hidden border-2 border-black bg-white transition-all hover:shadow-[0px_6px_0px_0px_rgba(0,0,0,1)] animate-in fade-in duration-300">
      <div className="bg-[#CCFF00] flex flex-row p-4 items-center justify-between">
        <h3 className="font-medium text-lg text-black">User Profile</h3>
        <p className="text-sm text-black">
          ID: <span className="font-mono">#{user.id}</span>
        </p>
      </div>

      <div className="p-6 space-y-6 bg-white">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-black">
            <AvatarImage src={user.displayPicture} />
            <AvatarFallback className="bg-[#CCFF00] text-black">
              {user.name?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-xl font-medium text-black">{user.name}</h3>
            <p className="text-sm text-black/70">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="px-3 py-1 bg-[#CCFF00] text-black border-2 border-black hover:bg-[#CCFF00]/90">
            <span className="font-mono">{user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}</span>
          </Badge>
          <a
            href={`https://etherscan.io/address/${user.walletAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-black hover:text-[#CCFF00]"
          >
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}