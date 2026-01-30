# ERICA 3.0: Conversational AI with Voice & Vision

ERICA 3.0 is a sophisticated web application showcasing the power of the Google Gemini API. It provides a seamless, real-time conversational experience with a voice assistant and offers powerful video, vision, research, and chat capabilities, all wrapped in a sleek, modern user interface. This project is fully containerized with Docker for easy deployment and scalability.

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

- **🔍 Research Agent**: Tap into the power of real-time information.
  - **Live Web Search**: Ask questions about recent events, news, or any topic requiring up-to-date information. ERICA uses Google Search to ground her answers in the latest data from the web.
  - **Source Attribution**: For transparency, ERICA provides links to the web pages she used to formulate her response, so you can verify the information and explore topics further.

- **🗨️ Multimodal Chat**: Engage in versatile, contextual conversations.
  - **Text & Image Input**: Go beyond words. Upload an image and ask ERICA to describe it, identify its contents, or answer questions about it.
  - **Conversation History**: ERICA remembers the context of your chat, allowing for natural back-and-forth dialogue about the topics and images you discuss.
  - **Streaming Responses**: Get fast, real-time feedback as ERICA types her responses word by word.

## 🛠️ Tech Stack

- **Frontend**: [React](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Containerization**: [Docker](https://www.docker.com/)
- **Web Server**: [Express.js](https://expressjs.com/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **AI Models & Tools**:
  - [Google Gemini Live API](https://ai.google.dev/docs/live) (`gemini-2.5-flash-native-audio-preview-12-205`) for voice conversations.
  - [Google Gemini API](https://ai.google.dev/docs/gemini_api_overview) (`gemini-3-pro-preview`) for vision, video analysis, object detection, and multimodal chat.
  - [Google Gemini API](https://ai.google.dev/docs/gemini_api_overview) (`gemini-3-flash-preview`) for memory summarization and research queries.
  - **Function Calling**: Used in Agentic Vision to generate structured action plans.
  - **Google Search Grounding**: Used in the Research Agent to provide answers based on real-time web data.
- **Icons**: [Lucide React](https://lucide.dev/)

## 🚀 Getting Started

Follow these instructions to get the project running in a Docker container on your local machine.

### Prerequisites

You need to have [Docker](https://www.docker.com/get-started) installed and running on your system. You will also need a modern web browser and a working microphone and camera.

### Configuration

This application requires a Google Gemini API key to function. You must provide this key as an environment variable when running the Docker container. **Do not hardcode your API key in any source files.**

### Running with Docker

1.  **Build the Docker Image**:
    Open a terminal in the project's root directory (where the `Dockerfile` is located) and run the following command:
    ```bash
    docker build -t erica-3.0 .
    ```

2.  **Run the Docker Container**:
    After the image is built, run it with the following command. Remember to replace `"YOUR_API_KEY_HERE"` with your actual Google Gemini API key.
    ```bash
    docker run -p 8080:8080 -e API_KEY="YOUR_API_KEY_HERE" --name erica-app erica-3.0
    ```
    - `-p 8080:8080`: Maps port 8080 on your local machine to port 8080 inside the container.
    - `-e API_KEY="..."`: Securely passes your API key as an environment variable to the container.
    - `--name erica-app`: Gives your running container a memorable name.

3.  **Open in Browser**:
    Open your web browser and navigate to `http://localhost:8080`. The ERICA 3.0 application should now be running.

## 📁 File Structure

The project is organized into logical directories for better maintainability:

```
/
├── components/         # Reusable React components
├── hooks/              # Custom React hooks
├── memory/             # Logic for long-term memory management
├── utils/              # Utility functions
├── App.tsx             # Main application component
├── index.html          # The main HTML file (template)
├── index.tsx           # The entry point of the React application
├── server.js           # Express server for production
├── Dockerfile          # Instructions for building the Docker image
├── package.json        # Project dependencies and scripts
├── vite.config.ts      # Vite build configuration
└── README.md           # You are here!
```
