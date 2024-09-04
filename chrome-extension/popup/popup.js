document.addEventListener('DOMContentLoaded', function() {
  const toggleButton = document.getElementById('toggleAssistant');
  
  toggleButton.addEventListener('click', function() {
    console.log("Toggle button clicked");
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (chrome.runtime.lastError) {
        console.error("Error querying tabs:", chrome.runtime.lastError);
        return;
      }
      const currentTab = tabs[0];
      console.log("Current tab URL:", currentTab.url);
      if (currentTab.url && (currentTab.url.includes('netflix.com') || currentTab.url.includes('max.com'))) {
        console.log("Supported site detected, sending toggle message");
        chrome.tabs.sendMessage(currentTab.id, {action: "toggleAssistant"}, function(response) {
          if (chrome.runtime.lastError) {
            console.error("Error sending message:", chrome.runtime.lastError.message);
            // If the content script is not injected, inject it and try again
            chrome.scripting.executeScript({
              target: { tabId: currentTab.id },
              files: ['chrome-extension/content/content.js']
            }).then(() => {
              console.log('Content script injected, retrying toggle message');
              chrome.tabs.sendMessage(currentTab.id, {action: "toggleAssistant"}, function(retryResponse) {
                if (chrome.runtime.lastError) {
                  console.error("Error sending message after injection:", chrome.runtime.lastError.message);
                } else {
                  console.log("Message sent successfully after injection", retryResponse);
                }
              });
            }).catch(err => {
              console.error('Error injecting content script:', err);
            });
          } else {
            console.log("Message sent successfully", response);
          }
        });
      } else {
        console.log("Not on a supported site");
        // Optionally, update the popup UI to inform the user
      }
    });
  });
});
