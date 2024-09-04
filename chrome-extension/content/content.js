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
    chatContainer.style.display = 'none'; // Initially hide the container

    document.getElementById('ai-assistant-close').addEventListener('click', toggleAssistant);
    document.getElementById('ai-assistant-send').addEventListener('click', sendMessage);
    document.getElementById('ai-assistant-user-input').addEventListener('keypress', function(e) {
      if (e.key === 'Enter') sendMessage();
    });
  }

  function toggleAssistant() {
    console.log("toggleAssistant called, current state:", assistantActive);
    if (!chatContainer) {
      console.log("Creating assistant interface");
      createAssistantInterface();
    }
    assistantActive = !assistantActive;
    console.log("Setting display to:", assistantActive ? 'flex' : 'none');
    chatContainer.style.display = assistantActive ? 'flex' : 'none';
    console.log("New state:", assistantActive);
  }

  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log("Message received in content script:", request);
    if (request.action === "toggleAssistant") {
      console.log("Toggling assistant");
      try {
        toggleAssistant();
        console.log("Assistant toggled successfully");
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
      const videoInfo = getVideoInfo();
      console.log('Sending video info:', videoInfo);
      addMessageToChat('user', message);
      input.value = '';
      chrome.runtime.sendMessage({
        action: "processMessage", 
        message: message,
        videoInfo: videoInfo
      }, function(response) {
        if (chrome.runtime.lastError) {
          console.error("Error sending message to background script:", chrome.runtime.lastError);
          addMessageToChat('assistant', "Error processing your request.");
        } else {
          addMessageToChat('assistant', response.reply);
        }
      });
    }
  }

  function getVideoInfo() {
    const videoElement = document.querySelector('video');
    let title = 'Unknown';
    let type = 'Unknown';
    let episode = null;
    let season = null;

    // Netflix-specific selectors
    const netflixDataTitle = document.querySelector('[data-uia="video-title"], [data-uia="player-title"]');
    const netflixEpisodeTitle = document.querySelector('[data-uia="episode-title"]');
    const netflixSeasonTitle = document.querySelector('.season-title');

    // Max-specific selectors
    const maxTitleElement = document.querySelector('.css-1dbjc4n.r-1awozwy.r-18u37iz.r-1777fci h1');
    const maxEpisodeElement = document.querySelector('.css-901oao.css-cens5h.r-1kihuf0.r-1b43r93.r-b88u0q.r-1cwl3u0.r-q4m81j');

    if (netflixDataTitle) {
      // Netflix
      title = netflixDataTitle.textContent.trim();
      type = netflixSeasonTitle ? 'TV Show' : 'Movie';
      episode = netflixEpisodeTitle ? netflixEpisodeTitle.textContent.trim() : null;
      season = netflixSeasonTitle ? netflixSeasonTitle.textContent.trim() : null;
    } else if (maxTitleElement) {
      // Max
      title = maxTitleElement.textContent.trim();
      type = maxEpisodeElement ? 'TV Show' : 'Movie';
      if (maxEpisodeElement) {
        const episodeInfo = maxEpisodeElement.textContent.trim().split(' • ');
        if (episodeInfo.length > 1) {
          season = episodeInfo[0];
          episode = episodeInfo[1];
        }
      }
    }

    const info = {
      title,
      type,
      episode,
      season,
      currentTime: videoElement ? videoElement.currentTime : 0,
      duration: videoElement ? videoElement.duration : 0
    };

    console.log('Video info:', info);
    return info;
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
  function addVideoEventListeners() {
    document.addEventListener('play', handleVideoEvent, true);
    document.addEventListener('pause', handleVideoEvent, true);
  }

  function handleVideoEvent(e) {
    if (e.target.tagName.toLowerCase() === 'video') {
      const message = {
        action: "videoEvent",
        event: e.type,
        currentTime: e.target.currentTime
      };

      function sendMessage() {
        if (chrome.runtime && chrome.runtime.id) {
          chrome.runtime.sendMessage(message, response => {
            if (chrome.runtime.lastError) {
              console.error("Error sending video event:", chrome.runtime.lastError.message);
              if (chrome.runtime.lastError.message.includes("Extension context invalidated")) {
                console.log("Extension context invalidated. Attempting to reconnect...");
                setTimeout(sendMessage, 1000); // Try again after 1 second
              }
            } else {
              console.log("Video event sent successfully:", message);
            }
          });
        } else {
          console.log("Extension context not available. Attempting to reconnect...");
          setTimeout(sendMessage, 1000); // Try again after 1 second
        }
      }

      sendMessage();
    }
  }

  addVideoEventListeners();

  // Periodically check if the extension context is still valid
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;

  function checkExtensionContext() {
    if (!chrome.runtime || !chrome.runtime.id) {
      console.log("Extension context lost. Attempting to reconnect...");
      reconnectAttempts++;
      if (reconnectAttempts > maxReconnectAttempts) {
        console.log("Max reconnect attempts reached. Reloading page...");
        window.location.reload();
      } else {
        setTimeout(checkExtensionContext, 1000);
      }
    } else {
      reconnectAttempts = 0;
    }
  }

  setInterval(checkExtensionContext, 5000);
}

