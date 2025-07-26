// Function to load and insert external HTML file
function loadHTML(file) {
  fetch(chrome.runtime.getURL(file))
    .then(response => response.text())
    .then(html => {
      document.body.insertAdjacentHTML("beforeend", html); // Insert HTML at the end of <body>

      // Add event listener for the close button
      document.getElementById("close-round-up").addEventListener("click", function () {
        document.getElementById("round-up-message").remove();
      });
    })
    .catch(error => console.error('Error loading HTML:', error));
}

// Add the external CSS file to the page
function addStylesheet() {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.type = 'text/css';
  link.href = chrome.runtime.getURL("styles/styles.css"); // Correct file path
  document.head.appendChild(link);
}

// Load and insert the HTML
loadHTML("html/home.html");

// Ensure the external stylesheet is added
addStylesheet();