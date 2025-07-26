import io from "socket.io-client";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://rvxwmdwqmpqhmacumvus.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2eHdtZHdxbXBxaG1hY3VtdnVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3NzY0NTYsImV4cCI6MjA1OTM1MjQ1Nn0.bptVBduIQlQr7wWLi9VEk4cSl4S7tvc6Ardo9yzPXfw"
);

const messageIds = new Set(); // Set to store unique message IDs

// {Your websocket message ID} - This is a unique identifier for your WebSocket message. You need to replace this placeholder with an actual ID that is relevant to your application.
const messageId = "trickle-ai";

// eventType specifies the type of event you want to subscribe to on the blockchain. For example, "BLOCK_PERIOD" could be used to receive events related to blockchain block timings.
const eventType = "LOG";

// The WebSocket URL to connect to. You need to use the appropriate URL provided by your blockchain service provider.
const url = "wss://web3.nodit.io/v1/websocket";

// Parameters for configuring the subscription. You should replace the placeholder in 'description' with a brief description of your WebSocket connection's purpose.
const params = {
  description: "Trickle live feed",
  condition: {
    address: "0x4aa651aCd828320BC28F63F8B5A862b660f01393",
    topics: [
      "0x290ee7b788361b665b1ac64dba3eb81eb8293458684c371c3a604ce3c8382152", //investment detected
    ],
  },
};

// Options for the WebSocket connection. These include security settings and additional parameters required by the server.
const options = {
  rejectUnauthorized: false, // This should be true in production for better security unless your server uses a self-signed certificate.
  transports: ["websocket"],
  path: "/v1/websocket/",
  auth: {
    apiKey: `WHK6gl8Q8ymIDjlDBQ2ZS0x-oJRM~mu3`, // Replace this with your actual API key provided by the service.
  },
  query: {
    protocol: "base", // Replace this with the blockchain protocol you are interacting with, e.g., "ethereum", "arbitrum", etc.
    network: "mainnet", // Replace this with the specific network you are targeting, e.g., "mainnet", "testnet".
  },
};

// This function establishes a connection to the server and handles various WebSocket events.
function connectToServer() {
  return new Promise((resolve, reject) => {
    const socket = io(url, options);

    socket.on("connect", () => {
      socket.on("subscription_registered", (message) => {
        console.log("registered", message);
      });

      socket.on("subscription_connected", (message) => {
        console.log("subscription_connected", message);

        // Emit a subscription message with your specific messageId, eventType, and parameters.
        socket.emit(
          "subscription",
          messageId,
          eventType,
          JSON.stringify(params)
        );
      });

      socket.on("subscription_error", (message) => {
        console.error(`nodit_subscription_error: ${message}`);
      });

      socket.on("subscription_event", async (message) => {
        console.log("subscription_event", message);
        try {
          const eventMatch = message.match(/event:\s*(\{.*\})$/s);
          if (!eventMatch) throw new Error("Event not found");

          const eventJson = eventMatch[1];
          const event = JSON.parse(eventJson);
          console.log("🧩 Extracted event:", event);

          const hexAmount = event.messages[0].data;
          const id = event.messages[0].transaction_hash;
          console.log("🧩 Extracted id:", id);

          if (messageIds.has(id)) {
            console.log("ID already processed, skipping...");
            return; // Skip if the ID has already been processed
          }
          messageIds.add(id); // Add the ID to the set

          // check if id exists in the database
          const { data, error } = await supabase
            .from("nodit-stream")
            .select("unique_id")
            .eq("unique_id", id);
          if (data.length === 0) {
            console.log("ADDING NEW ID");
            const amount = BigInt(hexAmount);
            const amountNumber = Number(amount);
            await supabase.from("nodit-stream").insert({
              name: "investment-detected",
              amount: amountNumber,
              unique_id: id,
            });
          }
        } catch (err) {
          console.error("Failed to extract extra_data:", err.message);
        }
      });

      socket.on("disconnect", (message) => {
        console.warn(`disconnect`, message);
      });

      resolve(socket);
    });

    socket.on("connect_error", (error) => {
      console.error(`Socket connection error to : `, error);
      reject(error);
    });
  });
}

connectToServer();
