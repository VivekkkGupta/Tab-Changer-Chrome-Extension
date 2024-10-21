// var scrollingIntervalId; // Declare this globally to keep track of the interval ID
// var isScrolling = false;
var isCodeInjected = false;

async function getIntervalIdFromSync() {
  const result = await getDataFromSync();
  return result;
}

async function setIntervalIdInSync(intervalId) {
  await chrome.storage.sync.set({ intervalId });
}

async function IsScrollingfromSync() {
  const result = await getDataFromSync();
  return result;
}

async function setIsScrolling(booleanvalue) {
  const response = await new Promise((resolve, reject) => {
    chrome.storage.sync.set({ isScrolling: booleanvalue }, () => {
      resolve();
    });
  });
  return;
}

// Function to scroll the frame or window based on stored settings
function scrollFrame(frameClass, scrollStep) {
  let frame = frameClass;

  if (frame !== "window") {
    // Scrolling an element other than the window
    frame = document.querySelector(frameClass);
    const totalHeight = frame.scrollHeight;
    const currentPosition = frame.scrollTop + frame.clientHeight;

    if (currentPosition + scrollStep < totalHeight - 100) {
      frame.scrollBy({
        top: scrollStep,
        left: 0,
        behavior: "smooth",
      });
    } else {
      frame.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });

      clearInterval(scrollingIntervalId);

      // Notify background script to switch to the next tab
      chrome.runtime.sendMessage({ action: "scrollComplete" });
    }
  } else {
    // Scrolling the entire window
    const totalHeight = document.body.scrollHeight;
    const currentPosition = window.pageYOffset + window.innerHeight;

    if (currentPosition + scrollStep < totalHeight - 100) {
      window.scrollBy({
        top: scrollStep,
        left: 0,
        behavior: "smooth",
      });
    } else {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });

      clearInterval(scrollingIntervalId);

      // Notify background script to switch to the next tab
      chrome.runtime.sendMessage({ action: "scrollComplete" });
    }
  }
}

// returns sync data
async function getDataFromSync() {
  const result = await new Promise((resolve, reject) => {
    chrome.storage.sync.get(
      ["scrollPixels", "intervalTime", "links"],
      (data) => {
        if (data) {
          resolve(data);
        } else {
          reject("No data found");
        }
      }
    );
  });
  return result;
}

function startScrollingWithClassNameScrollStepInterval(
  classNameOfCurrentTab,
  scrollStep,
  interval
) {
  scrollingIntervalId = setInterval(() => {
    scrollFrame(classNameOfCurrentTab, scrollStep);
  }, interval * 1000);
}

async function getCurrentTabsClassName() {
  const allDataFromSync = await getDataFromSync();
  const links = allDataFromSync.links;
  let classNameOfCurrentTab;

  for (let i = 0; i < links.length; i++) {
    if (links[i].link === window.location.href) {
      classNameOfCurrentTab = links[i].className;
      return classNameOfCurrentTab;
    }
  }
  return "";
}

// Start/Stop scrolling logic when the start-stop button is clicked
async function scrollStartStopLogic() {
  const startStopButton = document.getElementById("start-stop-btn");

  if (!(await IsScrollingfromSync())) {
    // Set scrolling state to true globally
    await setIsScrolling(true);

    startStopButton.textContent = "Pause Scrolling";
    console.log("Scrolling Started");

    await startScrollingOnTabActivation();

    // Notify all tabs that scrolling has started
    chrome.runtime.sendMessage({ action: "scrollingStarted" });
  } else {
    // Set scrolling state to false globally
    startStopButton.textContent = "Start Scrolling";
    await setIsScrolling(false);

    // Clear interval and stop scrolling
    if (scrollingIntervalId) {
      clearInterval(scrollingIntervalId);
      scrollingIntervalId = null;
      console.log("Scrolling stopped.");
    }

    // Notify all tabs that scrolling has stopped
    chrome.runtime.sendMessage({ action: "scrollingStopped" });
  }
}

async function updateChangesInAllTabs() {
  const infoElement = document.getElementById("info-message");
  try {
    const scrollIntervalElement = document.getElementById(
      "scroll-interval-input"
    );
    const scrollDistanceElement = document.getElementById(
      "scroll-distance-input"
    );

    const data = await getDataFromSync();

    scrollIntervalElement.value = data["intervalTime"];
    scrollDistanceElement.value = data["scrollPixels"];
  } catch {
    infoElement.innerText = "Reload is Required";
  }
}

async function checkIfCurrentTabInLinks() {
  const allDataFromSync = await getDataFromSync();
  const links = allDataFromSync.links;

  for (let i = 0; i < links.length; i++) {
    if (links[i].link === window.location.href) {
      return true;
    }
  }
  return false;
}

