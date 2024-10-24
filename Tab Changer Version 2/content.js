// Global variables to track scrolling state and interval ID
let scrollingIntervalId = null;

let hideTimeout; // Timer variable
let hidetimeinseconds = 5 * 1000;

// Function to scroll the frame or window based on stored settings
async function scrollFrame(frameClass, scrollStep) {
  let frame;
  if (frameClass === "window") {
    // Handle scrolling for the window
    frame = window;
  } else {
    // Handle scrolling for a specific frame
    frame = document.querySelector(frameClass);
  }

  const totalHeight =
    frame === window ? document.body.scrollHeight : frame.scrollHeight;
  const currentPosition =
    frame === window
      ? window.scrollY + window.innerHeight
      : frame.scrollTop + frame.clientHeight;

  // console.log("Scrolling in Progress");

  if (currentPosition + scrollStep < totalHeight - 100) {
    // Scroll down
    if (frame === window) {
      window.scrollBy({
        top: scrollStep,
        left: 0,
        behavior: "smooth",
      });
    } else {
      frame.scrollBy({
        top: scrollStep,
        left: 0,
        behavior: "smooth",
      });
    }
  } else {
    // Scroll to top
    if (frame === window) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
    } else {
      frame.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
    }

    clearInterval(scrollingIntervalId);
    await sleep(2000)
    // Notify the background script to switch tabs
    chrome.runtime.sendMessage({ action: "scrollComplete" });
  }
}

function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

// Function to update the scrolling state in storage
async function updateScrollingStateInStorage(state) {
  await chrome.storage.sync.set({ isScrolling: state });
}

// Helper function to update visibility state in chrome.storage.sync
async function updateVisibilityStateInStorage(state) {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ isInView: state }, () => {
      // console.log("Updated visibility state in storage to:", state);
      resolve();
    });
  });
}

