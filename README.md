
# ERICA 3.0: Conversational AI with Voice & Video Understanding

ERICA 3.0 is a sophisticated web application showcasing the power of the Google Gemini API. It provides a seamless, real-time conversational experience with a voice assistant and offers powerful video analysis capabilities, all wrapped in a sleek, modern user interface.

## ✨ Features

- **🗣️ Real-time Voice Conversation**: Engage in natural, low-latency voice conversations with ERICA.
  - **🧠 Long-Term Memory**: ERICA remembers key details from your past conversations to provide a personalized and continuous experience. The conversation context is summarized and stored locally in your browser.
  - **Conversation History**: Your conversation is automatically saved and reloaded, so you can pick up where you left off.
  - **Live Transcription**: See the conversation transcribed in real-time.
  - **Animated Avatar**: A dynamic, photorealistic avatar reacts to the conversation state (listening, speaking, connecting).
  - **Selectable Voices**: Customize ERICA's voice to your preference.
  - **Microphone Handling**: Graceful error handling for microphone access and connection issues.

- **🎬 Video Analysis**: Upload video files and receive a concise, AI-generated summary of their content.
  - **Simple Upload**: Drag-and-drop or use a file picker to select a video.
  - **Custom Prompts**: Ask specific questions about the video to guide the AI's analysis.
  - **Frame Extraction**: The application automatically extracts keyframes from the video for analysis.
  - **Progress Indicators**: Clear feedback on the frame extraction and analysis process.

- **📸 Live Camera Analysis**: Use your device's camera for real-time video analysis.
  - **Live Camera Feed**: View your camera's feed directly in the app.
  - **Continuous Analysis**: Ask a question (e.g., "What objects do you see?") and ERICA will provide continuous updates based on what the camera sees.
  - **Real-time Insights**: Powered by the `gemini-3-pro-preview` model for sophisticated, real-time visual understanding.

- **Modern UI/UX**:
  - **Tabbed Interface**: Easily switch between Voice Conversation, Video Analysis, and Live Analysis modes.
  - **Responsive Design**: A clean, intuitive layout that works great on all screen sizes.
  - **Sleek Aesthetics**: A dark, futuristic theme with smooth animations and transitions.

## 🛠️ Tech Stack

- **Frontend**: [React](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **AI Models**:
  - [Google Gemini Live API](https://ai.google.dev/docs/live) (`gemini-2.5-flash-native-audio-preview-12-2025`) for voice conversations.
  - [Google Gemini API](https://ai.google.dev/docs/gemini_api_overview) (`gemini-3-pro-preview`) for video and live camera analysis.
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
├── hooks/              # Custom React hooks for business logic (useLiveSession, useVideoAnalysis)
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

### Video Analysis (File Upload)

The video analysis feature uses the `gemini-3-pro-preview` model.
1.  The `useVideoAnalysis` hook handles the workflow.
2.  When a user uploads a video, a `<video>` element is used to seek through the timeline and capture keyframes on a `<canvas>`.
3.  These frames are sent as a multi-part request to the Gemini API, which returns a text summary.

### Live Camera Analysis

The live analysis feature also uses the `gemini-3-pro-preview` model.
1.  The `useLiveAnalysis` hook manages camera access and the analysis loop.
2.  `navigator.mediaDevices.getUserMedia` is used to access the camera feed and display it in a `<video>` element.
3.  When analysis starts, `setInterval` is used to periodically capture a frame from the video stream onto a `<canvas>`.
4.  Each frame, along with the user's text prompt, is sent to the Gemini API.
5.  The model's response is displayed, providing a near real-time analysis of the camera feed.
