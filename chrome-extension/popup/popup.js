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
      if (currentTab.url.includes('netflix.com') || currentTab.url.includes('max.com')) {
        console.log("Supported site detected, injecting content script");
        chrome.scripting.executeScript({
          target: { tabId: currentTab.id },
          files: ['chrome-extension/content/content.js']
        }).then(() => {
          console.log('Content script injected, sending toggle message');
          chrome.tabs.sendMessage(currentTab.id, {action: "toggleAssistant"}, function(response) {
            if (chrome.runtime.lastError) {
              console.error("Error sending message:", chrome.runtime.lastError.message);
            } else {
              console.log("Message sent successfully", response);
            }
          });
        }).catch(err => {
          console.error('Error injecting content script:', err);
        });
      } else {
        console.log("Not on a supported site");
        // Optionally, update the popup UI to inform the user
      }
    });
  });
});