// Function to get data from chrome.storage.sync
async function getDataFromSync() {
  const result =  new Promise((resolve, reject) => {
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

  return result;
}

function startScrollingWithClassNameScrollStepInterval(
  classNameOfCurrentTab,
  scrollStep,
  interval
) {
  return setInterval(() => {
    scrollFrame(classNameOfCurrentTab, scrollStep);
  }, interval * 1000);
}

// Get the class name for the current tab
async function getCurrentTabsClassName() {
  const allDataFromSync = await getDataFromSync();
  const links = allDataFromSync.links;

  for (const linkObj of links) {
    if (linkObj.link === window.location.href) {
      return linkObj.className;
    }
  }
  return "";
}

// Update input fields with values from storage
async function updateChangesInAllTabs() {
  const infoElement = document.getElementById("info-message");
  try {
    const { intervalTime, scrollPixels, isScrolling } = await getDataFromSync();

    document.getElementById("scroll-interval-input").value = intervalTime;
    document.getElementById("scroll-distance-input").value = scrollPixels;
  } catch {
    infoElement.innerText = "Reload is Required";
  }
}

// Check if the current tab's URL is in the stored links
async function checkIfCurrentTabInLinks() {
  const {links} = await getDataFromSync();
  // const links = allDataFromSync.links;
  return links.some((linkObj) => linkObj.link === window.location.href);
}



// Function to create and add the control panel to the DOM
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
      #start-btn {
          background-color: #87ca02;
          cursor: pointer;
          padding: 10px 20px;
          font-size: 16px;
          border: 0px;
          border-radius: 5px;
          transition: all 0.2s;
          font-weight: 700;
      }
      #stop-btn{
          background-color: #c22727;
          cursor: pointer;
          padding: 10px 20px;
          font-size: 16px;
          border: 0px;
          border-radius: 5px;
          transition: all 0.2s;
          font-weight: 700;
      }
      #start-btn:hover {
          background-color: #6b9713;
          color: white;
      }
      #stop-btn:hover {
          background-color: #ad1a1a;
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
      #twoarrows{
      font-size:20px;
      }
  </style>
    <div id="control-panel-for-scroll">
      <div class="arrowbox" id="hide-show-button">
          <span id="twoarrows">&gt;&gt;</span>
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
      <div class="flex">
      <button id="start-btn">Start</button>
      <button id="stop-btn">Stop</button>
      </div>
    </div>
  `; // Keep the existing HTML structure
  document.body.appendChild(div);
}

// Function to alert the user with a message for a specified duration
async function alertUser(alertMessage, timeOfView = 3) {
  const infoElement = document.getElementById("info-message");
  infoElement.innerText = alertMessage;
  infoElement.style.opacity = "100";

  setTimeout(() => {
    infoElement.innerText = "Info";
    infoElement.style.opacity = "0";
  }, timeOfView * 1000);
}

// Control panel script to handle interactions and update values
async function controlPanelScript() {
  if (!document.querySelector("#control-panel-for-scroll")) {
    await addControlPanel();

    const allDataFromSync = await getDataFromSync();
    const scrollIntervalElement = document.getElementById(
      "scroll-interval-input"
    );
    const scrollDistanceElement = document.getElementById(
      "scroll-distance-input"
    );

    scrollIntervalElement.value = allDataFromSync.intervalTime;
    scrollDistanceElement.value = allDataFromSync.scrollPixels;

    // Event listeners for buttons
    document
      .getElementById("save-button")
      .addEventListener("click", async () => {
        const newInterval = parseFloat(scrollIntervalElement.value);
        const newDistance = parseFloat(scrollDistanceElement.value);
        if (newInterval > 0) {
          if (
            newDistance !== allDataFromSync.scrollPixels ||
            newInterval !== allDataFromSync.intervalTime
          ) {
            await chrome.storage.sync.set({
              scrollPixels: newDistance,
              intervalTime: newInterval,
            });
            await alertUser(
              `Settings saved: Distance: ${newDistance}, Interval: ${newInterval}`
            );
          } else {
            await alertUser("No Changes Made");
          }
        } else {
          await alertUser("Please Enter Positive Value");
        }
      });

    document
      .getElementById("reset-button")
      .addEventListener("click", async () => {
        await chrome.storage.sync.set({ scrollPixels: 500, intervalTime: 10 });
        const data = await getDataFromSync();
        await alertUser(
          `Values reset to default: Distance: ${data.scrollPixels}, Interval: ${data.intervalTime}`
        );
        scrollIntervalElement.value = data.intervalTime;
        scrollDistanceElement.value = data.scrollPixels;
      });

    document.getElementById("refresh-button").addEventListener("click", () => {
      chrome.runtime.sendMessage({ action: "loadTabs" });
    });

    const hideShowButton = document.getElementById("hide-show-button");

    const { isInView } = await getDataFromSync();
    // Track mouse events to determine if the panel should hide
    let isMouseOverPanel = false;
    const controlPanel = document.getElementById("control-panel-for-scroll");

    // Add mouse enter and leave event listeners
    controlPanel.addEventListener("mouseenter", () => {
      isMouseOverPanel = true;
    });

    controlPanel.addEventListener("mouseleave", () => {
      isMouseOverPanel = false;
    });

    // Check if the mouse is over the control panel during scrolling
    document.addEventListener("mousemove", async (event) => {
      // Only check for hiding if the panel is currently visible
      chrome.storage.sync.get("isInView", async (result) => {
        if (result.isInView) {
          if (!isMouseOverPanel) {
            const controlPanelRect = controlPanel.getBoundingClientRect();
            const mouseX = event.clientX;
            const mouseY = event.clientY;

            // If the mouse is outside the control panel, hide it
            if (
              mouseX < controlPanelRect.left ||
              mouseX > controlPanelRect.right ||
              mouseY < controlPanelRect.top ||
              mouseY > controlPanelRect.bottom
            ) {
              controlPanel.style.right = "-250px";
              twoarrows.style.transform = "rotate(180deg)";
              // console.log("Hiding the control panel due to mouse movement");
              await updateVisibilityStateInStorage(false);
            }
          }
        }
      });
    });

    // Initial setup: Retrieve the visibility state from storage and set the panel's position
    chrome.storage.sync.get("isInView", (result) => {
      const twoarrows = document.getElementById("twoarrows");

      if (result.isInView) {
        controlPanel.style.right = "20px";
        twoarrows.style.transform = "rotate(0deg)";
      } else {
        controlPanel.style.right = "-250px";
        twoarrows.style.transform = "rotate(180deg)";
      }
    });

    // Event listener for the hide/show button
    hideShowButton.addEventListener("click", async () => {
      chrome.storage.sync.get("isInView", async (result) => {
        const isInView = result.isInView;
        if (isInView) {
          // Hide the control panel only if the mouse is not over it
          if (!isMouseOverPanel) {
            controlPanel.style.right = "-250px";
            twoarrows.style.transform = "rotate(180deg)";
            // console.log("Hiding the control panel");
            await updateVisibilityStateInStorage(false);
          }
        } else {
          // Show the control panel
          controlPanel.style.right = "20px";
          twoarrows.style.transform = "rotate(0deg)";
          // console.log("Showing the control panel");
          await updateVisibilityStateInStorage(true);
          await hidePanelAfterDelay();
        }
      });
    });

    document.getElementById("start-btn").addEventListener("click", async () => {
      await startScrolling();
    });

    document.getElementById("stop-btn").addEventListener("click", async () => {
      await stopScrolling();
    });
  }
}

async function hidePanelAfterDelay() {
  // Clear any existing timeout if the button is clicked before 5 seconds
  clearTimeout(hideTimeout);
  const { isInView } = await getDataFromSync();
  const controlPanel = document.getElementById("control-panel-for-scroll");
  const twoarrows = document.getElementById("twoarrows");

  if (isInView) {
    hideTimeout = setTimeout(async () => {
      controlPanel.style.right = "-250px";
      twoarrows.style.transform = "rotate(180deg)";
      await updateVisibilityStateInStorage(false);
    }, hidetimeinseconds); // 5 seconds delay
  }
}

// Logic to handle tab visibility changes
async function onTabVisible() {
  console.log("Inside the On tab visible")
  const {isScrolling} = await getDataFromSync()

  const isCurrentTabInLinks = await checkIfCurrentTabInLinks();

  if (isCurrentTabInLinks) {
    console.log("Current tab is in links");
    
    await controlPanelScript();
    await updateChangesInAllTabs();

    if (isScrolling){
      await startScrolling()
    }else{
      await stopScrolling()
    }
  }
  
  // if(scrollingIntervalId){
  //   await stopScrolling()
  // }else{
  //   console.log("This Window Was Not Scrolling, so kept as it is")
  // }
  // console.log("Tab is hidden scrolling stopped");

  // const isCurrentTabInLinks = await checkIfCurrentTabInLinks();
  // if (isCurrentTabInLinks) {
  //   await controlPanelScript();
  //   await updateChangesInAllTabs();
  //   console.log("Control panel Added, Updated all tabs")
  //   await onStartFunction();
  // }
}

async function onStartFunction() {
  console.log("On start function is running")
  const data = await getDataFromSync(); // Get the current data from storage
  const isScrolling = data.isScrolling;

  // Update the info message based on the scrolling state from storage
  const infoElement = document.getElementById("info-message");
  infoElement.innerText = `Scroll is : ` + (isScrolling ? 'On' : 'Off');
  infoElement.style.opacity = "100";

  if (isScrolling) {
    // console.log("Starting scrolling based on stored state...");
    if (scrollingIntervalId){
      clearInterval(scrollingIntervalId)
      scrollingIntervalId = null
    }
    await startScrolling(); // Start scrolling if true
  } else {
    console.log("IsScrolling is Off, No action taken");
  }
}

async function startScrolling() {
  // console.log("Attempting to start scrolling...");
  if (scrollingIntervalId === null) {
    await updateScrollingStateInStorage(true);
    // console.log("Scrolling Started");

    const { scrollPixels, intervalTime, isScrolling } = await getDataFromSync();
    const classNameOfCurrentTab = await getCurrentTabsClassName();

    // console.log(scrollPixels, intervalTime, classNameOfCurrentTab);

    scrollingIntervalId = startScrollingWithClassNameScrollStepInterval(
      classNameOfCurrentTab,
      scrollPixels,
      intervalTime
    );
    console.log("Scrolling Interval ID:", scrollingIntervalId);

    // Update the info message to show scrolling status
    const infoElement = document.getElementById("info-message");
    infoElement.innerText = `Scroll is : ` + (isScrolling ? 'On' : 'Off');
    infoElement.style.opacity = "100";
  } else {
    console.log("Scrolling already started");
  }
}

async function stopScrolling() {
  console.log("Inside Stop Scrolling Function");
  if (scrollingIntervalId) {
    console.log("Stopping Scroll Interval ID:", scrollingIntervalId);
    clearInterval(scrollingIntervalId);
    scrollingIntervalId = null;

    await updateScrollingStateInStorage(false);

    const { isScrolling } = await getDataFromSync();
    // Update the info message to show scrolling status
    const infoElement = document.getElementById("info-message");
    infoElement.innerText = `Scroll is : ` + (isScrolling ? 'On' : 'Off');
    infoElement.style.opacity = "100";
  } else {
    console.log("Scrolling is already off");
  }
}

// Add event listeners for visibility changes
document.addEventListener("visibilitychange", async () => {
  // await onTabVisible();
  // console.log("ON Tab Function is running")
  if (document.hidden) {
    console.log("Hidden Run Hidden Tasks")
    await stopScrolling()
    console.log("-------------------------------")
  }
  else{
    console.log("Visible Run Visible Tasks")
    await onTabVisible()
    console.log("-------------------------------")
  }

});

async function InitialFunction() {
  await onTabVisible();
}

// Initial script execution
console.log("Outside function is running")
InitialFunction(); // Check visibility on load
console.log("-------------------------------")


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startScrolling") {
    // Call your scrolling function here
    startScrolling();
  }
});
