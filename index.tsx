/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoogleGenAI, Type } from "@google/genai";

// --- CONFIGURATION ---
const API_KEY = process.env.API_KEY;

// FIX: Add 'as const' to enable type narrowing for config properties.
const CONFIG_FIELDS = {
    cameraMovement: {
        label: "Camera Movement",
        type: "select",
        options: ["Static", "Pan", "Tilt", "Zoom", "Dolly", "Handheld", "Crane", "Steadicam", "Drone"],
    },
    lightingMode: {
        label: "Lighting Mode",
        type: "select",
        options: ["Natural", "Studio", "Backlit", "Low-key", "High-key", "Cinematic", "Ambient", "Hard Light"],
    },
    mood: {
        label: "Mood",
        type: "select",
        options: ["Cheerful", "Dramatic", "Calm", "Mysterious", "Romantic", "Tense", "Nostalgic", "Epic"],
    },
    colorPalette: {
        label: "Color Palette",
        type: "select",
        options: ["Warm", "Cool", "Monochrome", "Pastel", "Vibrant", "Muted", "Sepia", "Neon"],
    },
    subjectFocus: {
        label: "Subject Focus",
        type: "select",
        options: ["Face", "Full Body", "Object", "Group", "Macro", "Wide Shot", "Close-up", "Medium Shot"],
    },
    environmentalDetails: {
        label: "Environmental Details",
        type: "text",
        placeholder: "e.g., foggy morning, neon-lit city",
    },
    background: {
        label: "Background",
        type: "text",
        placeholder: "e.g., bustling market, serene forest",
    },
} as const;

// --- DOM ELEMENTS CACHE ---
const dom = {
    root: document.getElementById("root"),
    promptInput: null as HTMLTextAreaElement | null,
    enhanceButton: null as HTMLButtonElement | null,
    jsonOutput: null as HTMLElement | null,
    copyButton: null as HTMLButtonElement | null,
    downloadButton: null as HTMLButtonElement | null,
    configControls: {} as Record<string, HTMLSelectElement | HTMLInputElement>,
};

// --- CORE APPLICATION LOGIC ---

/**
 * Initializes the GoogleGenAI client.
 */
const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Dynamically creates and appends a UI element.
 */
function createElement<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    options: {
        parent?: HTMLElement;
        className?: string;
        id?: string;
        textContent?: string;
        innerHTML?: string;
    }
): HTMLElementTagNameMap[K] {
    const el = document.createElement(tag);
    if (options.className) el.className = options.className;
    if (options.id) el.id = options.id;
    if (options.textContent) el.textContent = options.textContent;
    if (options.innerHTML) el.innerHTML = options.innerHTML;
    if (options.parent) options.parent.appendChild(el);
    return el;
}

/**
 * Builds the entire application UI.
 */
function buildUI() {
    if (!dom.root) return;
    dom.root.innerHTML = ''; // Clear existing content

    const header = createElement('header', { parent: dom.root });
    createElement('h1', { parent: header, textContent: 'Prompt to JSON Generator' });
    createElement('p', { parent: header, textContent: 'Craft the perfect video prompt with AI assistance.' });

    // 1. Prompt Input Section
    const promptCard = createElement('section', { parent: dom.root, className: 'card' });
    createElement('h2', { parent: promptCard, textContent: '1. Enter Your Prompt' });
    dom.promptInput = createElement('textarea', {
        parent: promptCard,
        id: 'prompt-input',
    });
    dom.promptInput.placeholder = "e.g., A lone astronaut discovers a glowing alien artifact on a desolate Mars landscape.";
    dom.enhanceButton = createElement('button', {
        parent: promptCard,
        id: 'enhance-button',
        className: 'button button-primary',
        textContent: 'Enhance with AI',
    });

    // 2. Configuration Section
    const configCard = createElement('section', { parent: dom.root, className: 'card' });
    createElement('h2', { parent: configCard, textContent: '2. Fine-Tune Configuration' });
    const configGrid = createElement('div', { parent: configCard, className: 'config-grid' });

    for (const [key, config] of Object.entries(CONFIG_FIELDS)) {
        const fieldContainer = createElement('div', { parent: configGrid });
        // FIX: The 'for' attribute must be set as the 'htmlFor' property after element creation.
        const label = createElement('label', { parent: fieldContainer, textContent: config.label });
        label.htmlFor = `config-${key}`;


        if (config.type === 'select') {
            const select = createElement('select', { parent: fieldContainer, id: `config-${key}` });
            // FIX: The 'value' property must be set after element creation.
            const defaultOption = createElement('option', { parent: select, textContent: '' }); // Default empty option
            defaultOption.value = '';
            config.options.forEach(option => {
                // FIX: The 'value' property must be set after element creation.
                const opt = createElement('option', { parent: select, textContent: option });
                opt.value = option;
            });
            dom.configControls[key] = select;
        } else {
            // FIX: The 'type' property must be set after element creation.
            const input = createElement('input', { parent: fieldContainer, id: `config-${key}` });
            input.type = 'text';
            if (config.placeholder) input.placeholder = config.placeholder;
            dom.configControls[key] = input;
        }
    }

    // 3. JSON Output Section
    const outputCard = createElement('section', { parent: dom.root, className: 'card' });
    createElement('h2', { parent: outputCard, textContent: '3. Get Your JSON' });
    dom.jsonOutput = createElement('pre', {
        parent: outputCard,
        id: 'json-output-container',
        innerHTML: '<code id="json-output"></code>'
    });
    const actionsContainer = createElement('div', { parent: outputCard, className: 'output-actions' });
    dom.copyButton = createElement('button', { parent: actionsContainer, className: 'button button-secondary', textContent: 'Copy JSON' });
    dom.downloadButton = createElement('button', { parent: actionsContainer, className: 'button button-secondary', textContent: 'Download as .txt' });
}


