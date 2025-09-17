import React from 'react'
import { Button } from '../ui/button'

interface StreamControlsProps {
  isConnected: boolean
  isStreaming: boolean
  isLoading: boolean
  onUnifiedStart: () => void
  onStartWebRTC: () => void
  onUnifiedStop: () => void
  isStreamCreated: boolean
  isRecording: boolean
  onStartRecording: () => void
  onStopRecording: () => void
  hasStreamData: boolean
}

const StreamControls: React.FC<StreamControlsProps> = ({
  isConnected,
  isStreaming,
  isLoading,
  onUnifiedStart,
  onStartWebRTC,
  onUnifiedStop,
  isStreamCreated,
  isRecording,
  onStartRecording,
  onStopRecording,
  hasStreamData
}) => {
  return (
    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-3 text-center">🎮 Stream Controls</h3>
      <div className="space-y-2">
        {/* Conditional Start/Stop Button */}
        {!isStreaming ? (
          <Button
            onClick={onUnifiedStart}
            disabled={!isStreamCreated || isLoading}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 text-sm rounded-lg font-medium transition-all duration-200"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                Starting...
              </>
            ) : (
              <>
                🎤 Start Camera & Voice
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={onUnifiedStop}
            disabled={!isStreamCreated || isLoading}
            variant="destructive"
            className="w-full px-3 py-2 text-sm rounded-lg font-medium transition-all duration-200"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                Stopping...
              </>
            ) : (
              '⏹️ Stop Stream'
            )}
          </Button>
        )}

        <Button
          onClick={onStartWebRTC}
          disabled={!isStreamCreated || isStreaming || isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 text-sm rounded-lg font-medium transition-all duration-200"
        >
          📡 Start WebRTC Stream
        </Button>

        <Button
          onClick={isRecording ? onStopRecording : onStartRecording}
          disabled={!hasStreamData && !isRecording}
          className={`w-full px-3 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${
            isRecording
              ? 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white'
              : !hasStreamData
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white'
          }`}
        >
          {isRecording ? '⏹️ Stop Recording' : '🎯 Record Video'}
        </Button>
        {!isConnected && (
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="w-full border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-900/20 px-3 py-2 text-sm rounded-lg font-medium transition-all duration-200"
          >
            🔄 Retry Connection
          </Button>
        )}
      </div>
    </div>
  )
}

export default StreamControls
