"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "../ui/button";
import { LogOut, LogIn } from "lucide-react";

export const SignIn = () => {
  const { data: session } = useSession();

  if (session) {
    return (
      <div className="flex items-center gap-4 bg-white/50 backdrop-blur-sm rounded-full px-4 py-2 border-2 border-black">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-[#CCFF00] flex items-center justify-center border-2 border-black">
            <span className="font-medium text-sm">
              {session.user?.name?.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <span className="text-sm font-medium">
            {session.user?.name?.slice(0, 10)}
          </span>
        </div>
        <Button 
          variant="reverse" 
          size="sm"
          className="hover:bg-red-100 bg-transparent text-red-600 hover:text-red-700 rounded-full" 
          onClick={() => signOut()}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button 
      className="rounded-full bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90 border-2 border-black flex items-center gap-2" 
      onClick={() => signIn("worldcoin")}
    >
      <LogIn className="h-4 w-4" />
      <span className="hidden md:flex">Sign in with Worldcoin</span>
    </Button>
  );
};