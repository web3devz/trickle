console.log("popup.js loaded");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
document.addEventListener("DOMContentLoaded", async function () {
  const myHeaders = new Headers();
  myHeaders.append("Authorization", "Bearer EbErsQR0Ak11khI3kQcwI0sjvPsSeaQo");
  myHeaders.append("accept", "application/json");
  myHeaders.append("content-type", "application/json");

  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  };

  try {
    const response = await fetch(
      "https://api.1inch.dev/balance/v1.2/8453/balances/0x9369d176081C548c9E72997e61A03E0e6DB94697",
      requestOptions
    );
    const balances = await response.json();

    // Filter out tokens with zero balance
    const nonZeroBalances = Object.entries(balances).filter(
      ([_, balance]) => balance !== "0"
    );

    const tokenMetadata = await fetch(
      "https://api.1inch.dev/token/v1.2/8453/custom?" +
        nonZeroBalances
          .map(([tokenAddress, _]) => `addresses=${tokenAddress}`)
          .join("&"),
      requestOptions
    ).then((response) => response.json());

    const tokenPrice = await fetch(
      "https://api.1inch.dev/price/v1.1/8453/" +
        nonZeroBalances.map(([tokenAddress, _]) => tokenAddress).join(",") +
        "?currency=USD",
      requestOptions
    ).then((response) => response.json());

    console.log(tokenPrice);

    const mergedData = nonZeroBalances.map(([address, balance]) => {
      return {
        balance,
        tokenPrice: tokenPrice[address],
        ...tokenMetadata[address],
      };
    });

    const container = document.getElementById("container");
    container.innerHTML = `
      <div class="portfolio">
        <img src="../images/logo.png" id="logo-image" />
        <div id="portfolio-amount"></div>
        <div id="view-profile-button">View Profile</div>
      </div>
    
      <!-- Holdings list -->
      <h3 id="holdings-header">Holdings</h3>
      <ul id="holdings-list">
      </ul>
    
      <!-- Recent micro-investments -->
      <h3 id="recent-investments-title">Recent Transactions</h3>
      <ul id="recent-investments">
        <!-- Data from db -->
        <svg class="loading-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><circle fill="#abec12" stroke="#abec12" stroke-width="15" r="15" cx="40" cy="65"><animate attributeName="cy" calcMode="spline" dur="2" values="65;135;65;" keySplines=".5 0 .5 1;.5 0 .5 1" repeatCount="indefinite" begin="-.4"></animate></circle><circle fill="#abec12" stroke="#abec12" stroke-width="15" r="15" cx="100" cy="65"><animate attributeName="cy" calcMode="spline" dur="2" values="65;135;65;" keySplines=".5 0 .5 1;.5 0 .5 1" repeatCount="indefinite" begin="-.2"></animate></circle><circle fill="#abec12" stroke="#abec12" stroke-width="15" r="15" cx="160" cy="65"><animate attributeName="cy" calcMode="spline" dur="2" values="65;135;65;" keySplines=".5 0 .5 1;.5 0 .5 1" repeatCount="indefinite" begin="0"></animate></circle></svg>
      </ul>`;

    const holdingsListElement = document.getElementById("holdings-list");
    const viewProfileElement = document.getElementById("view-profile-button");

    viewProfileElement.addEventListener("click", () => {
      window.open("https://trickle-kappa.vercel.app/app", "_blank");
    });

    const totalValue = mergedData.reduce((total, token) => {
      const decimals = token["decimals"];
      const factor = Math.pow(10, decimals);
      const balance = parseInt(token["balance"]) / factor;
      const formattedBalance = Number(balance.toPrecision(5)).toString();
      const price = Number(token["tokenPrice"]);
      const value = formattedBalance * price;
      return total + value;
    }, 0);
    const portfolioAmountElement = document.getElementById("portfolio-amount");
    portfolioAmountElement.textContent = `$${totalValue.toPrecision(5)}`;
    mergedData.forEach((token) => {
      const decimals = token["decimals"];
      const factor = Math.pow(10, decimals);
      const value = parseInt(token["balance"]) / factor;
      const formattedBalance = Number(value.toPrecision(5)).toString();
      const name = token["name"];
      const symbol = token["symbol"];
      const logoURI = token["logoURI"];
      const price = Number(token["tokenPrice"]);
      // Create list item for the token balance
      const listItem = document.createElement("li");
      listItem.classList.add("holding-item");
      listItem.innerHTML = `
        <div class="holding-info">
          <img src="${logoURI}" class="holding-logo" />
          <div class="token-details-wrapper">
            <div class="holding-name">${name} (${symbol})</div>
            <div class="holding-price-wrapper">
              <div class="holding-value">$${(value * price).toPrecision(
                2
              )}</div>
              <div class="holding-balance">${formattedBalance} ${symbol}</div>
            </div>
          </div>
        </div>
      `;

      holdingsListElement.appendChild(listItem);
    });
  } catch (error) {
    console.error("Error fetching balances:", error);
  }

  // Fetch portfolio data (for demonstration, using static data)
  chrome.storage.sync.get("portfolio", function () {
    fetchRecentInvestments();
  });
});

// FETCH RECENT INVESTMENTS

const supabaseClient = supabase.createClient(
  "https://rvxwmdwqmpqhmacumvus.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2eHdtZHdxbXBxaG1hY3VtdnVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3NzY0NTYsImV4cCI6MjA1OTM1MjQ1Nn0.bptVBduIQlQr7wWLi9VEk4cSl4S7tvc6Ardo9yzPXfw"
);

async function fetchRecentInvestments() {
  const { data, error } = await supabaseClient
    .from("transactions") // Replace with your table name
    .select("amount, description, created_at")
    .order("created_at", { ascending: false })
    .limit(10); // Adjust the limit to fetch the number of recent investments you need

  if (error) {
    console.error("Error fetching recent investments:", error);
    return;
  }

  // Clear the existing list before adding new data
  const recentInvestmentsList = document.getElementById("recent-investments");
  recentInvestmentsList.innerHTML = "";

  // Loop through the investments data and add it to the list
  data.forEach((investment) => {
    const listItem = document.createElement("li");
    listItem.classList.add("recent-investment-wrapper");

    const formattedDateTime = new Date(investment.created_at).toLocaleString(
      "en-US",
      {
        weekday: "short", // E.g., "Mon"
        year: "numeric", // E.g., "2025"
        month: "short", // E.g., "Mar"
        day: "numeric", // E.g., "17"
        hour: "numeric", // E.g., "10"
        minute: "numeric", // E.g., "24"
        hour12: true, // Use 12-hour format
      }
    );

    let investmentImage = "../images/amazon.png";
    if (investment.description.toLowerCase().includes("amazon")) {
      investmentImage = "../images/amazon.png";
    } else {
      investmentImage = "../images/shopify.png";
    }

    // Create the structure for each investment item
    const investmentItem = `
    <li id="recent-investment-wrapper">
      <image src="${investmentImage}" id="investment-image" />
      <div id="recent-investment-item">
        <div id="recent-investment-title">${investment.description}</div>
        <div id="recent-investment-date-time">${formattedDateTime}</div>
      </div>
      <div id="recent-investment-amount-wrapper">
        <div id="recent-investment-amount">$${(investment.amount / 100).toFixed(
          2
        )}</div>
      </div>
    </li>
    `;

    listItem.innerHTML = investmentItem;
    recentInvestmentsList.appendChild(listItem);
  });
}
