document.getElementById("loadTabs").addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "loadTabs" });
});

document.getElementById("Optionspage").addEventListener("click", () => {
  // Navigate to the options page
  chrome.runtime.openOptionsPage();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "sendData") {
    const data = request.data;

    // Example of displaying it in the popup
    const infoElementPopup = document.getElementById("info-message-popup");
    infoElementPopup.style.opacity = "100";
    infoElementPopup.textContent = `${data}`;
    setTimeout(() => {
      infoElementPopup.textContent = "Info";
      infoElementPopup.style.opacity = "0";
    }, 3000);
  }
});

// document.getElementById("injectCode").addEventListener("click", () => {
//   chrome.runtime.sendMessage({ action: "injectCode" });
// });

// document.getElementById("SwitchTab").addEventListener("click", () => {
//   chrome.runtime.sendMessage({ action: "switchTab" });
// });

// document.getElementById("startScroll").addEventListener("click", () => {
//   // Send a message to the active tab to start scrolling
//   chrome.runtime.sendMessage({ action: "start" });
// });

// document.getElementById("stopScroll").addEventListener("click", () => {
//   // Send a message to the active tab to stop scrolling
//   chrome.runtime.sendMessage({ action: "stop" });
// });
