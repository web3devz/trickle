import { NextResponse } from "next/server";
import axios from "axios";
/* eslint-disable @typescript-eslint/no-explicit-any */
// MultiBaas API configuration
const MULTIBAAS_URL = process.env.NEXT_PUBLIC_BASE_MULTIBAAS_URL || "";
const MULTIBAAS_API_KEY = process.env.NEXT_PUBLIC_BASE_MULTIBAAS_API || "";
const CONTRACT_LABEL =
  process.env.NEXT_PUBLIC_BASE_MULTIBAAS_CONTRACT_LABEL || "";
const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_BASE_MULTIBAAS_CONTRACT_ADDRESS || "";
const FUNCTION_NAME = "detectInvestment";

export async function POST(req: Request) {
  try {
    // Parse the request body
    const body = await req.json();
    const { address, amount } = body;
    console.log("Received request body:", body);

    // Validate inputs
    if (!address || !amount) {
      return NextResponse.json(
        { error: "Address and amount are required" },
        { status: 400 }
      );
    }
    // First, get the transaction data from the contract method
    const methodResponse = await axios.post(
      `${MULTIBAAS_URL}/chains/ethereum/addresses/${CONTRACT_ADDRESS}/contracts/${CONTRACT_LABEL}/methods/${FUNCTION_NAME}`,
      {
        args: [address, amount.toString()],
        from: address,
        value: "0",
        // Don't sign and submit here, just get the tx data
        signAndSubmit: true,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${MULTIBAAS_API_KEY}`,
        },
      }
    );

    return NextResponse.json({
      success: true,
      result: methodResponse.data,
    });
  } catch (error: any) {
    console.error("Error calling contract via MultiBaas:", error);

    // Provide more detailed error information
    const errorDetails = error.response?.data || error.message;

    return NextResponse.json(
      {
        error: "Failed to execute contract call",
        details: errorDetails,
      },
      { status: 500 }
    );
  }
}
