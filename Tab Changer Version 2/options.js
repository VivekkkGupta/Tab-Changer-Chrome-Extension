let links = [];

// Function to save options to chrome.storage.sync
function saveOptions() {
  const scrollPixels =
    parseInt(document.getElementById("scrollPixels").value) || 550; // Default value
  const intervalTime =
    parseInt(document.getElementById("intervalTime").value) || 5; // Default value
  const isScrolling = document.getElementById("isScrolling").checked;
  const isInView = document.getElementById("IsInView").checked;

  chrome.storage.sync.set(
    {
      scrollPixels: scrollPixels,
      intervalTime: intervalTime,
      links: links,
      isScrolling: isScrolling,
      isInView: isInView,
    },
    () => {
      alert("Settings saved and synced!");
      displayJsonData(); // Display the updated JSON data
    }
  );
  // chrome.runtime.sendMessage({ action: "loadTabs" });
}

// Function to restore options from chrome.storage.sync
function restoreOptions() {
  chrome.storage.sync.get(
    ["scrollPixels", "intervalTime", "links", "isScrolling", "isInView"],
    (result) => {
      console.log("Restored values:", result); // Log the retrieved values

      // Safely set the scrollPixels value
      const scrollPixelsValue = parseInt(result.scrollPixels);
      const scrollPixels =
        !isNaN(scrollPixelsValue) && scrollPixelsValue > 0
          ? scrollPixelsValue
          : 550; // Default to 550
      document.getElementById("scrollPixels").value = scrollPixels;

      // Safely set the intervalTime value
      const intervalTimeValue = parseInt(result.intervalTime);
      const intervalTime =
        !isNaN(intervalTimeValue) && intervalTimeValue > 0
          ? intervalTimeValue
          : 5; // Default to 5
      document.getElementById("intervalTime").value = intervalTime;

      // Set the isScrolling checkbox
      const isScrolling =
        result.isScrolling !== undefined ? result.isScrolling : false; // Default to false
      document.getElementById("isScrolling").checked = isScrolling;

      // Set the isInView checkbox
      const isInView = result.isInView !== undefined ? result.isInView : true; // Default to true
      document.getElementById("IsInView").checked = isInView;

      // Ensure links is an array
      links = Array.isArray(result.links) ? result.links : [];

      // If no data exists, save the default values to chrome.storage.sync
      if (
        result.scrollPixels === undefined ||
        result.intervalTime === undefined ||
        result.isScrolling === undefined ||
        result.isInView === undefined
      ) {
        chrome.storage.sync.set(
          {
            scrollPixels: scrollPixels,
            intervalTime: intervalTime,
            isScrolling: isScrolling,
            isInView: isInView,
            links: links,
          },
          () => {
            console.log("Default settings saved for the first start.");
          }
        );
      }

      displayLinks();
      displayJsonData(); // Display the restored JSON data
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
      displayJsonData(); // Display the updated JSON data
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
    displayJsonData(); // Display the updated JSON data
  });
}

// Function to display the stored data in JSON format
function displayJsonData() {
  chrome.storage.sync.get(
    ["scrollPixels", "intervalTime", "links", "isScrolling", "isInView"],
    (result) => {
      const jsonDisplay = document.getElementById("jsonDisplay");
      jsonDisplay.innerText = JSON.stringify(result, null, 2); // Prettify the JSON
      jsonDisplay.style.display = "block";
    }
  );
}

// Event listeners
document.getElementById("addLink").addEventListener("click", addLink);
document.getElementById("saveOptions").addEventListener("click", saveOptions);
document
  .getElementById("showDataButton")
  .addEventListener("click", displayJsonData);
document.addEventListener("DOMContentLoaded", restoreOptions);
