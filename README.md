
# ERICA 3.0: Conversational AI with Voice & Video Understanding

ERICA 3.0 is a sophisticated web application showcasing the power of the Google Gemini API. It provides a seamless, real-time conversational experience with a voice assistant and offers powerful video analysis capabilities, all wrapped in a sleek, modern user interface.

## ✨ Features

- **🗣️ Real-time Voice Conversation**: Engage in natural, low-latency voice conversations with ERICA.
  - **Conversation History**: Your conversation is automatically saved and reloaded, so you can pick up where you left off.
  - **Live Transcription**: See the conversation transcribed in real-time.
  - **Voice Visualizer**: A dynamic orb visualizes ERICA's state (listening, speaking, connecting).
  - **Selectable Voices**: Customize ERICA's voice to your preference.
  - **Microphone Handling**: Graceful error handling for microphone access and connection issues.

- **🎬 Video Analysis**: Upload video files and receive a concise, AI-generated summary of their content.
  - **Simple Upload**: Drag-and-drop or use a file picker to select a video.
  - **Custom Prompts**: Ask specific questions about the video to guide the AI's analysis.
  - **Frame Extraction**: The application automatically extracts keyframes from the video for analysis.
  - **Progress Indicators**: Clear feedback on the frame extraction and analysis process.
  - **Powered by Gemini Pro**: Utilizes the `gemini-3-pro-preview` model for detailed video understanding.

- **Modern UI/UX**:
  - **Tabbed Interface**: Easily switch between Voice Conversation and Video Analysis modes.
  - **Responsive Design**: A clean, intuitive layout that works great on all screen sizes.
  - **Sleek Aesthetics**: A dark, futuristic theme with smooth animations and transitions.

## 🛠️ Tech Stack

- **Frontend**: [React](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **AI Models**:
  - [Google Gemini Live API](https://ai.google.dev/docs/live) (`gemini-2.5-flash-native-audio-preview-12-2025`) for voice conversations.
  - [Google Gemini API](https://ai.google.dev/docs/gemini_api_overview) (`gemini-3-pro-preview`) for video analysis.
- **Icons**: [Lucide React](https://lucide.dev/)
- **Bundling/Imports**: ES Modules via `esm.sh`

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine.

### Prerequisites

You need to have a modern web browser and a working microphone for the voice conversation feature.

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
├── utils/              # Utility functions (e.g., audio encoding/decoding)
├── App.tsx             # Main application component with routing/tabs
├── index.html          # The main HTML file
├── index.tsx           # The entry point of the React application
├── types.ts            # TypeScript type definitions
├── metadata.json       # Application metadata
└── README.md           # You are here!
```

## 🧠 How It Works

### Voice Conversation

The voice feature is powered by the **Gemini Live API**.

1.  The `useLiveSession` hook manages the connection state and conversation transcript.
2.  The conversation history is saved to and loaded from the browser's `localStorage`, allowing for persistence between sessions.
3.  When a session starts, the browser's **Web Audio API** (`getUserMedia`, `AudioContext`) captures microphone input.
4.  The raw audio is processed, encoded into PCM format, and streamed to the Gemini Live API in real-time.
5.  The API streams back both the AI's audio response and the real-time transcription of both the user and the AI.
6.  The incoming audio is decoded and played back seamlessly, while the transcript is updated on the UI.

### Video Analysis

The video analysis feature uses the `gemini-3-pro-preview` model.

1.  The `useVideoAnalysis` hook handles the entire analysis workflow.
2.  When a user uploads a video, a `<video>` element is used in the background to seek through the timeline.
3.  Keyframes are captured at set intervals and drawn onto a `<canvas>` element.
4.  These frames are converted to base64-encoded JPEGs.
5.  The frames, along with a text prompt, are sent to the Gemini API as a multi-part request.
6.  The model analyzes the sequence of frames and returns a text summary, which is then displayed to the user.
