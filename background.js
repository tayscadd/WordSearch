// This switch prevents background.js from creating multiple context menu items on extension reloads.
let menuExists = false;
try {
    if (!menuExists) {
        chrome.contextMenus.create({
            id: "wordSearchWord",
            title: "Search Word",
            contexts: ["selection"]
        });
        menuExists = true;
    } else {
        console.log('Context menu already exists.');
    }
} catch (error) {
    console.error('Error creating context menu:', error);
}

const currentSettings = {
    urlTemplate: 'https://www.merriam-webster.com/dictionary/{word}',
    openInIFrame: false
}

async function getUserSettings() {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(
            { urlTemplate: currentSettings.urlTemplate, openInIFrame: currentSettings.openInIFrame },
            (result) => {
                if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
                resolve({ urlTemplate: result.urlTemplate, openInIFrame: result.openInIFrame });
            }
        );
    });
}

function handleSearchAction(selectedText) {
    getUserSettings().then(settings => {
        const query = selectedText.replace(/\s+/g, '');
        const url = settings.urlTemplate.replace('{word}', encodeURIComponent(query));

        if (!settings.openInIFrame) {
            chrome.tabs.create({ url });
        } else {
            // Handle opening in an iframe
            console.error("Opening in an iframe is not implemented yet.");
        }
    });
}

// If a user clicks the context menu item
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "wordSearchWord" && info.selectionText) {
    handleSearchAction(info.selectionText);
  }
});

// If the user uses the keybind shortcut
chrome.commands.onCommand.addListener((command) => {
    if (command === "custom-keybind-search") {
        // Instead of just handling the search here, we ask the active tab's content script for the selected text.
        // Background scripts cannot directly access the DOM of web pages, so we must target the active tab.
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs || tabs.length === 0) {
                console.error('No active tab found to request selected text from.');
                return;
            }
            const tabId = tabs[0].id;
            chrome.tabs.sendMessage(tabId, { action: 'getSelectedText' }, (response) => {
                console.log('Response from content script:', response);
                if (chrome.runtime.lastError) {
                    // This often indicates there's no content script in the page or the tab is a chrome:// page.
                    console.error('chrome.runtime.lastError:', chrome.runtime.lastError.message);
                    return;
                }
                if (response && response.text) {
                    handleSearchAction(response.text);
                } else {
                    console.warn('No text received from content script.');
                }
            });
        });
    }
});

// // This listens for the fired message from above and handles the search call.
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//     if (request.action === "search" && request.text) {
//         handleSearchAction(request.text);
//     }
// });