// Function to handle tab visibility change
async function onTabVisible() {
  if (!document.hidden) {
    const isScrolling = await IsScrollingfromSync(); // Check if scrolling is enabled globally
    const scrollingIntervalid = await getIntervalIdFromSync();
    console.log(isScrolling);
    console.log(scrollingIntervalid);

    // const isCurrentTabInLinks = await checkIfCurrentTabInLinks();

    // if (isCurrentTabInLinks) {
    //   await injectControlPanelInTab(); // Inject control panel in the tab
    //   await updateChangesInAllTabs(); // Update the control panel settings

    //   if (isScrolling) {
    //     // If scrolling is active globally, start scrolling this tab
    //     console.log("Tab is active, starting scrolling...");
    //     await startScrollingOnTabActivation();
    //   } else {
    //     // If scrolling is inactive, stop any ongoing scroll
    //     console.log("Tab is active, but scrolling is stopped.");
    //     if (scrollingIntervalId) {
    //       clearInterval(scrollingIntervalId);
    //     }
    //   }
    // }
  }
}

async function injectControlPanelInTab() {
  console.log("This Tab is in View");
  controlPanelScript();
  console.log("Code Injected");
}

async function addControlPanel() {
  const div = document.createElement("div");
  div.innerHTML = `
  <link href="https://cdn.jsdelivr.net/npm/remixicon@4.3.0/fonts/remixicon.css" rel="stylesheet" />
  <style>
      @import url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap');
      #control-panel-for-scroll {
          position: fixed;
          top: 40%;
          right: 20px;
          z-index: 1000000;
          background-color: black;
          color: white;
          padding: 30px 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 10px;
          box-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;
          font-family: "Roboto", sans-serif;
          font-weight: 500;
          transition: all 0.5s ease;
          width: 230px;
      }
      #start-stop-btn {
          background-color: #87ca02;
          cursor: pointer;
          padding: 10px 20px;
          font-size: 16px;
          border: 0px;
          border-radius: 5px;
          transition: all 0.2s;
          font-weight: 700;
      }
      #start-stop-btn:hover {
          background-color: #6b9713;
          color: white;
      }
          
      .input-box {
          outline: none;
          padding: 1px 5px;
          width: 60px;
      }
      .flex {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 5px;

      }
      #hide-show-button {
          position: absolute;
          width: 50px;
          height: 50px;
          background-color: black;
          left: -50px;
          top: 0px;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
      }
      #hide-show-button:hover {
          background-color: gray;
      }
      #refresh-button{
          background-color: #d49d27;
          cursor: pointer;
          padding: 10px 20px;
          font-size: 16px;
          border: 0px;
          border-radius: 5px;
          transition: all 0.2s;
          font-weight: 700;
      }
      #refresh-button:hover {
          background-color: #98680e;
          color: white;
      }
      .saverestbuttonclass{
          justify-content: space-around;
      }
      #save-button{
          background-color: #c8fc84;
          cursor: pointer;
          padding: 5px 10px;
          font-size: 16px;
          border: 0px;
          border-radius: 5px;
          transition: all 0.2s;
          font-weight: 700;
      }
      #save-button:hover {
          background-color: #7da14e;
          color: white;
      }
      #reset-button{
          background-color: rgb(201, 196, 196);
          cursor: pointer;
          padding: 5px 10px;
          font-size: 16px;
          border: 0px;
          border-radius: 5px;
          transition: all 0.2s;
          font-weight: 700;
      }
      #reset-button:hover {
          background-color: #98680e;
          color: white;
      }
      #arrow {
          color: white;
          font-size: 30px;
      }
      #info-message{
          text-align: center;
          opacity:0;
      }
  </style>
    <div id="control-panel-for-scroll">
      <div class="arrowbox" id="hide-show-button">
          <div id="arrow">&gt;&gt;</div>
      </div>
      <button id="refresh-button">Refresh Tabs
          <i class="ri-reset-right-line"></i>
      </button>
      <div class="flex">
          <div id="scroll-interval" class="labelclass">Scroll Interval : </div>
          <input type="text"  id="scroll-interval-input" class="input-box">
      </div>
      <div class="flex">
          <div id="scroll-distance" class="labelclass">Scroll Distance : </div>
          <input type="number" id="scroll-distance-input" class="input-box">
      </div>
      <div class="flex saverestbuttonclass">
          <button id="reset-button">Reset</button>
          <button id="save-button">Save</button>
      </div>
      <div id="info-message">Info</div>
      <button id="start-stop-btn">Start Scrolling</button>
    </div>
  `;
  document.body.appendChild(div);
}

async function alertUser(alertMessage, timeOfView = 3) {
  const infoElement = document.getElementById("info-message");

  infoElement.innerText = alertMessage;
  infoElement.style.opacity = "100";

  const infoTimeOut = setTimeout(() => {
    infoElement.innerText = "Info";
    infoElement.style.opacity = "0";
  }, timeOfView * 1000);
}

