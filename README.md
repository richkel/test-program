# StreamDiffusion Studio

Real-time AI video transformation application.

## Features
- Multiple input sources: Webcam, 3D Shapes, Cosmic Ripples, Audio Visualizer
- Stream to Daydream API
- Adjust AI parameters in real-time

## Setup
1. Install dependencies: `npm install`
2. Start development server: `npm run dev`

## Backend Setup (for Storyboard Feature)

The storyboard generation feature relies on a backend server.

### Prerequisites
- **FFmpeg:** You must have `ffmpeg` installed on your system and accessible from your PATH. This is used to process images into video streams.

### Environment Variables
Create a `.env` file in the root of the project and add your Daydream API key:
```
DAYDREAM_API_KEY=your_api_key_here
```

### Running the Full Stack
To run both the frontend and the backend server concurrently, use the `dev:all` script:
```
npm run dev:all
```
