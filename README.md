
# ERICA 3.0: Conversational AI with Voice & Vision

ERICA 3.0 is a sophisticated web application showcasing the power of the Google Gemini API. It provides a seamless, real-time conversational experience with a voice assistant and offers powerful video and vision analysis capabilities, all wrapped in a sleek, modern user interface.

## ✨ Features

- **💬 Interactive Mode**: Engage in natural, low-latency voice conversations while ERICA simultaneously analyzes your camera feed.
  - **🧠 Long-Term Memory**: ERICA remembers key details from your past conversations to provide a personalized and continuous experience. The conversation context is summarized and stored locally in your browser.
  - **Live Transcription & Analysis**: See the conversation transcribed in real-time alongside a textual description of what ERICA "sees" through your camera.
  - **Animated Avatar**: A dynamic, photorealistic avatar reacts to the conversation state.
  - **Selectable Voices**: Customize ERICA's voice to your preference.

- **렌즈 Vision Lens**: Experience real-time object recognition inspired by Google Lens.
  - **Object Identification**: ERICA identifies objects in your camera's view.
  - **Bounding Box Overlays**: The application draws colored boxes around detected objects directly on the live video feed.
  - **Confidence Scores**: Each detected object is labeled with its name and a confidence percentage.

- **🎞️ Video File Analysis**: Get deep insights from your videos.
  - **Upload & Analyze**: Upload a video file and ask complex questions about its content, from identifying objects to summarizing events.
  - **Frame Extraction**: The application automatically extracts keyframes from the video to provide a comprehensive context to the AI.
  - **Progress Tracking**: A visual indicator shows the progress of frame extraction and analysis.

- **🤖 Agentic Vision**: Grant ERICA "eyes" via your camera or screen share and give her commands.
  - **Screen & Camera Understanding**: ERICA can "see" what's on your screen or in front of your camera.
  - **Natural Language Commands**: Give instructions in plain English, like "Click on the 'Login' button."
  - **AI-Powered Action Planning**: Using Gemini's function calling, ERICA generates a step-by-step plan to achieve your goal.
  - **Transparent Reasoning**: The generated plan is displayed for you to see, providing a clear look into the AI's thought process. **Note**: For security, ERICA only displays the planned actions and does not execute them on your device.

## 🛠️ Tech Stack

- **Frontend**: [React](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **AI Models**:
  - [Google Gemini Live API](https://ai.google.dev/docs/live) (`gemini-2.5-flash-native-audio-preview-12-205`) for voice conversations.
  - [Google Gemini API](https://ai.google.dev/docs/gemini_api_overview) (`gemini-3-pro-preview`) for vision, video analysis, and object detection.
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
├── components/         # Reusable React components (Tabs, Transcript, VisionLens, etc.)
├── hooks/              # Custom React hooks for business logic
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

### Interactive Mode & Memory

The voice feature is powered by the **Gemini Live API**.
1.  The `useLiveSession` hook manages the voice connection, while `useLiveAnalysis` handles the vision stream.
2.  The `InteractiveView` component combines these hooks for a simultaneous voice and vision experience.
3.  On session start, `memoryManager` retrieves a summary of past conversations from `localStorage` to provide context.
4.  The **Web Audio API** captures microphone input for the voice stream.
5.  After a conversational turn, `memoryManager` triggers a background process to update the long-term memory summary.

### Vision Features (Lens, Video, Agentic)

The vision features use the multimodal capabilities of the **Gemini API (`gemini-3-pro-preview`)**.
1.  **Frame Capture**: For all vision tasks, a frame is captured from the relevant source (live camera, screen share, or uploaded video file) and converted to a base64-encoded JPEG.
2.  **Vision Lens**: The `useObjectDetection` hook sends frames to the API with a prompt and a strict JSON schema, asking for object labels, confidence scores, and normalized bounding box coordinates. The `VisionLens` component then renders these as SVG overlays.
3.  **Video Analysis**: The `useVideoAnalysis` hook extracts a series of frames distributed throughout the uploaded video's duration to create a comprehensive visual summary for the API.
4.  **Agentic Vision**: The `useAgenticVision` hook uses **function calling**. It sends a single frame, a user command, and a set of predefined tools (`CLICK`, `TYPE`, etc.) to the API. The model returns a structured plan which is then displayed to the user.