async function controlPanelScript() {
  if (!document.querySelector("#control-panel-for-scroll")) {
    await addControlPanel();

    const allDataFromSync = await getDataFromSync();

    const scrollIntervalFromSync = allDataFromSync.intervalTime;
    const scrollDistanceFromSync = allDataFromSync.scrollPixels;

    const hideorshowbutton = document.getElementById("hide-show-button");
    const controlpanel = document.getElementById("control-panel-for-scroll");
    const arrow = document.getElementById("arrow");

    const startStopButton = document.getElementById("start-stop-btn");
    const refreshButtonElement = document.getElementById("refresh-button");

    const scrollIntervalElement = document.getElementById(
      "scroll-interval-input"
    );
    const scrollDistanceElement = document.getElementById(
      "scroll-distance-input"
    );

    let isInView = false;

    //Assigned Value from Sync to Input Field
    scrollIntervalElement.value = scrollIntervalFromSync;
    scrollDistanceElement.value = scrollDistanceFromSync;

    //Selected Button elements
    const saveButtonElement = document.getElementById("save-button");
    const resetButtonElement = document.getElementById("reset-button");

    const infoElement = document.getElementById("info-message");

    //if the value of any of the field is changed, change the value in Sync
    saveButtonElement.addEventListener("click", async () => {
      const ValueOfScrollInterval = parseFloat(scrollIntervalElement.value);
      const ValueOfScrollDistance = parseFloat(scrollDistanceElement.value);

      if (
        scrollDistanceFromSync !== ValueOfScrollDistance ||
        scrollIntervalFromSync !== ValueOfScrollInterval
      ) {
        if (ValueOfScrollInterval > 0) {
          const result = await new Promise((resolve, reject) => {
            chrome.storage.sync.set(
              {
                scrollPixels: ValueOfScrollDistance,
                intervalTime: ValueOfScrollInterval,
              },
              () => {
                resolve("Changed");
              }
            );
          });
          const data = await getDataFromSync();
          await alertUser(
            String(
              result +
                " Scroll Distance : " +
                data["scrollPixels"] +
                " & Scroll Interval : " +
                data["intervalTime"]
            )
          );
        } else {
          await alertUser("Please Enter Positive Value");
        }
      } else {
        await alertUser("No Changes Made");
      }
    });

    resetButtonElement.addEventListener("click", async () => {
      const result = await new Promise((resolve, reject) => {
        chrome.storage.sync.set(
          {
            scrollPixels: 500,
            intervalTime: 10,
          },
          () => {
            resolve("Values are Resetted to default");
          }
        );
      });

      const data = await getDataFromSync();

      await alertUser(
        String(
          result +
            " Distance : " +
            data["scrollPixels"] +
            " Interval : " +
            data["intervalTime"]
        )
      );

      scrollIntervalElement.value = data["intervalTime"];
      scrollDistanceElement.value = data["scrollPixels"];
    });

    refreshButtonElement.addEventListener("click", () => {
      chrome.runtime.sendMessage({ action: "loadTabs" });
    });

    hideorshowbutton.addEventListener("click", () => {
      if (isInView) {
        controlpanel.style.right = "-250px";
        arrow.style.transform = "rotate(180deg)";
        isInView = false;
      } else {
        controlpanel.style.right = "20px";
        arrow.style.transform = "rotate(0deg)";
        isInView = true;
      }
    });

    startStopButton.addEventListener("click", async () => {
      await scrollStartStopLogic();
    });
  }
}

document.addEventListener("visibilitychange", onTabVisible);
if (!document.hidden) {
  onTabVisible();
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  // if (message.action === "scrollFrame") {
  //   await scrollStartLogic();
  // }
  //  else if (message.action === "stopScrolling") {
  //   await scrollStopLogic();
  // }
  // if (message.action === "injectCode") {
  //   isCodeInjected = true;
  // }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "scrollingStarted") {
    const startStopButton = document.getElementById("start-stop-btn");
    const infoMessage = document.getElementById("info-message");

    infoMessage.innerText =
      "Scrolling started in another tab. Click stop scrolling to stop it here.";
    infoMessage.style.opacity = "100";

    // Change button to show that scrolling is active
    startStopButton.textContent = "Pause Scrolling";
  }

  if (message.action === "scrollingStopped") {
    const startStopButton = document.getElementById("start-stop-btn");
    const infoMessage = document.getElementById("info-message");

    // Reset to default state when scrolling is stopped
    infoMessage.innerText = "Scrolling stopped in all tabs.";
    infoMessage.style.opacity = "100";
    startStopButton.textContent = "Start Scrolling";
  }
});

// Function to start scrolling
async function startScrollingOnTabActivation() {
  const allDataFromSync = await getDataFromSync();
  const scrollStep = allDataFromSync.scrollPixels;
  const interval = allDataFromSync.intervalTime;
  const classNameOfCurrentTab = await getCurrentTabsClassName();

  startScrollingWithClassNameScrollStepInterval(
    classNameOfCurrentTab,
    scrollStep,
    interval
  );
}
