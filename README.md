# StreamDiffusion Studio

Real-time AI video transformation application.

## Features
- Multiple input sources: Webcam, 3D Shapes, Cosmic Ripples, Audio Visualizer
- Stream to Daydream API
- Adjust AI parameters in real-time

## Setup
1. Install dependencies: `npm install`
2. Start development server: `npm run dev`

## Backend Script (Daydream Stream Creation)

A standalone Node.js script is provided to create a new stream using the Daydream API.

### Environment Variables
Create a `.env` file in the root of the project and add your Daydream API key:
```
DAYDREAM_API_KEY=your_api_key_here
```

You can also set a `PIPELINE_ID` in the `.env` file if you want to use a specific pipeline. If not set, it defaults to `pip_SD-turbo`.

### Running the Script
To create a new stream, run the following command:
```
node scripts/daydream_stream.js
```
The script will output the created stream data to the console.
