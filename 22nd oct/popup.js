document.getElementById("loadTabs").addEventListener("click", () => {
  // Send a message to load the saved tabs
  chrome.runtime.sendMessage({ action: "loadTabs" });

  // Hide the info div after clicking "Open Saved Tabs"
  document.getElementById("infoDiv").style.display = "none";
});

document.getElementById("addLink").addEventListener("click", () => {
  // Navigate to the options page where the user can add links
  chrome.runtime.openOptionsPage();

  // Show the info div with the instruction
  const infoDiv = document.getElementById("infoDiv");
  infoDiv.innerText =
    "Please click on 'Open Saved Tabs' to reload after adding links.";
  infoDiv.style.display = "block";

  // Automatically hide the info div after a certain period (e.g., 5 seconds)
  setTimeout(() => {
    infoDiv.style.display = "none";
  }, 5000);
});
