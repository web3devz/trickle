import { createClient } from "@/lib/supabase";
import axios from "axios";
import { parseEther } from "ethers";
import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(request: Request) {
    const body = await request.json();
    console.log("Received request body:", body);
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
                console.log("Starting to mint TRKL Token")
                axios.post(
                    `https://trickle-kappa.vercel.app/api/trkl/mint`,
                    {
                        userAddress: walletAddress,
                        amount: Math.ceil(allocation.proportion * Number(amount))
                    },
                    {
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                );
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
