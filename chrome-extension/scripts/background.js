// chrome.runtime.onInstalled.addListener(() => {
//   // Listen for when the user is on the checkout page
//   chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//     console.log(tab);
//     if (changeInfo.status === 'complete' && tab.url.includes('amazon.sg') && tab.url.includes('checkout')) {
//       // Open the popup when you're on the checkout page
//       console.log("Opening popup");
//       chrome.action.openPopup();
//     }
//   });
// });



chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url.includes('amazon.sg') && tab.url.includes('checkout') || tab.url.includes('checkouts')) {
      console.log("Opening confirmation page");
      chrome.action.setPopup({ popup: "html/confirmation-popup.html" });
      chrome.action.openPopup(
        null, () => {
          chrome.action.setPopup({ popup: "html/popup.html" });
        }
      )
    }
  });
});