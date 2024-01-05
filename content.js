console.log('Content script is running.');

async function executeScript() {
  chrome.runtime.sendMessage({ action: 'showLoading' });
  try {
    const selectedText = window.getSelection().toString();
    const OPENAI_API_KEY = 'OPENAI-KEY'; // Replace with your actual API key
    const generatedEmail = await generateEmailWithOpenAI(selectedText, OPENAI_API_KEY);

    // Identify the focused element based on its properties
    const focusedElement = document.activeElement;

    // Log the focused element to help diagnose the issue
    console.log('Focused Element:', focusedElement);

    // Check if the focused element is a valid input element
    if (focusedElement && (focusedElement.tagName === 'TEXTAREA' || (focusedElement.tagName === 'INPUT' && focusedElement.type === 'text'))) {
      focusedElement.value += generatedEmail;  // For input elements
    } else if (focusedElement && focusedElement.isContentEditable) {
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(generatedEmail));  // For contenteditable elements
    } else {
      console.warn('No suitable element found to paste the generated email.');
    }

    // Clear the selection (delete the original text)
    window.getSelection().removeAllRanges();

    // Notify the background script that the text has been pasted
    chrome.runtime.sendMessage({ action: 'textPasted' });
  } catch (error) {
    console.error('Error generating email with OpenAI:', error);
    chrome.runtime.sendMessage({ action: 'showError', error: error.message });
  }
}


function waitForBackgroundScript() {
  return new Promise((resolve) => {
    const intervalId = setInterval(() => {
      if (chrome.runtime.connect) {
        clearInterval(intervalId);
        resolve();
      }
    }, 100);
  });
}

waitForBackgroundScript().then(() => {
  chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
    if (request.action === 'executeScript') {
      executeScript();
    }
  });
});

async function generateEmailWithOpenAI(description, apiKey) {
  const openaiEndpoint = 'https://api.openai.com/v1/chat/completions'; // GPT-3.5 Turbo endpoint
  const prompt = `Write the contents of an email with the following description, withoout the subject:\n\n${description}\n\n`;
  const requestBody = {
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: prompt }
    ],
    max_tokens: 1029
  };

  try {
    const response = await fetch(openaiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`OpenAI API request failed with status: ${response.status}`);
    }

    const responseData = await response.json();
    return responseData.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating email with OpenAI:', error);
    throw error;
  }
}

// Log a message to confirm that the content script is running
console.log('Content script is running.');
