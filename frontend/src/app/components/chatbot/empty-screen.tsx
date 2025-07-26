import { Button } from "@/components/ui/button";
import { InfoIcon } from "lucide-react";

export default function EmptyScreen({
  openModal,
  onSendMessage,
}: {
  openModal: () => void;
  onSendMessage: (message: string) => void;
}) {
  return (
    <div className="flex flex-col space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">
        Trickle
      </h1>
      <div className="space-y-4">
        <div className="p-4 rounded-lg border bg-card">
          <h2 className="text-lg font-medium mb-2">Wallet Transactions</h2>
          <p className="text-sm text-muted-foreground mb-4">
            View and manage your wallet transactions through MultiBaas API integration.
          </p>
          <div className="flex flex-col gap-2">
            <Button
              variant="default"
              className="w-full justify-start"
              onClick={(e) => {
                e.preventDefault();
                onSendMessage("List transactions from my wallet");
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              List Wallet Transactions
            </Button>
            <Button
              className="w-full justify-start"
              onClick={(e) => {
                e.preventDefault();
                onSendMessage("I want to see blockchain insights from dune analytics");
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              I want to see whale wallets
            </Button>
            <Button
              type="button"
              className="w-full justify-start"
              onClick={openModal}
            >
              <InfoIcon className="mr-2"/>
              Gemini Nano Information
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};