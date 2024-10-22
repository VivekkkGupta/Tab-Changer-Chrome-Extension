let links = [];

// Function to save options to chrome.storage.sync
function saveOptions() {
  const scrollPixels =
    parseInt(document.getElementById("scrollPixels").value) || 550; // Default value
  const intervalTime =
    parseInt(document.getElementById("intervalTime").value) || 2000; // Default value

  chrome.storage.sync.set(
    {
      scrollPixels: scrollPixels,
      intervalTime: intervalTime,
      links: links,
    },
    () => {
      alert("Settings saved and synced!");
    }
  );
  chrome.runtime.sendMessage({ action: "loadTabs" });
}

// Function to restore options from chrome.storage.sync
function restoreOptions() {
  chrome.storage.sync.get(
    ["scrollPixels", "intervalTime", "links"],
    (result) => {
      console.log("Restored values:", result); // Log the retrieved values

      // Safely set the scrollPixels value
      const scrollPixelsValue = parseInt(result.scrollPixels);
      document.getElementById("scrollPixels").value =
        !isNaN(scrollPixelsValue) && scrollPixelsValue > 0
          ? scrollPixelsValue
          : 550; // Default to 550

      // Safely set the intervalTime value
      const intervalTimeValue = parseInt(result.intervalTime);
      document.getElementById("intervalTime").value =
        !isNaN(intervalTimeValue) && intervalTimeValue > 0
          ? intervalTimeValue
          : 2000; // Default to 2000

      links = Array.isArray(result.links) ? result.links : []; // Ensure links is an array
      displayLinks();
    }
  );
}

// Function to display links in the link list
function displayLinks() {
  const linkList = document.getElementById("linkList");
  linkList.innerHTML = ""; // Clear the list

  links.forEach((linkObj, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${linkObj.link}</td>
      <td>${linkObj.className || "window"}</td>
      <td><button data-index="${index}" class="removeLink">Remove</button></td>
    `;
    linkList.appendChild(row);
  });

  // Add event listeners to remove buttons
  document.querySelectorAll(".removeLink").forEach((button) => {
    button.addEventListener("click", (e) => {
      const index = e.target.getAttribute("data-index");
      removeLink(index);
    });
  });
}

// Function to add a new link
function addLink() {
  const newLink = document.getElementById("newLink").value;
  const newLinkClass =
    document.getElementById("newLinkClass").value || "window";
  if (newLink) {
    links.push({ link: newLink, className: newLinkClass });
    document.getElementById("newLink").value = ""; // Clear the input
    document.getElementById("newLinkClass").value = ""; // Clear the class name input
    displayLinks(); // Update the displayed list

    // Save the updated links array to Chrome's sync storage
    chrome.storage.sync.set({ links: links }, () => {
      console.log("Links saved to sync storage");
    });
  }
}

// Function to remove a link
function removeLink(index) {
  links.splice(index, 1);
  displayLinks();

  // Save the updated links array to Chrome's sync storage
  chrome.storage.sync.set({ links: links }, () => {
    console.log("Links updated in sync storage");
  });
}

// Event listeners
document.getElementById("addLink").addEventListener("click", addLink);
document.getElementById("saveOptions").addEventListener("click", saveOptions);
document.addEventListener("DOMContentLoaded", restoreOptions);
