document.getElementById("loadTabs").addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "loadTabs" });
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

// document.getElementById("Optionspage").addEventListener("click", () => {
//   // Navigate to the options page
//   chrome.runtime.openOptionsPage();
// });
