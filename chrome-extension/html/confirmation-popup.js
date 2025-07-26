const supabaseClient = supabase.createClient(
  "https://rvxwmdwqmpqhmacumvus.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2eHdtZHdxbXBxaG1hY3VtdnVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3NzY0NTYsImV4cCI6MjA1OTM1MjQ1Nn0.bptVBduIQlQr7wWLi9VEk4cSl4S7tvc6Ardo9yzPXfw"
);

let priceValue = 0;
let domainName = "";
// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "openConfirmation") {
    console.log("Popup received price:", message.price);
    console.log("Popup received shop name:", message.shopName);
    domainName = message.shopName;

    priceValue = parseFloat(message.price.replace(/[^\d.]/g, ""));
    // Update detected price
    const detectedPriceElement = document.getElementById("detected-price");
    detectedPriceElement.textContent = `S$${priceValue.toFixed(2)}`;

    // Update tip options dynamically
    updateTipOptions(priceValue);

    sendResponse({ status: "Popup is ready" });
  }
});

function updateTipOptions(price) {
  const tipButtons = document.querySelectorAll(".tip-option");
  tipButtons.forEach((button) => {
    const tipType = button.getAttribute("data-tip");
    let tipAmount = 0;

    if (tipType === "round-up") {
      tipAmount = Math.ceil(price) - price;
    } else if (tipType.includes("%")) {
      tipAmount = (parseFloat(tipType) / 100) * price;
    }

    if (tipType !== "custom") {
      button.innerHTML = `${
        button.textContent.split(" (")[0]
      } (S$${tipAmount.toFixed(2)})`;
    }
  });
}

// Handle button selection
let selectedTip = null;
document.querySelectorAll(".tip-option").forEach((button) => {
  button.addEventListener("click", function () {
    document
      .querySelectorAll(".tip-option")
      .forEach((btn) => btn.classList.remove("selected"));
    this.classList.add("selected");
    selectedTip = this.getAttribute("data-tip");
  });
});

// Handle confirmation
document
  .getElementById("confirm-button")
  .addEventListener("click", async function () {
    if (selectedTip === null) {
      alert("Please select an investment amount.");
      return;
    }

    const confirmButton = document.getElementById("confirm-button");
    const loadingSpinner = `<svg class="loading-svg-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><circle fill="#000" stroke="#000" stroke-width="15" r="15" cx="40" cy="65"><animate attributeName="cy" calcMode="spline" dur="2" values="65;135;65;" keySplines=".5 0 .5 1;.5 0 .5 1" repeatCount="indefinite" begin="-.4"></animate></circle><circle fill="#000" stroke="#000" stroke-width="15" r="15" cx="100" cy="65"><animate attributeName="cy" calcMode="spline" dur="2" values="65;135;65;" keySplines=".5 0 .5 1;.5 0 .5 1" repeatCount="indefinite" begin="-.2"></animate></circle><circle fill="#000" stroke="#000" stroke-width="15" r="15" cx="160" cy="65"><animate attributeName="cy" calcMode="spline" dur="2" values="65;135;65;" keySplines=".5 0 .5 1;.5 0 .5 1" repeatCount="indefinite" begin="0"></animate></circle></svg>`;
    confirmButton.innerHTML = loadingSpinner;

    let investmentAmountInCents = 0;

    // Convert the price to cents
    const priceInCents = Math.round(parseFloat(priceValue) * 100); // Price value in cents

    if (selectedTip === "round-up") {
      // Round up to the nearest dollar (in cents)
      investmentAmountInCents = Math.ceil(priceInCents / 100) * 100;
      investmentAmountInCents -= priceInCents;
    } else if (selectedTip === "5%") {
      // 5% of the price
      investmentAmountInCents = Math.round(priceInCents * 0.05);
    } else if (selectedTip === "10%") {
      // 10% of the price
      investmentAmountInCents = Math.round(priceInCents * 0.1);
    } else if (selectedTip === "20%") {
      // 20% of the price
      investmentAmountInCents = Math.round(priceInCents * 0.2);
    } else if (selectedTip === "30%") {
      // 30% of the price
      investmentAmountInCents = Math.round(priceInCents * 0.3);
    }

    // Check if the amount is valid
    if (investmentAmountInCents <= 0 || isNaN(investmentAmountInCents)) {
      alert("Invalid investment amount.");
      return;
    }

    // Insert the investment amount (in cents) into the Supabase table
    await supabaseClient.from("transactions").insert([
      {
        amount: investmentAmountInCents, // Store amount in cents
        description: domainName,
      },
    ]);

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      amount: investmentAmountInCents,
      address: "0x9369d176081C548c9E72997e61A03E0e6DB94697",
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    const data = await fetch(
      "https://trickle-kappa.vercel.app/api/ext-call",
      requestOptions
    );
    const dataJson = await data.json();
    console.log(dataJson);

    // Close the window
    window.close();
  });

// Handle closing
document.getElementById("close-button").addEventListener("click", function () {
  window.close();
});
