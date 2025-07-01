document.addEventListener('DOMContentLoaded', () => {
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      let firstName = user.displayName ? user.displayName.split(" ")[0] : "User";
      document.getElementById("dashboard-username").textContent = firstName;
    } else {
      document.getElementById("dashboard-username").textContent = "Guest";
    }
  });

  const chatMessages = document.querySelector('.chat-messages');
  const messageInput = document.querySelector('.message-input');
  const sendButton = document.querySelector('.send-message');
  const apiUrl = 'http://localhost:8000/ask';
  
  // Initialize conversation history
  let conversationHistory = [];
  
  // Add initial bot message
  const welcomeMessage = "Hello! I'm your Python learning assistant. I can help you with Python concepts, debug your code, or answer any programming questions you have. How can I help you today?";
  addMessage(welcomeMessage, 'bot');
  conversationHistory.push({ role: "assistant", content: welcomeMessage });

  // Send message function
  async function sendMessage() {
    const message = messageInput.value.trim();
    if (message === '') return;
  
    // Disable input and button while processing
    messageInput.disabled = true;
    sendButton.disabled = true;
    sendButton.classList.add('processing');
    sendButton.textContent = 'Processing...'; // Visual feedback
  
    // Add user message
    addMessage(message, 'user');
    messageInput.value = '';
    messageInput.style.height = 'auto';
    
    conversationHistory.push({ role: "user", content: message });
    
    const typingIndicator = document.createElement('div');
    typingIndicator.classList.add('message', 'bot', 'typing-indicator');
    typingIndicator.innerHTML = '<span></span><span></span><span></span>';
    chatMessages.appendChild(typingIndicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  
    try {
      const botResponse = await getBotResponseFromAPI(message, conversationHistory);
      chatMessages.removeChild(typingIndicator);
      
      const finalResponse = botResponse && typeof botResponse === 'string' 
        ? botResponse 
        : "I couldn’t process that properly. Can you try again?";
      
      addMessage(finalResponse, 'bot');
      conversationHistory.push({ role: "assistant", content: finalResponse });
      
      if (conversationHistory.length > 20) {
        const trimmedHistory = [
          conversationHistory[0],
          { role: "system", content: "Some earlier messages have been summarized to save space." }
        ];
        trimmedHistory.push(...conversationHistory.slice(conversationHistory.length - 10));
        conversationHistory = trimmedHistory;
      }
    } catch (error) {
      chatMessages.removeChild(typingIndicator);
      const errorMessage = "Sorry, I’m having trouble connecting right now. Please try again later.";
      addMessage(errorMessage, 'bot');
      conversationHistory.push({ role: "assistant", content: errorMessage });
      console.error('Send Message Error:', error);
    } finally {
      // Re-enable input and button after processing
      messageInput.disabled = false;
      sendButton.disabled = false;
      sendButton.classList.remove('processing');
      sendButton.textContent = 'Send'; // Reset button text
      messageInput.focus(); // Refocus the input for better UX
    }
  }

  // Add message to chat with enhanced formatting
  function addMessage(content, type) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', type);
    
    if (type === 'bot') {
      // Remove unwanted triple quotes
      let cleanContent = content.replace(/^"""|"""$/g, '').trim();
      let formattedContent = marked.parse(cleanContent);
      
      // Process code blocks without escaping HTML entities inside the code
      formattedContent = formattedContent.replace(/<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g, 
        (match, language, code) => {
          // Decode HTML entities that might have been encoded by marked.js
          const decodedCode = code
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&');
          return `<div class="code-block-container">
                    <div class="code-block-header">
                      <span class="code-language">${language || 'code'}</span>
                      <button class="copy-button" onclick="copyCode(this)">Copy</button>
                    </div>
                    <pre><code class="language-${language}">${decodedCode}</code></pre>
                  </div>`;
        });
      
      formattedContent = formattedContent.replace(/(^|\n)(Bug|Solution|Explanation|Output|Tip|Note):/g, 
        '$1<div class="section-header">$2:</div>');
      
      formattedContent = formattedContent.replace(/<p>/g, '<p style="margin-bottom: 0.75rem;">');
      formattedContent = formattedContent.replace(/<ul>/g, '<ul style="list-style: disc; margin-left: 1.5rem; margin-bottom: 0.75rem;">');
      formattedContent = formattedContent.replace(/<ol>/g, '<ol style="list-style: decimal; margin-left: 1.5rem; margin-bottom: 0.75rem;">');
      
      messageElement.innerHTML = formattedContent;
    } else {
      // Apply escapeHtml only to user messages
      messageElement.textContent = escapeHtml(content);
    }
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    if (type === 'bot') {
      messageElement.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
      });
    }
  }

  // HTML escape function to prevent XSS
  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, "'");
  }



  // Get response from API with conversation history
  async function getBotResponseFromAPI(message, history) {
    try {
      const lastMessages = history.slice(-5);
      
      const fullQuestion = {
        question: message,
        history: lastMessages
      };
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fullQuestion)
      });

      if (!response.ok) {
        if (response.status === 422) {
          return await getLegacyBotResponseFromAPI(message);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.answer;
    } catch (error) {
      console.error('API Error:', error);
      return await getLegacyBotResponseFromAPI(message);
    }
  }
  
  // Legacy API endpoint (without history support)
  async function getLegacyBotResponseFromAPI(message) {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question: message })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.answer;
    } catch (error) {
      console.error('Legacy API Error:', error);
      return getFallbackResponse(message, conversationHistory);
    }
  }

  // Fallback response logic with history awareness
  function getFallbackResponse(message, history) {
    const lowerMessage = message.toLowerCase();
    
    const responses = {
      'hello': "Hi there! How can I help you with Python today?",
      'help': "I can help you with Python concepts, debugging, best practices, and more. What would you like to know?",
      'variables': "In Python, variables are containers for storing data values. Here's an example:\n```python\n# Variable assignment\nx = 5\nname = 'Python'\nis_active = True\n```",
      'loops': "Python has two main types of loops:\n```python\n# For loop\nfor i in range(5):\n    print(i)\n\n# While loop\ncount = 0\nwhile count < 5:\n    print(count)\n    count += 1\n```",
      'functions': "Functions in Python are defined using the 'def' keyword:\n```python\ndef greet(name):\n    return f'Hello, {name}!'\n\n# Function call\nresult = greet('Python')\nprint(result)  # Output: Hello, Python!\n```"
    };

    if (history.length > 1) {
      if (lowerMessage.includes("how") && !lowerMessage.includes("how do i") && !lowerMessage.includes("how to")) {
        return "Could you please be more specific about what aspect you'd like me to explain further?";
      }
      
      if (lowerMessage.includes("why")) {
        return "To give you the most accurate answer, could you specify exactly what you're curious about?";
      }
      
      if (lowerMessage.length < 15 && !lowerMessage.includes("?")) {
        return "Could you provide more detail about what you'd like to know regarding " + lowerMessage + "?";
      }
    }

    for (const [keyword, response] of Object.entries(responses)) {
      if (lowerMessage.includes(keyword)) {
        return response;
      }
    }

    return "I understand you're asking about Python. Could you please provide more details about what you'd like to learn?";
  }

  // Event listeners
  sendButton.addEventListener('click', sendMessage);

  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Auto-resize textarea
  messageInput.addEventListener('input', () => {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 150) + 'px';
  });
  
  // Clear chat functionality (if you add a clear button in HTML)
  const clearChatButton = document.querySelector('.clear-chat');
  if (clearChatButton) {
    clearChatButton.addEventListener('click', () => {
      while (chatMessages.firstChild) {
        chatMessages.removeChild(chatMessages.firstChild);
      }
      
      conversationHistory = [{ role: "assistant", content: welcomeMessage }];
      addMessage(welcomeMessage, 'bot');
    });
  }
});

// Copy code function
window.copyCode = function(button) {
  const preElement = button.closest('.code-block-container').querySelector('pre');
  const code = preElement.textContent;
  
  navigator.clipboard.writeText(code).then(() => {
    // Wrap the original text in a span if not already done
    if (!button.querySelector('span')) {
      const text = button.textContent;
      button.textContent = '';
      const span = document.createElement('span');
      span.textContent = text;
      button.appendChild(span);
    }
    
    button.classList.add('copied');
    
    setTimeout(() => {
      button.classList.remove('copied');
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy text: ', err);
  });
};