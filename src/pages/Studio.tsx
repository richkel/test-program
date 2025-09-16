import React, { useState, useRef, useEffect } from 'react';
import AIParameters from '../components/studio/AIParameters';
import StreamControls from '../components/studio/StreamControls';
import AudioFeaturesDisplay from '../components/studio/AudioFeaturesDisplay';
import { useStreamAPI } from '../hooks/useStreamAPI';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { useTheme } from '../contexts/ThemeContext';
import { ReusableHeader } from '../components/ui/Header';
import { ReusableFooter } from '../components/ui/Footer';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Video, Mic, Youtube, Download, Trash2, Droplets, Film } from 'lucide-react';
import FluidCanvas from '../components/FluidCanvas';
import BatchImageUploader from '../components/BatchImageUploader';

const Studio: React.FC = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('studio');
  const [showFluidCanvas, setShowFluidCanvas] = useState(false);
  const fluidCanvasRef = useRef<HTMLCanvasElement>(null);
  const {
    streamData,
    localStream,
    isStreaming,
    alerts,
    localVideoRef,
    outputPlayerRef,
    createStream,
    startStreamSource,
    startWebRTCStream,
    stopStream,
    updateParameters,
    removeAlert,
    isRecording,
    recordingStatus,
    startRecording,
    stopRecording,
    recordingSessionId,
  } = useStreamAPI(fluidCanvasRef);

  const [prompt, setPrompt] = useState('');
  const [inferenceSteps, setInferenceSteps] = useState(50);
  const [seed, setSeed] = useState(42);

  const [poseEnabled, setPoseEnabled] = useState(true);
  const [poseScale, setPoseScale] = useState(0.5);
  const [hedEnabled, setHedEnabled] = useState(true);
  const [hedScale, setHedScale] = useState(0.5);
  const [cannyEnabled, setCannyEnabled] = useState(true);
  const [cannyScale, setCannyScale] = useState(0.5);
  const [depthEnabled, setDepthEnabled] = useState(true);
  const [depthScale, setDepthScale] = useState(0.5);
  const [colorEnabled, setColorEnabled] = useState(true);
  const [colorScale, setColorScale] = useState(0.5);

  const [isLoading, setIsLoading] = useState(false);
  const [hasStreamData, setHasStreamData] = useState(false);

  useEffect(() => {
    if (streamData && streamData.output_playback_id) {
      setHasStreamData(true);
    } else {
      setHasStreamData(false);
    }
  }, [streamData]);

  const handleStart = async () => {
    setIsLoading(true);
    await createStream();
    setIsLoading(false);
  };

  const handleUnifiedStart = async () => {
    setIsLoading(true);
    try {
      await startStreamSource();
      await startWebRTCStream();
    } catch (error) {
      console.error('Failed to start recording/streaming:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnifiedStop = async () => {
    setIsLoading(true);
    try {
      await stopStream();
      if (isRecording) {
        await stopRecording();
      }
    } catch (error) {
      console.error('Failed to stop recording/streaming:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (prompt.trim()) {
      const timer = setTimeout(() => {
        handleUpdateParameters();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [prompt]);

  const handleUpdateParameters = async () => {
    const params = {
      model_id: 'streamdiffusion',
      pipeline: 'live-video-to-video',
      params: {
        model_id: 'stabilityai/sd-turbo',
        prompt: prompt,
        prompt_interpolation_method: 'slerp',
        normalize_prompt_weights: true,
        normalize_seed_weights: true,
        negative_prompt: 'Low quality, blurry, distorted',
        num_inference_steps: inferenceSteps,
        seed: seed,
        t_index_list: [0, 8, 17],
        controlnets: [
          {
            conditioning_scale: poseScale,
            control_guidance_end: 1,
            control_guidance_start: 0,
            enabled: poseEnabled,
            model_id: 'thibaud/controlnet-sd21-openpose-diffusers',
            preprocessor: 'pose_tensorrt',
            preprocessor_params: {},
          },
          {
            conditioning_scale: hedScale,
            control_guidance_end: 1,
            control_guidance_start: 0,
            enabled: hedEnabled,
            model_id: 'thibaud/controlnet-sd21-hed-diffusers',
            preprocessor: 'soft_edge',
            preprocessor_params: {},
          },
          {
            conditioning_scale: cannyScale,
            control_guidance_end: 1,
            control_guidance_start: 0,
            enabled: cannyEnabled,
            model_id: 'thibaud/controlnet-sd21-canny-diffusers',
            preprocessor: 'canny',
            preprocessor_params: { high_threshold: 200, low_threshold: 100 },
          },
          {
            conditioning_scale: depthScale,
            control_guidance_end: 1,
            control_guidance_start: 0,
            enabled: depthEnabled,
            model_id: 'thibaud/controlnet-sd21-depth-diffusers',
            preprocessor: 'depth_tensorrt',
            preprocessor_params: {},
          },
          {
            conditioning_scale: colorScale,
            control_guidance_end: 1,
            control_guidance_start: 0,
            enabled: colorEnabled,
            model_id: 'thibaud/controlnet-sd21-color-diffusers',
            preprocessor: 'passthrough',
            preprocessor_params: {},
          },
        ],
      },
    };
    await updateParameters(params);
  };

  return (
    <div className={`${theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-white text-gray-900'} min-h-screen relative`}>
      {showFluidCanvas && (
        <div className="absolute inset-0 z-0">
          <FluidCanvas ref={fluidCanvasRef} />
        </div>
      )}
      <div className="relative z-10">
        <ReusableHeader />
        <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'} border-b py-3`}>
          <div className="max-w-7xl mx-auto px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button onClick={() => setActiveTab('studio')} variant={activeTab === 'studio' ? 'secondary' : 'ghost'} size="sm">Studio</Button>
                  <Button onClick={() => setActiveTab('storyboard')} variant={activeTab === 'storyboard' ? 'secondary' : 'ghost'} size="sm">Storyboard</Button>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="seed" className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Seed:
                  </Label>
                  <Input
                    id="seed"
                    type="number"
                    value={seed}
                    onChange={(e) => setSeed(parseInt(e.target.value))}
                    min="0"
                    max="999999"
                    className="w-20 text-center font-mono text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <Button onClick={() => setSeed(Math.floor(Math.random() * 999999))} variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    🎲
                  </Button>
                </div>
                <Button onClick={() => setShowFluidCanvas(!showFluidCanvas)} variant="outline" size="sm" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <Droplets className="w-4 h-4 mr-2" />
                  {showFluidCanvas ? 'Hide' : 'Show'} Fluid
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${streamData ? 'bg-green-500' : 'bg-gray-400'}`}>
                  {streamData && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
                </div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isStreaming ? 'bg-blue-500' : 'bg-gray-400'}`}>
                  {isStreaming && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
                </div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isRecording ? 'bg-red-500' : 'bg-gray-400'}`}>
                  {isRecording && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  onClick={handleStart}
                  disabled={!!streamData}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    streamData ? 'bg-green-600 text-white cursor-not-allowed' : 'bg-gradient-to-r from-red-500 to-purple-600 hover:from-red-600 hover:to-purple-700 text-white'
                  }`}
                >
                  {streamData ? 'Started' : 'Start'}
                </Button>
              </div>
            </div>
          </div>
        </div>
        {activeTab === 'studio' && (
          <div className={`${theme === 'dark' ? 'bg-transparent' : 'bg-transparent'} flex h-[calc(100vh-140px)]`}>
            <div className="max-w-7xl mx-auto flex w-full">
              <div className={`${theme === 'dark' ? 'bg-gray-900/80 border-gray-700' : 'bg-gray-50/80 border-gray-200'} border-r w-80 flex flex-col`}>
                <div className="flex-1 p-4 space-y-4">
                  <Card className={`${theme === 'dark' ? 'bg-gray-800/80 border-gray-700' : 'bg-white/80 border-gray-200'}`}>
                    <CardContent className="p-0">
                      <div className="relative">
                        <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-48 object-cover rounded-t-lg" />
                        {!localStream && (
                          <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-gray-800/80' : 'bg-gray-100/80'} flex items-center justify-center rounded-t-lg`}>
                            <div className="text-center text-gray-500 dark:text-gray-400">
                              <Video className="w-8 h-8 mx-auto mb-2" />
                              <div className="text-sm font-medium">Camera feed</div>
                              <div className="text-xs mt-1">Start camera to begin</div>
                            </div>
                          </div>
                        )}
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          {isStreaming ? 'LIVE' : 'OFFLINE'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  {recordingStatus !== 'Ready to record' && (
                    <Card className={`${theme === 'dark' ? 'bg-gray-800/80 border-gray-700' : 'bg-white/80 border-gray-200'}`}>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{recordingStatus}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  <StreamControls
                    isConnected={!!streamData}
                    isStreaming={isStreaming}
                    isLoading={isLoading}
                    onUnifiedStart={handleUnifiedStart}
                    onStartWebRTC={startWebRTCStream}
                    onUnifiedStop={handleUnifiedStop}
                    isStreamCreated={!!streamData}
                    isRecording={isRecording}
                    onStartRecording={startRecording}
                    onStopRecording={stopRecording}
                    hasStreamData={hasStreamData}
                  />
                </div>
              </div>
              <div className="flex-1 flex flex-col">
                <div className="flex-1 p-6">
                  <Card className={`h-full ${theme === 'dark' ? 'bg-gray-900/80 border-gray-700' : 'bg-white/80 border-gray-200'}`}>
                    <CardContent className="p-0 h-full">
                      <div className="relative h-full">
                        {streamData?.output_playback_id ? (
                          <div className="relative w-full h-full">
                            <iframe
                              ref={outputPlayerRef}
                              src={`https://lvpr.tv/?v=${streamData.output_playback_id}&lowLatency=force&autoplay=true`}
                              frameBorder="0"
                              allowFullScreen
                              sandbox="allow-scripts allow-same-origin allow-presentation"
                              referrerPolicy="no-referrer-when-downgrade"
                              className="w-full h-full rounded-lg"
                            />
                          </div>
                        ) : (
                          <div className={`w-full h-full ${theme === 'dark' ? 'bg-gray-800/80' : 'bg-gray-100/80'} flex items-center justify-center rounded-lg`}>
                            <div className="text-center text-gray-500 dark:text-gray-400">
                              <div className="text-4xl mb-4">✨</div>
                              <div className="text-lg font-medium">AI Output Preview</div>
                              <div className="text-sm mt-2">Start streaming to see results</div>
                            </div>
                          </div>
                        )}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-[90%] flex justify-center pointer-events-none">
                          <div className="bg-black bg-opacity-70 rounded-md px-6 py-2 text-white text-lg font-medium shadow-lg max-w-2xl w-full text-center truncate">
                            {prompt ? prompt : <span className="opacity-60">This is a subtitle bar</span>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
              <div className={`${theme === 'dark' ? 'bg-gray-900/80 border-gray-700' : 'bg-gray-50/80 border-gray-200'} border-l w-80 flex flex-col`}>
                <div className="flex-1 overflow-y-auto p-4 hide-scrollbar">
                  <AudioFeaturesDisplay
                    volume={0}
                    pitch={0}
                    emotion={'neutral'}
                    confidence={0}
                    visualStyle={''}
                    wpm={0}
                    transcript={''}
                    isListening={isStreaming}
                    theme={theme}
                  />
                  <AIParameters
                    inferenceSteps={inferenceSteps}
                    setInferenceSteps={setInferenceSteps}
                    poseEnabled={poseEnabled}
                    setPoseEnabled={setPoseEnabled}
                    poseScale={poseScale}
                    setPoseScale={setPoseScale}
                    hedEnabled={hedEnabled}
                    setHedEnabled={setHedEnabled}
                    hedScale={hedScale}
                    setHedScale={setHedScale}
                    cannyEnabled={cannyEnabled}
                    setCannyEnabled={setCannyEnabled}
                    cannyScale={cannyScale}
                    setCannyScale={setCannyScale}
                    depthEnabled={depthEnabled}
                    setDepthEnabled={setDepthEnabled}
                    depthScale={depthScale}
                    setDepthScale={setDepthScale}
                    colorEnabled={colorEnabled}
                    setColorEnabled={setColorEnabled}
                    colorScale={colorScale}
                    setColorScale={setColorScale}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'storyboard' && (
          <div className="p-6">
            <BatchImageUploader />
          </div>
        )}
        <ReusableFooter />
        <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
          {alerts.map((alert) => (
            <Alert key={alert.id} className={`animate-in slide-in-from-right-full duration-300 ${
              alert.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-800'
                : alert.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-800'
                : alert.type === 'warning'
                ? 'border-yellow-200 bg-yellow-50 text-yellow-800'
                : 'border-blue-200 bg-blue-50 text-blue-800'
            }`}>
              <div className="flex items-center justify-between">
                <AlertDescription className="flex-1 pr-2">{alert.message}</AlertDescription>
                <button onClick={() => removeAlert(alert.id)} className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 transition-colors" aria-label="Close alert">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Alert>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Studio;
