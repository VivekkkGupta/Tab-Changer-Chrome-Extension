// Function to get data from chrome.storage.sync
async function getDataFromSync() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(
      ["scrollPixels", "intervalTime", "links", "isScrolling", "isInView"],
      (data) => {
        if (data) {
          resolve(data);
        } else {
          reject("No data found");
        }
      }
    );
  });
}

async function switchToTabIndex(tabIndex) {
  const data = await getDataFromSync();
  const links = data.links;

  // Ensure the provided tabIndex is valid
  if (tabIndex < 0 || tabIndex >= links.length) {
    console.log("Invalid tab index.");
    return;
  }

  // Get the link at the specified index
  const targetLink = links[tabIndex].link;

  // Query all open tabs
  const tabs = await new Promise((resolve) => {
    chrome.tabs.query({}, (tabs) => {
      resolve(tabs);
    });
  });

  // Check if the tab with the target URL is already open
  const existingTab = tabs.find((tab) => tab.url === targetLink);
  if (existingTab) {
    // If the tab is already open, switch to it
    chrome.tabs.update(existingTab.id, { active: true }, () => {
      console.log(`Switched to existing tab: ${targetLink}`);
    });
  } else {
    // If the tab is not open, create a new tab with the target link
    chrome.tabs.create({ url: targetLink }, (newTab) => {
      console.log(`Opened new tab: ${targetLink}`);
    });
  }
}

// Helper function to handle tab creation or reloading
function processTab(link, className) {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({}, (tabs) => {
      const existingTab = tabs.find((tab) => tab.url === link);

      if (existingTab) {
        // If the tab is already open, reload it
        chrome.tabs.reload(existingTab.id, () => {
          // Send a message to the content script to scroll
          resolve();
        });
      } else {
        // Otherwise, create a new tab
        chrome.tabs.create({ url: link }, (newTab) => {
          // Wait for the tab to load, then send the message to scroll
          chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (tabId === newTab.id && info.status === "complete") {
              resolve();
            }
          });
        });
      }
    });
  });
}

// Update loadLinks to pass the class name from storage
function loadLinks() {
  chrome.storage.sync.get("links", async (result) => {
    const links = result.links || [];
    if (links.length === 0) {
      console.log("No links found in storage.");
      return;
    }
    try {
      // Process all links with Promises
      const tabPromises = links.map((linkObj) =>
        processTab(linkObj.link, linkObj.className)
      );

      // Wait for all tabs to be processed (either opened or reloaded)
      await Promise.all(tabPromises);

      // Switch to the target tab after all tabs are processed
      switchToTabIndex(0);
    } catch (error) {
      console.error("Error processing tabs:", error);
    }
  });
}

async function getCurrentTab() {
  const tabs = await new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        resolve(tabs);
      } else {
        reject("No active tab found");
      }
    });
  });
  const activeTab = tabs[0];
  return activeTab.url;
}

async function getNextTabLink() {
  const result = await getDataFromSync();
  const links = result.links;

  try {
    const currentTab = await getCurrentTab();

    let found = false;

    for (let i = 0; i < links.length; i++) {
      if (links[i].link === currentTab) {
        found = true;
        const nextLink =
          i + 1 < links.length ? links[i + 1].link : links[0].link;
        // console.log(nextLink);
        return nextLink; // Return the next link
      }
    }

    if (!found) {
      // console.log("Current tab not found in links. Returning the first link.");
      // console.log(links[0].link);
      return links[0].link; // Return the first link if currentTab is not found
    }
  } catch (error) {
    console.log(error);
  }
}

async function switchToTabLink(targetLink) {
  const switchTabPromise = await new Promise((resolve, reject) => {
    // Query all open tabs
    chrome.tabs.query({}, (tabs) => {
      // Check if the tab with the target URL is already open
      const existingTab = tabs.find((tab) => tab.url === targetLink);
      if (existingTab) {
        // If the tab is already open, switch to it
        chrome.tabs.update(existingTab.id, { active: true }, () => {
          // console.log(`Switched to existing tab: ${targetLink}`);
          resolve(); // Resolve the promise
        });
      } else {
        // If the tab is not open, create a new tab with the target link
        chrome.tabs.create({ url: targetLink }, (newTab) => {
          // console.log(`Opened new tab: ${targetLink}`);
          resolve(`Opened new tab: ${targetLink}`); // Resolve the promise
        });
      }
    });
  });
  console.log(switchTabPromise);
  return switchTabPromise;
}

// Function to update the scrolling state in storage
async function updateScrollingStateInStorage(state) {
  await chrome.storage.sync.set({ isScrolling: state });
}

// Function to update the visibility state in storage
async function updateVisibilityStateInStorage(state) {
  await chrome.storage.sync.set({ isInView: state });
}

// Listener for the scroll complete message to switch tabs
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === "loadTabs") {
    loadLinks();
    updateScrollingStateInStorage(false);
    updateVisibilityStateInStorage(true);
  } else if (message.action === "scrollComplete") {
    const nextLink = await getNextTabLink();
    console.log(nextLink);

    await switchToTabLink(nextLink);

    // After switching, reload the newly switched tab
    const currentTabLink = nextLink; // The link of the newly switched tab

    // Reload the tab and wait for it to finish before sending the message
    const tabId = await processTab1(currentTabLink); // Reload the newly switched tab and get the tab ID

    // After the reload is complete, send the message to start scrolling
    chrome.tabs.sendMessage(tabId, { action: "startScrolling" });
  }
});

function processTab1(link) {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({}, (tabs) => {
      const existingTab = tabs.find((tab) => tab.url === link);

      if (existingTab) {
        // If the tab is already open, reload it
        chrome.tabs.reload(existingTab.id, () => {
          // Listen for the tab to finish loading
          chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (tabId === existingTab.id && info.status === "complete") {
              chrome.tabs.onUpdated.removeListener(listener); // Remove listener after completion
              resolve(existingTab.id); // Resolve with the tab ID after reload
            }
          });
        });
      } else {
        // Otherwise, create a new tab
        chrome.tabs.create({ url: link }, (newTab) => {
          // Wait for the tab to load
          chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (tabId === newTab.id && info.status === "complete") {
              chrome.tabs.onUpdated.removeListener(listener); // Remove listener after completion
              resolve(newTab.id); // Resolve with the tab ID after loading
            }
          });
        });
      }
    });
  });
}
