import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Volume2, 
  Music, 
  Heart, 
  Zap,
  TrendingUp,
  Palette
} from 'lucide-react'

interface AudioFeaturesDisplayProps {
  volume: number
  pitch: number
  emotion: string
  confidence: number
  visualStyle: string
  wpm: number
  transcript: string
  isListening: boolean
  theme: 'light' | 'dark'
}

const AudioFeaturesDisplay: React.FC<AudioFeaturesDisplayProps> = ({
  volume,
  pitch,
  emotion,
  confidence,
  visualStyle,
  wpm,
  transcript,
  isListening,
  theme
}) => {
  // Get emotion color and icon
  const getEmotionDisplay = (emotion: string) => {
    switch (emotion.toLowerCase()) {
      case 'excited':
        return { color: 'text-yellow-500', bgColor: 'bg-yellow-100 dark:bg-yellow-900', icon: '⚡', label: 'Excited' }
      case 'happy':
        return { color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900', icon: '😊', label: 'Happy' }
      case 'sad':
        return { color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900', icon: '😢', label: 'Sad' }
      case 'angry':
        return { color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900', icon: '😠', label: 'Angry' }
      case 'calm':
        return { color: 'text-purple-500', bgColor: 'bg-purple-100 dark:bg-purple-900', icon: '😌', label: 'Calm' }
      default:
        return { color: 'text-gray-500', bgColor: 'bg-gray-100 dark:bg-gray-800', icon: '😐', label: 'Neutral' }
    }
  }

  const emotionDisplay = getEmotionDisplay(emotion)

  // Volume bar width (0-100%)
  const volumeWidth = Math.min(100, Math.max(0, volume))

  // Pitch category
  const getPitchCategory = (pitch: number) => {
    if (pitch === 0) return 'No Data'
    if (pitch < 120) return 'Low'
    if (pitch < 180) return 'Mid'
    if (pitch < 250) return 'High'
    return 'Very High'
  }

  const pitchCategory = getPitchCategory(pitch)

  // Speech rate category
  const getSpeechRateCategory = (wpm: number) => {
    if (wpm === 0) return 'No Data'
    if (wpm < 100) return 'Slow'
    if (wpm < 140) return 'Normal'
    if (wpm < 180) return 'Fast'
    return 'Very Fast'
  }

  const speechRateCategory = getSpeechRateCategory(wpm)

  if (!isListening) {
    return (
      <Card className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} mb-4`}>
        <CardContent className="p-4">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <Volume2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <div className="text-sm font-medium">Audio Analysis</div>
            <div className="text-xs mt-1">Start listening to see features</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} mb-4`}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-sm">Speech Analysis</h3>
            <div className="ml-auto w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>


          {/* Volume */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Volume</span>
              <span className="ml-auto text-xs font-mono text-gray-500 dark:text-gray-400">
                {volume.toFixed(1)}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${volumeWidth}%` }}
              ></div>
            </div>
          </div>

          {/* Pitch */}
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Pitch</span>
            <span className="ml-auto text-xs font-mono text-gray-500 dark:text-gray-400">
              {pitch > 0 ? `${pitch.toFixed(0)} Hz` : 'No Data'}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              ({pitchCategory})
            </span>
          </div>

          {/* Speech Rate */}
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Speech Rate</span>
            <span className="ml-auto text-xs font-mono text-gray-500 dark:text-gray-400">
              {wpm > 0 ? `${wpm.toFixed(0)} WPM` : 'No Data'}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              ({speechRateCategory})
            </span>
          </div>

          {/* Emotion */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Emotion</span>
              <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                {(confidence * 100).toFixed(0)}% confidence
              </span>
            </div>
            <div className={`flex items-center gap-2 p-2 rounded-lg ${emotionDisplay.bgColor}`}>
              <span className="text-lg">{emotionDisplay.icon}</span>
              <span className={`text-sm font-medium ${emotionDisplay.color}`}>
                {emotionDisplay.label}
              </span>
            </div>
          </div>

         
        </div>
      </CardContent>
    </Card>
  )
}

export default AudioFeaturesDisplay
