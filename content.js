function getSelectedText() {
    return window.getSelection().toString();
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Content script received message:', request, 'from', sender);
    if (request && request.action === "getSelectedText") {
        const selectedText = getSelectedText();
        console.log('Content script selected text:', selectedText);
        // sendResponse can be synchronous here because we're returning immediately
        sendResponse({ text: selectedText });
    }
    // Return true if you plan to send a response asynchronously. We don't need it here.
    return false;
});