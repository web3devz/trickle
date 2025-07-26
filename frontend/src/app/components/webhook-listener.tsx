"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase";

// Track processed notifications to prevent duplicates
const processedNotifications = new Set();
const supabase = createClient();

export function WebhookListener() {
  // Use a ref to track if we've already subscribed
  const hasSubscribed = useRef(false);

  useEffect(() => {
    const channel = supabase
      .channel("nodit-stream")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "nodit-stream",
        },
        (payload) => {
          console.log("Nodit-stream notification received:", payload);
          const notification = payload.new;
          const name = notification["name"];
          const amount = notification["amount"];
          const tokenName = notification["token_name"];

          let title = "";

          if (name === "investment-detected") {
            title = `Transaction logged`;
            toast.success(title, {
              description: (
                <div className="text-black">
                  A new transaction of $${(amount / 100).toFixed(2)} has been
                  logged via Trickle&apos;s Chrome Extension.
                </div>
              ),
              duration: 120000,
              icon: "🔔",
              style: { color: "#000", borderColor: "#68d391" },
            });
          } else if (name === "swap-detected") {
            title = `Swap performed`;
            toast.success(title, {
              description: (
                <div className="text-black">
                  ${(amount / 100).toFixed(2)} has been invested into{" "}
                  {tokenName}. Cheers!
                </div>
              ),
              duration: 120000,
              icon: "🔄",
              style: { color: "#000", borderColor: "#68d391" },
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log("Cleaning up nodit-stream channel");
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    // Prevent duplicate subscriptions
    if (hasSubscribed.current) {
      console.log("Already subscribed, skipping...");
      return;
    }

    hasSubscribed.current = true;

    console.log("WebhookListener initialized, setting up channel...");

    // Subscribe to new notifications
    const channel = supabase
      .channel("db-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          console.log("Notification received:", payload);

          const notification = payload.new;

          // Check if we've already processed this notification
          const notificationId = notification.id;
          if (processedNotifications.has(notificationId)) {
            console.log(
              `Already processed notification ${notificationId}, skipping...`
            );
            return;
          }

          // Mark as processed to prevent duplicates
          processedNotifications.add(notificationId);

          // Extract transaction details
          const data = notification.data;
          const txHash = data?.txHash || data?.hash;
          const eventType = data?.eventType || "Transaction";
          const from = data?.from || "Unknown";
          const to = data?.to || "Unknown";
          const status = data?.status || "pending";

          // Customize notification based on transaction type
          if (status === "included") {
            console.log("Transaction data for toast:", {
              txHash,
              eventType,
              from,
              to,
              status,
              rawData: data,
            });
            toast.success(`Transaction Confirmed`, {
              id: `tx-${txHash}`, // Add unique ID to prevent duplicates
              description: (
                <div className="text-black">
                  Tx {txHash.substring(0, 6)}...{txHash.substring(
                    txHash.length - 4
                  )} has been confirmed
                </div>
              ),
              icon: "✅",
              action: txHash
                ? {
                    label: "View Details",
                    onClick: () =>
                      window.open(
                        `https://basescan.org/tx/${txHash}`,
                        "_blank"
                      ),
                  }
                : undefined,
              duration: 8000,
              style: { color: "#000", borderColor: "#68d391" },
              // className: "transaction-toast",
            });
          } else if (status === "failed") {
            toast.error(`Transaction Failed`, {
              description: (<div className="text-black">`{eventType} transaction could not be completed`</div>),
              icon: "❌",
              action: txHash
                ? {
                    label: "View Details",
                    onClick: () =>
                      window.open(
                        `https://basescan.org/tx/${txHash}`,
                        "_blank"
                      ),
                  }
                : undefined,
              duration: 10000,
            });
          } else {
            toast.info(`New ${eventType}`, {
              description: txHash
                ? (<div>Transaction ${txHash.substring(0, 6)}...${txHash.substring(
                    txHash.length - 4
                  )} is processing</div>)
                : (<div className="text-black">New blockchain event received</div>),
              icon: "🔄",
              action: txHash
                ? {
                    label: "Track",
                    onClick: () =>
                      window.open(
                        `https://basescan.org/tx/${txHash}`,
                        "_blank"
                      ),
                  }
                : undefined,
              duration: 5000,
              style: {
                backgroundColor: "#ffffff",
                color: "#000000",
                fontWeight: "500",
                borderColor: "#68d391",
              },
            });
          }

          // Mark notification as read
          supabase
            .from("notifications")
            .update({ read: true })
            .eq("id", notification.id)
            .then(({ error }) => {
              if (error)
                console.error("Error marking notification as read:", error);
            });
        }
      )
      .subscribe();

    console.log("Channel subscribed");

    // Cleanup subscription
    return () => {
      console.log("Cleaning up WebhookListener");
      supabase.removeChannel(channel);
      hasSubscribed.current = false;
    };
  }, []);

  return null;
}
