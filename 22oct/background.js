let currentTabIndex = 0;
let scrollingIntervalId; // Variable to hold the interval ID for scrolling

// returns sync data
async function getDataFromSync() {
  const result = await new Promise((resolve, reject) => {
    chrome.storage.sync.get(["scrollPixels", "intervalTime", "links"], (data) => {
      if (data) {
        resolve(data);
      } else {
        reject('No data found');
      }
    });
  });
  return result;
}

function switchToTabIndex(tabIndex) {
  // Get the links array from chrome.storage.sync
  chrome.storage.sync.get("links", (result) => {
    const links = result.links || [];

    // Ensure the provided tabIndex is valid
    if (tabIndex < 0 || tabIndex >= links.length) {
      console.log("Invalid tab index.");
      return;
    }

    // Get the link at the specified index
    const targetLink = links[tabIndex].link;

    // Query all open tabs
    chrome.tabs.query({}, (tabs) => {
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
    });
  });

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
          chrome.tabs.sendMessage(existingTab.id, {
            action: "scrollFrame",
            className: className,
          });
          resolve();
        });
      } else {
        // Otherwise, create a new tab
        chrome.tabs.create({ url: link }, (newTab) => {
          // Wait for the tab to load, then send the message to scroll
          chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (tabId === newTab.id && info.status === "complete") {
              // Send a message to the content script to scroll
              chrome.tabs.sendMessage(newTab.id, {
                action: "scrollFrame",
                className: className,
              });
              chrome.tabs.onUpdated.removeListener(listener);
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

async function getNextTabLink() {

  const result = await getDataFromSync();
  const links = result.links

  try {
    const currentTab = await getCurrentTab();

    let found = false;

    for (let i = 0; i < links.length; i++) {
      if (links[i].link === currentTab) {
        found = true;
        const nextLink = (i + 1) < links.length ? links[i + 1].link : links[0].link;
        // console.log(nextLink);
        return nextLink; // Return the next link
      }
    }

    if (!found) {
      // console.log("Current tab not found in links. Returning the first link.");
      // console.log(links[0].link);
      return links[0].link; // Return the first link if currentTab is not found
    }
  }
  catch (error) {
    console.log(error)
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
  console.log(switchTabPromise)
  return switchTabPromise;
}

async function switchTabs() {
  const nextLink = await getNextTabLink()
  console.log(nextLink)
  await switchToTabLink(nextLink)
}

async function startScrolling() {
  const result = await getDataFromSync();
  const links = result.links;

  if (links.length === 0) {
    console.log("No links found in storage.");
    return;
  }

  try {
    const currentTab = await getCurrentTab();

    let found = false;
    for (let i = 0; i < links.length; i++) {
      if (links[i].link === currentTab) {
        found = true;
        switchToTabLink(links[i].link)
        break;
      }
    }
    if (!found) {
      switchToTabLink(await getNextTabLink()) // Return the first link if currentTab is not found
    }
  }
  catch (error) {
    console.log(error)
  }

  const tabs = await new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        resolve(tabs);
      } else {
        reject('No active tab found');
      }
    });
  });

  const activeTab = tabs[0];
  console.log(activeTab)

  chrome.tabs.sendMessage(activeTab.id, {
    action: "scrollFrame",
    activeTab: activeTab
  });
}

async function stopScrolling() {
  const tabs = await new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        resolve(tabs);
      } else {
        reject('No active tab found');
      }
    });
  });
  const activeTab = tabs[0];
  chrome.tabs.sendMessage(activeTab.id, { action: "stopScrolling" });
}

async function getClassNameFromLink(url) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(["links"], (result) => {
      for (let i = 0; i < result.links.length; i++) {
        if (result.links[i].link === url) {
          const classNameOfCurrentTab = result.links[i].className;
          resolve(classNameOfCurrentTab);
          return;
        }
      }
      reject('Class name not found');
    });
  });
}

async function getCurrentSyncedData() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(["scrollPixels", "intervalTime"], (result) => {
      const scrollPixels = result.scrollPixels;
      const intervalTime = result.intervalTime;
      resolve({ scrollPixels, intervalTime });
    });
  });
}

async function getCurrentTab() {
  const tabs = await new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        resolve(tabs);
      } else {
        reject('No active tab found');
      }
    });
  });
  const activeTab = tabs[0];
  return activeTab.url
}

async function logActiveTab() {
  try {
    const currentTab = await getCurrentTab();
    // console.log(currentTab);

    const className = await getClassNameFromLink(currentTab);
    // console.log(className);

    const data = await getCurrentSyncedData();
    // console.log(data);

  } catch (error) {
    console.error(error);
  }
}

// Listen for tab activation
chrome.tabs.onActivated.addListener(logActiveTab);

// Listen for tab updates (such as reloads)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.active && changeInfo.status === 'complete') {
    logActiveTab();
  }
});

// Listen for new tab creation
chrome.tabs.onCreated.addListener(logActiveTab);

// Initial log of the active tab
logActiveTab();

// Listener for the scroll complete message to switch tabs
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === "loadTabs") {
    console.log("loadTabs Clicked");
    loadLinks();
  }
  else if (message.action === "switchTab") {
    console.log("switchtab Clicked");
    switchTabs();
    startScrolling();
  }
  else if (message.action === "start") {
    console.log("start Clicked");
    startScrolling();
  }
  else if (message.action === "stop") {
    console.log("stop Clicked");
    stopScrolling();
  }
  else if (message.action === "scrollComplete") {

    await switchToTabLink(await getNextTabLink());
    console.log(await getNextTabLink())

    // const activeTab = await new Promise((resolve, reject) => {
    //   chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    //     if (tabs.length > 0) {
    //       resolve(tabs);
    //     } else {
    //       reject('No active tab found');
    //     }
    //   });
    // });

    // console.log(activeTab[0].id)

    // chrome.tabs.sendMessage(existingTab.id, {
    //   action: "",
    //   className: className,
    // });
    
    startScrolling();
  }
  else if (message.action === "injectCode") {
    const tabs = await new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
          resolve(tabs);
        } else {
          reject('No active tab found');
        }
      });
    });

    const activeTab = tabs[0];

    chrome.tabs.sendMessage(activeTab.id, {
      action: "injectCode"
    });
  }
});

