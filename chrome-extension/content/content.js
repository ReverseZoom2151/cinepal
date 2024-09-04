if (!window.hasRun) {
  window.hasRun = true;

  console.log("Content script loaded for Video AI Assistant");

  let assistantActive = false;
  let chatContainer = null;

  function createAssistantInterface() {
    chatContainer = document.createElement('div');
    chatContainer.id = 'ai-assistant-container';
    chatContainer.innerHTML = `
      <div id="ai-assistant-header">
        <h3>AI Assistant</h3>
        <button id="ai-assistant-close">×</button>
      </div>
      <div id="ai-assistant-messages"></div>
      <div id="ai-assistant-input">
        <input type="text" id="ai-assistant-user-input" placeholder="Ask a question...">
        <button id="ai-assistant-send">Send</button>
      </div>
    `;
    document.body.appendChild(chatContainer);

    document.getElementById('ai-assistant-close').addEventListener('click', toggleAssistant);
    document.getElementById('ai-assistant-send').addEventListener('click', sendMessage);
    document.getElementById('ai-assistant-user-input').addEventListener('keypress', function(e) {
      if (e.key === 'Enter') sendMessage();
    });
  }

  function toggleAssistant() {
    console.log("toggleAssistant called, current state:", assistantActive);
    assistantActive = !assistantActive;
    if (assistantActive) {
      if (!chatContainer) createAssistantInterface();
      chatContainer.style.display = 'block';
    } else {
      if (chatContainer) chatContainer.style.display = 'none';
    }
    console.log("New state:", assistantActive);
  }

  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log("Message received in content script:", request);
    if (request.action === "toggleAssistant") {
      console.log("Toggling assistant");
      try {
        toggleAssistant();
        sendResponse({status: "Assistant toggled"});
      } catch (error) {
        console.error("Error toggling assistant:", error);
        sendResponse({status: "Error toggling assistant"});
      }
    }
    return true;  // Indicates that the response will be sent asynchronously
  });

  function sendMessage() {
    const input = document.getElementById('ai-assistant-user-input');
    const message = input.value.trim();
    if (message) {
      addMessageToChat('user', message);
      input.value = '';
      // Send message to background script for processing
      chrome.runtime.sendMessage({action: "processMessage", message: message}, function(response) {
        if (chrome.runtime.lastError) {
          console.error("Error sending message to background script:", chrome.runtime.lastError);
          addMessageToChat('assistant', "Error processing your request.");
        } else {
          addMessageToChat('assistant', response.reply);
        }
      });
    }
  }

  function addMessageToChat(sender, message) {
    const messagesContainer = document.getElementById('ai-assistant-messages');
    const messageElement = document.createElement('div');
    messageElement.classList.add('ai-assistant-message', sender);
    messageElement.textContent = message;
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Listen for video events
  document.addEventListener('play', function(e) {
    if (e.target.tagName.toLowerCase() === 'video') {
      try {
        chrome.runtime.sendMessage({action: "videoEvent", event: "play", currentTime: e.target.currentTime});
      } catch (error) {
        console.error("Error sending play event:", error);
      }
    }
  }, true);

  document.addEventListener('pause', function(e) {
    if (e.target.tagName.toLowerCase() === 'video') {
      try {
        chrome.runtime.sendMessage({action: "videoEvent", event: "pause", currentTime: e.target.currentTime});
      } catch (error) {
        console.error("Error sending pause event:", error);
      }
    }
  }, true);
}
