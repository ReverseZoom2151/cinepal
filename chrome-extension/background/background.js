chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && 
      (tab.url.includes('netflix.com') || tab.url.includes('max.com'))) {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['chrome-extension/content/content.js']
    }).then(() => {
      console.log('Content script injected successfully');
    }).catch(err => {
      console.error('Error injecting content script:', err);
    });
  }
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "processMessage") {
    fetch('http://localhost:3000/api/ai-assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: request.message }),
    })
    .then(response => response.json())
    .then(data => {
      sendResponse({ reply: data.reply });
    })
    .catch(error => {
      console.error('Error:', error);
      sendResponse({ reply: "Sorry, I couldn't process your request." });
    });
    return true;  // Indicates that the response will be sent asynchronously
  } else if (request.action === "videoEvent") {
    console.log("Video event:", request.event, "at time:", request.currentTime);
    // Here you could process video events, update context, etc.
  }
});
