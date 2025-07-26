console.log("shopify-content.js loaded");
const currentUrl = window.location.href;
// Create a URL object
const url = new URL(currentUrl);

// Extract the hostname (main domain)
const hostname = url.hostname; // This will give you something like 'www.amazon.com'

// Extract the main domain name (e.g., 'amazon', 'gymshark')
const domain = hostname.split('.').slice(-2, -1)[0]; // Get the second to last part of the hostname
console.log("Domain:", domain);


const priceElements = document.querySelectorAll('div > div > strong');
let priceElement;

priceElements.forEach(element => {
  if (element.textContent.includes('$')) {  // Or any other logic to match the price element
    priceElement = element;
  }
});

if (priceElement) {
  console.log("Price Element Found:", priceElement);
}

if (!priceElement) {
  console.log("Price element not found.");
} else {
  const price = priceElement.textContent.trim();
  console.log("Detected Price:", price);

  let retryCount = 0;
  const maxRetries = 10; // Stop after 10 attempts (10 seconds)

  function sendMessageToPopup() {
    if (retryCount >= maxRetries) {
      console.log("Popup not ready after multiple attempts. Stopping retries.");
      return;
    }

    chrome.runtime.sendMessage({ action: "openConfirmation", price: price, shopName: domain}, (response) => {
      console.log(domain)
      if (chrome.runtime.lastError) {
        console.log("Popup not ready, retrying...");
        retryCount++;
        setTimeout(sendMessageToPopup, 1000); // Retry after 1 sec
      } else {
        console.log("Popup received the message:", response);
      }
    });
  }

  sendMessageToPopup(); // Start sending messages
}
