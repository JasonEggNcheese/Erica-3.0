
# ERICA 3.0: Conversational AI with Voice & Vision

ERICA 3.0 is a sophisticated web application showcasing the power of the Google Gemini API. It provides a seamless, real-time conversational experience with a voice assistant and offers powerful agentic vision capabilities, all wrapped in a sleek, modern user interface.

## ✨ Features

- **🗣️ Real-time Voice Conversation**: Engage in natural, low-latency voice conversations with ERICA.
  - **🧠 Long-Term Memory**: ERICA remembers key details from your past conversations to provide a personalized and continuous experience. The conversation context is summarized and stored locally in your browser.
  - **Conversation History**: Your conversation is automatically saved and reloaded, so you can pick up where you left off.
  - **Live Transcription**: See the conversation transcribed in real-time.
  - **Animated Avatar**: A dynamic, photorealistic avatar reacts to the conversation state (listening, speaking, connecting).
  - **Selectable Voices**: Customize ERICA's voice to your preference.
  - **Microphone Handling**: Graceful error handling for microphone access and connection issues.

- **🤖 Agentic Vision**: Grant ERICA "eyes" via your camera or screen share and give her commands.
  - **Screen & Camera Understanding**: ERICA can "see" what's on your screen or in front of your camera.
  - **Natural Language Commands**: Give instructions in plain English, like "Click on the 'Login' button."
  - **AI-Powered Action Planning**: Using Gemini's function calling, ERICA analyzes the visual input and your command to generate a step-by-step plan.
  - **Transparent Reasoning**: The generated plan (e.g., `CLICK`, `TYPE`, `SCROLL`) is displayed for you to see, providing a clear look into the AI's thought process. **Note**: For security, ERICA only displays the planned actions and does not execute them on your device.

- **Modern UI/UX**:
  - **Tabbed Interface**: Easily switch between Voice Conversation and Agentic Vision modes.
  - **Responsive Design**: A clean, intuitive layout that works great on all screen sizes.
  - **Sleek Aesthetics**: A dark, futuristic theme with smooth animations and transitions.

## 🛠️ Tech Stack

- **Frontend**: [React](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **AI Models**:
  - [Google Gemini Live API](https://ai.google.dev/docs/live) (`gemini-2.5-flash-native-audio-preview-12-2025`) for voice conversations.
  - [Google Gemini API](https://ai.google.dev/docs/gemini_api_overview) (`gemini-3-pro-preview`) for agentic vision.
  - [Google Gemini API](https://ai.google.dev/docs/gemini_api_overview) (`gemini-3-flash-preview`) for memory summarization.
- **Icons**: [Lucide React](https://lucide.dev/)
- **Bundling/Imports**: ES Modules via `esm.sh`

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine.

### Prerequisites

You need to have a modern web browser and a working microphone and camera.

### Configuration

This application requires a Google Gemini API key to function.

The API key is expected to be available as an environment variable named `process.env.API_KEY`. The application is set up to use this variable directly. **Do not hardcode your API key in the source files.**

### Running the Application

1.  **Serve the Files**: You can use any simple HTTP server to run this project. If you have Node.js, you can use `serve`:
    ```bash
    # Install serve globally
    npm install -g serve

    # Serve the project directory
    serve .
    ```
2.  **Open in Browser**: Open your web browser and navigate to the local server address provided (e.g., `http://localhost:3000`).

## 📁 File Structure

The project is organized into logical directories for better maintainability:

```
/
├── components/         # Reusable React components (Controls, Tabs, Transcript, etc.)
├── hooks/              # Custom React hooks for business logic (useLiveSession, useAgenticVision)
├── memory/             # Logic for long-term memory management
├── utils/              # Utility functions (e.g., audio encoding/decoding)
├── App.tsx             # Main application component with routing/tabs
├── index.html          # The main HTML file
├── index.tsx           # The entry point of the React application
├── types.ts            # TypeScript type definitions
├── metadata.json       # Application metadata
└── README.md           # You are here!
```

## 🧠 How It Works

### Voice Conversation & Memory

The voice feature is powered by the **Gemini Live API**.
1.  The `useLiveSession` hook manages the connection state and conversation transcript.
2.  On session start, the `memoryManager` retrieves a summary of past conversations from `localStorage` and injects it into the AI's system prompt for context.
3.  The **Web Audio API** (`getUserMedia`, `AudioContext`) captures microphone input, which is streamed to the Gemini Live API.
4.  The API streams back both the AI's audio response and the real-time transcription.
5.  After a conversational turn, `memoryManager` triggers a background process to update the long-term memory summary using `gemini-3-flash-preview`.

### Agentic Vision

The agentic vision feature uses **function calling** with the `gemini-3-pro-preview` model to simulate desktop control.
1. The `useAgenticVision` hook manages the state for camera and screen sharing (`getDisplayMedia`).
2. When the user provides a command, a single frame is captured from the active video/screen stream.
3. This frame, along with the user prompt and a set of predefined `functionDeclarations` (tools like `CLICK`, `TYPE`, `SCROLL`), is sent to the Gemini API.
4. The model analyzes the image and the command, then returns a structured `FunctionCall` response, detailing its thought process and the sequence of actions it would take to accomplish the goal.
5. The UI then parses and displays this plan, offering a transparent view into the AI's reasoning without executing any actions on the user's machine.