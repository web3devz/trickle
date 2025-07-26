console.log("amazon-content.js loaded");


const currentUrl = window.location.href;
// Create a URL object
const url = new URL(currentUrl);

// Extract the hostname (main domain)
const hostname = url.hostname; // This will give you something like 'www.amazon.com'

// Extract the main domain name (e.g., 'amazon', 'gymshark')
const domain = hostname.split('.')[1]; // Splitting on '.' and getting the second part
console.log("Domain:", domain);

const priceElement = document.getElementsByClassName("order-summary-line-definition")[0];
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

    chrome.runtime.sendMessage({ action: "openConfirmation", price: price, shopName: domain }, (response) => {
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
