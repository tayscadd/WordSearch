// Elements

const settingsForm = document.getElementById('settingsForm');
const urlTemplateInput = document.getElementById('urlTemplate');
const copyInputRadio = document.getElementById('openInIFrame');
const errorMessage = document.getElementById('ErrorMessage');
const successMessage = document.getElementById('SuccessMessage');


// ButtonElements
const saveButton = document.getElementById('saveButton');

// Functions

async function loadSettings() {
    console.debug('Loading settings...');
    const result = await chrome.storage.sync.get(['urlTemplate', 'openInIFrame']);
    console.debug('Loaded settings:', result);
    urlTemplateInput.value = result.urlTemplate || `https://www.merriam-webster.com/dictionary/{word}`;
    if (result.openInIFrame == null || result.openInIFrame === false) {
        copyInputRadio.value = false;
    } else {
        copyInputRadio.value = true;
    }
}

function validateUrlTemplate(template) {
    return template.includes('{word}');
}

async function saveSettings() {
    try {
        console.debug('Saving settings...');
        if (!validateUrlTemplate(urlTemplateInput.value)) {
            throw new Error('URL Template must include the placeholder {word}');
        }
        const urlTemplate = urlTemplateInput.value;
        const openInIFrame = copyInputRadio.value;
        await chrome.storage.sync.set({ urlTemplate, openInIFrame });
        console.debug('Settings saved:', { urlTemplate, openInIFrame });
    } catch (e) {
        console.error('Error saving settings:', e);
        showErrorMessage('Error saving settings: ' + e.message);
    }
}
// Event Listeners

let errorTimeoutId = null;

function showErrorMessage(text) {
    if (!errorMessage) return;
    if (errorTimeoutId) {
        clearTimeout(errorTimeoutId);
        errorTimeoutId = null;
    }
    errorMessage.textContent = text;

    errorTimeoutId = setTimeout(() => {
        errorMessage.textContent = '';
        errorTimeoutId = null;
    }, 15000);
}

let successTimeoutId = null;

function showSuccessMessage(text) {
    if (!successMessage) return;
    if (successTimeoutId) {
        clearTimeout(successTimeoutId);
        successTimeoutId = null;
    }
    successMessage.textContent = text;

    successTimeoutId = setTimeout(() => {
        successMessage.textContent = '';
        successTimeoutId = null;
    }, 15000);
}

console.debug('Popup script loaded');

document.addEventListener('DOMContentLoaded', loadSettings);

document.addEventListener('click', async (event) => {
    if (copyInputRadio && event.target === copyInputRadio) {
        event.preventDefault();
        const isChecked = copyInputRadio.value === 'true';
        copyInputRadio.value = !isChecked;
    }
    if (saveButton && event.target === saveButton) {
        event.preventDefault();
        saveButton.disabled = true;
        
        await saveSettings().then(() => {
            setTimeout(() => {
                saveButton.disabled = false;
                showSuccessMessage('Settings saved successfully!');
            }, 500);
        }).catch((e) => {
            saveButton.disabled = false;
            showErrorMessage('Error saving settings: ' + e.message);
        });
    }
});