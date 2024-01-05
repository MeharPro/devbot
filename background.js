chrome.runtime.onInstalled.addListener(function () {
  chrome.contextMenus.create({
    id: 'writeEmailAI',
    title: 'Write an Email AI',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener(async function (info, tab) {
  if (info.menuItemId === 'writeEmailAI') {
    let selectedText = info.selectionText || '';

    if (!selectedText) {
      selectedText = prompt('Write an email with this description');
    }

    chrome.tabs.sendMessage(tab.id, { action: 'executeScript', selectedText });
  }
});

console.log('Background script is running.');
