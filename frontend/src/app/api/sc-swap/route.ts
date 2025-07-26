import { NextResponse } from "next/server";
import axios from "axios";
import { createClient } from "@/lib/supabase";
import { parseEther } from "ethers";
/* eslint-disable @typescript-eslint/no-explicit-any */
interface SwapRequest {
  walletAddress: string;
  amount: string; // Total amount to distribute according to portfolio proportions
}

interface EventData {
  id: string;
  event: string;
  data: {
    triggeredAt: string;
    event: {
      name: string;
      signature: string;
      inputs: Array<{
        name: string;
        value: string;
        hashed: boolean;
        type: string;
      }>;
      // Other event properties
    };
    // Other data properties
  };
}

export async function POST(request: Request) {
  try {
    console.log("Received webhook request at:", new Date().toISOString());
    // Check if this is a webhook event from MultiBaas
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const rawData = await request.json();
      console.log("Webhook data ID:", rawData[0]?.id);
      // Check if it's an array of events
      // if (Array.isArray(rawData)) {
      // Find the BatchReady event
      const batchReadyEvent = rawData.find(
        (event: EventData) =>
          event.event === "event.emitted" &&
          event.data?.event?.name === "BatchReady"
      );

      if (batchReadyEvent) {
        console.log("BatchReady event found:", batchReadyEvent);

        // Extract the totalAmount from the BatchReady event
        const totalAmount = batchReadyEvent.data.event.inputs.find(
          (input) => input.name === "totalAmount"
        )?.value;

        if (totalAmount) {
          // Get the wallet address from the transaction data
          const walletAddress = batchReadyEvent.data.transaction?.from;

          if (walletAddress) {
            // Get ETH price from CoinGecko API
            try {
              // Process the swap with the extracted data
              processSwap({
                walletAddress,
                amount: totalAmount,
              });

              fetch("https://trickle-kappa.vercel.app/api/process-swap", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  walletAddress,
                  amount: totalAmount,
                }),
              });

              return NextResponse.json(
                { success: true, message: "Swap initiated" },
                { status: 200 }
              );
            } catch (error) {
              console.error("Error fetching ETH price:", error);
              return NextResponse.json(
                { error: "Failed to fetch ETH price for conversion" },
                { status: 200 }
              );
            }
          }
        }
      }
    }

    return NextResponse.json(
      { error: "Invalid content type" },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 200 }
    );
  }
}

// Function to pad an Ethereum address with zeros to make it bytes32 compatible
function padAddressToBytes32(address: string): string {
  // Remove '0x' if present, pad with 24 zeros (12 bytes), then add '0x' back
  return address.startsWith("0x")
    ? `0x${address.slice(2)}${"0".repeat(24)}`
    : `0x${address}${"0".repeat(24)}`;
}

// Separate the swap processing logic into its own function
async function processSwap(body: SwapRequest) {
  const { walletAddress, amount } = body;
  const multibaasUrl = process.env.NEXT_PUBLIC_BASE_MULTIBAAS_URL;
  const multibaasApiKey = process.env.NEXT_PUBLIC_BASE_MULTIBAAS_API;
  const CONTRACT_ADDRESS =
    process.env.NEXT_PUBLIC_BASE_MULTIBAAS_CONTRACT_ADDRESS || "";
  const CONTRACT_LABEL =
    process.env.NEXT_PUBLIC_BASE_MULTIBAAS_CONTRACT_LABEL || "";

  if (!multibaasUrl || !multibaasApiKey) {
    return NextResponse.json(
      { error: "MultiBaas configuration missing" },
      { status: 200 }
    );
  }

  if (!walletAddress || !amount) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 200 }
    );
  }

  const ethPrice = 1807;
  // Convert cents to dollars
  const valueInDollars = Number(amount) / 100;

  // Calculate ETH amount: value in dollars / price of ETH
  const amountInEth = (valueInDollars / ethPrice).toFixed(18);

  console.log(
    `Converting $${valueInDollars} (${amount} cents) to ${amountInEth} ETH`
  );

  // Convert amount to wei
  const amountInWei = parseEther(amountInEth.toString()).toString();

  // Initialize Supabase client
  const supabase = createClient();

  // Get portfolio allocations
  const { data: portfolio, error: portfolioError } = await supabase
    .from("portfolio")
    .select("*");

  if (portfolioError) {
    console.log("portfolio error");
    return NextResponse.json(
      {
        error: "Failed to fetch portfolio data",
        details: portfolioError.message,
      },
      { status: 200 }
    );
  }

  if (!portfolio || portfolio.length === 0) {
    console.log("portfolio error 2");
    return NextResponse.json(
      { error: "No portfolio allocations found" },
      { status: 200 }
    );
  }

  // Execute swaps for each portfolio allocation
  const swapResults = [];
  const nativeToken = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  // Process all allocations
  for (const allocation of portfolio) {
    const swapAmount = BigInt(
      Math.floor(Number(amountInWei) * allocation.proportion)
    );
    try {
      console.log("swap amount", swapAmount);
      // Add delay between requests
      await delay(3000); // 3 seconds delay between swaps

      const baseUrl = "https://trickle-kappa.vercel.app/";
      console.log(baseUrl);
      console.log("Making swap request with params:");
      const swapResponse = await axios.get(`${baseUrl}/api/1inch/swap`, {
        params: {
          src: nativeToken,
          dst: allocation.tokenAddress,
          amount: swapAmount.toString(),
          from: walletAddress,
          origin: walletAddress,
          slippage: 5,
        },
      });
      console.log("Swap response:", swapResponse.data);

      // Only proceed with MultiBaas transaction if we have valid tx data
      const txData = swapResponse.data?.tx;
      if (txData && txData.data) {
        const txResponse = await axios.post(
          `${multibaasUrl}/chains/ethereum/hsm/submit`,
          {
            tx: {
              gasPrice: txData.gasPrice,
              gas: Number(txData.gas),
              from: txData.from,
              to: txData.to,
              value: txData.value,
              data: txData.data,
              type: 0,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${multibaasApiKey}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log("MultiBaas transaction response:", txResponse.data);

        swapResults.push({
          token: allocation.token,
          type: "swap",
          proportion: allocation.proportion,
          amount: swapAmount.toString(),
          txHash: txResponse.data.txHash || txResponse.data.hash,
        });
        console.log("run emit evenet");
        console.log(
          "args for submit and sign event emit",
          String(Math.ceil(allocation.proportion * Number(amount)))
        );
        console.log(allocation.token, "token allocation");
        await delay(3000);
        const emitSwapEvent = await axios.post(
          `${multibaasUrl}/chains/ethereum/addresses/${CONTRACT_ADDRESS}/contracts/${CONTRACT_LABEL}/methods/recordSwap`,
          {
            args: [
              String(Math.ceil(allocation.proportion * Number(amount))),
              allocation.token,
            ],
            from: walletAddress,
            value: "0",
            signAndSubmit: true,
            nonceManagement: true,
          },
          {
            headers: {
              Authorization: `Bearer ${multibaasApiKey}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log(`emit swap event data:`, emitSwapEvent.data);
      }
    } catch (error: any) {
      console.log("erorr here", error.response);
      swapResults.push({
        token: allocation.token,
        type: "error",
        error:
          error.response?.data?.error ||
          error.response?.data?.description ||
          error.message ||
          "Failed to execute swap",
      });
    }
  }

  return NextResponse.json(
    {
      success: true,
      results: swapResults,
    },
    { status: 200 }
  );
}