/**
 * Gathers current values from all inputs and generates the JSON output.
 */
function generateAndDisplayJSON() {
    if (!dom.jsonOutput) return;

    const output: { prompt?: string } & Record<string, string> = {};

    // Add the main prompt if it has a value
    const promptValue = dom.promptInput?.value.trim();
    if (promptValue) {
        output.prompt = promptValue;
    }

    // Add config fields if they have a value
    for (const key in dom.configControls) {
        const value = dom.configControls[key].value.trim();
        if (value) {
            output[key] = value;
        }
    }

    const jsonString = JSON.stringify(output, null, 2);
    dom.jsonOutput.querySelector('code')!.textContent = jsonString;
}

/**
 * Handles the "Enhance with AI" button click.
 */
async function handleEnhanceClick() {
    if (!dom.promptInput || !dom.enhanceButton) return;

    const prompt = dom.promptInput.value.trim();
    if (!prompt) {
        alert("Please enter a prompt first.");
        return;
    }

    // Set loading state
    dom.enhanceButton.disabled = true;
    dom.enhanceButton.textContent = 'Enhancing...';

    try {
        // Define the expected JSON schema for the AI response
        const schema = {
            type: Type.OBJECT,
            properties: Object.fromEntries(
                Object.entries(CONFIG_FIELDS).map(([key, config]) => [
                    key,
                    {
                        type: Type.STRING,
                        description: `Suggest a value for ${config.label}. ${config.type === 'select' ? 'Choose one of: ' + config.options.join(', ') : ''}`
                    }
                ])
            ),
        };

        // Call the Gemini API
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Analyze this video prompt and extract the relevant parameters according to the schema. Prompt: "${prompt}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });

        const enhancedData = JSON.parse(response.text);

        // Update the UI with the AI-suggested values
        for (const [key, value] of Object.entries(enhancedData)) {
            if (dom.configControls[key] && typeof value === 'string') {
                dom.configControls[key].value = value;
            }
        }

    } catch (error) {
        console.error("Error enhancing prompt:", error);
        alert("An error occurred while enhancing the prompt. Please check the console for details.");
    } finally {
        // Unset loading state and update JSON
        generateAndDisplayJSON();
        dom.enhanceButton.disabled = false;
        dom.enhanceButton.textContent = 'Enhance with AI';
    }
}

/**
 * Copies the generated JSON to the clipboard.
 */
function handleCopyClick() {
    if (!dom.jsonOutput || !dom.copyButton) return;
    const jsonText = dom.jsonOutput.querySelector('code')!.textContent || '';
    navigator.clipboard.writeText(jsonText).then(() => {
        const originalText = dom.copyButton!.textContent;
        dom.copyButton!.textContent = 'Copied!';
        setTimeout(() => {
            dom.copyButton!.textContent = originalText;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy JSON:', err);
        alert('Failed to copy JSON.');
    });
}

/**
 * Downloads the generated JSON as a .txt file.
 */
function handleDownloadClick() {
    if (!dom.jsonOutput) return;
    const jsonText = dom.jsonOutput.querySelector('code')!.textContent || '';
    const blob = new Blob([jsonText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prompt.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Attaches all necessary event listeners.
 */
function attachEventListeners() {
    // Update JSON in real-time when any input changes
    dom.promptInput?.addEventListener('input', generateAndDisplayJSON);
    for (const key in dom.configControls) {
        dom.configControls[key].addEventListener('input', generateAndDisplayJSON);
    }

    // Main action buttons
    dom.enhanceButton?.addEventListener('click', handleEnhanceClick);
    dom.copyButton?.addEventListener('click', handleCopyClick);
    dom.downloadButton?.addEventListener('click', handleDownloadClick);
}

/**
 * Main application entry point.
 */
function main() {
    buildUI();
    attachEventListeners();
    generateAndDisplayJSON(); // Initial empty state
}

// Run the app
main();
