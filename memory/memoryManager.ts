
import { GoogleGenAI } from '@google/genai';

class StorageError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'StorageError';
    }
}

const MEMORY_KEY_PREFIX = 'erica-ltm-';
const HISTORY_KEY_PREFIX = 'erica-history-';
const USER_ID = 'default_user'; // Static user ID for this single-user app

let ai: GoogleGenAI | null = null;

const getAi = () => {
    if (!ai) {
        if (!process.env.API_KEY) {
            console.error("API key not found for memory summarization.");
            return null;
        }
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
}

/**
 * Retrieves the long-term memory summary for a user.
 * @throws {StorageError} If localStorage cannot be accessed.
 */
export const getMemory = (): string | null => {
    try {
        return localStorage.getItem(`${MEMORY_KEY_PREFIX}${USER_ID}`);
    } catch (error) {
        console.error("Failed to retrieve memory:", error);
        throw new StorageError("Could not access browser storage to load past conversations. Your browser settings might be blocking it.");
    }
};

/**
 * Retrieves the raw conversation history for a user.
 * @throws {StorageError} If localStorage cannot be accessed.
 */
const getHistory = (): string[] => {
    try {
        const historyJson = localStorage.getItem(`${HISTORY_KEY_PREFIX}${USER_ID}`);
        return historyJson ? JSON.parse(historyJson) : [];
    } catch (error) {
        console.error("Failed to retrieve history:", error);
        throw new StorageError("Could not access browser storage to load conversation history.");
    }
};

/**
 * Saves a new interaction to the user's raw history.
 * @throws {StorageError} If localStorage cannot be accessed.
 */
const saveInteraction = (userText: string, ericaText: string) => {
    try {
        const history = getHistory();
        history.push(`User: ${userText}`);
        history.push(`ERICA: ${ericaText}`);
        // Limit history to last 20 turns to keep it manageable
        if (history.length > 40) { // Increased to 20 turns (user + erica)
            history.splice(0, history.length - 40);
        }
        localStorage.setItem(`${HISTORY_KEY_PREFIX}${USER_ID}`, JSON.stringify(history));
    } catch (error) {
        console.error("Failed to save interaction:", error);
        // Re-throw as a specific StorageError for the caller to handle.
        throw new StorageError("Could not save conversation to browser storage. It might be full or blocked.");
    }
};

/**
 * Updates the summarized long-term memory.
 * @throws {StorageError} If localStorage cannot be accessed.
 */
const updateMemory = (newSummary: string) => {
    try {
        localStorage.setItem(`${MEMORY_KEY_PREFIX}${USER_ID}`, newSummary);
    } catch (error) {
        console.error("Failed to update memory:", error);
        throw new StorageError("Could not save summarized memory to browser storage. It might be full or blocked.");
    }
};

/**
 * Summarizes the current history and updates the long-term memory.
 * This is an async, fire-and-forget operation.
 * @throws {StorageError|Error} Propagates errors from storage or the API call.
 */
export const summarizeAndStoreMemory = async () => {
    const gemini = getAi();
    if (!gemini) return;

    // These will throw on storage error and stop execution, which is what we want.
    const currentMemory = getMemory() || 'No previous summary.';
    const history = getHistory();

    if (history.length === 0) return;

    const prompt = `
        You are a memory management system for an AI assistant named ERICA.
        Your task is to create a concise summary of key facts about the user based on the provided information.
        Focus on personal details, preferences, recurring topics, and key entities mentioned.
        The summary should be in the third person, from ERICA's perspective of the user (e.g., "The user's name is Jane. She is interested in AI.").
        Do not include conversational fluff.

        Previous Summary:
        ---
        ${currentMemory}
        ---

        New Conversation Transcript (most recent turns):
        ---
        ${history.join('\n')}
        ---

        Based on the previous summary and the new transcript, generate an updated, consolidated summary of facts about the user. If the new transcript is short or contains no new personal information, it's okay to determine that no update is needed and return the previous summary.
    `;

    try {
        const response = await gemini.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
        });

        if (response.text) {
            updateMemory(response.text.trim());
            localStorage.removeItem(`${HISTORY_KEY_PREFIX}${USER_ID}`);
        }
    } catch (error) {
        console.error("Failed to summarize and store memory:", error);
        if (error instanceof StorageError) {
            throw error; // Re-throw our custom error
        }
        // Catch generic storage errors that are not wrapped yet
        if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.name === 'SecurityError')) {
             throw new StorageError("Could not save to browser storage. It might be full or blocked by your browser settings.");
        }
        // Assume other errors are API related.
        throw new Error("Failed to summarize memory due to an AI service error.");
    }
};


/**
 * Public function to be called after a conversational turn.
 * Now async to allow the caller to catch any errors during the process.
 */
export const processNewTurn = async (userText: string, ericaText: string) => {
    saveInteraction(userText, ericaText);
    await summarizeAndStoreMemory();
};