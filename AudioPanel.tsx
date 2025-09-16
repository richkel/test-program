import React from 'react';
import { Slider } from '../ui/slider';
import { Button } from '../ui/button';
import { Mic, MicOff, Volume2, VolumeX, Radio, RadioOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

export interface AudioPanelProps {
  isAudioActive: boolean;
  isMuted: boolean;
  volume: number;
  sensitivity: number;
  mode: 'spectrum' | 'waveform' | 'frequency';
  onToggleAudio: () => void;
  onToggleMute: () => void;
  onVolumeChange: (value: number) => void;
  onSensitivityChange: (value: number) => void;
  onModeChange: (mode: 'spectrum' | 'waveform' | 'frequency') => void;
  className?: string;
}

export const AudioPanel = ({
  isAudioActive,
  isMuted,
  volume,
  sensitivity,
  mode,
  onToggleAudio,
  onToggleMute,
  onVolumeChange,
  onSensitivityChange,
  onModeChange,
  className = ''
}: AudioPanelProps) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Audio Controls</CardTitle>
        <CardDescription>Manage audio input and visualization</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium">Microphone</h4>
              <p className="text-xs text-muted-foreground">
                {isAudioActive ? 'Active' : 'Inactive'}
              </p>
            </div>
            <Button
              variant={isAudioActive ? 'default' : 'outline'}
              size="sm"
              onClick={onToggleAudio}
              className="gap-2"
            >
              {isAudioActive ? (
                <>
                  <Mic className="h-4 w-4" />
                  Stop
                </>
              ) : (
                <>
                  <MicOff className="h-4 w-4" />
                  Start
                </>
              )}
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Volume</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleMute}
                className="h-8 w-8 p-0"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Slider
              value={[volume]}
              onValueChange={([value]) => onVolumeChange(value)}
              min={0}
              max={100}
              step={1}
              disabled={isMuted}
              className="py-4"
            />
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">Sensitivity</span>
            <Slider
              value={[sensitivity]}
              onValueChange={([value]) => onSensitivityChange(value)}
              min={0}
              max={200}
              step={1}
              className="py-4"
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <Tabs 
            defaultValue={mode}
            onValueChange={(value) => onModeChange(value as 'spectrum' | 'waveform' | 'frequency')}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 h-10">
              <TabsTrigger value="spectrum" className="text-xs">
                <Radio className="h-3.5 w-3.5 mr-1.5" />
                Spectrum
              </TabsTrigger>
              <TabsTrigger value="waveform" className="text-xs">
                <Radio className="h-3.5 w-3.5 mr-1.5" />
                Waveform
              </TabsTrigger>
              <TabsTrigger value="frequency" className="text-xs">
                <Radio className="h-3.5 w-3.5 mr-1.5" />
                Frequency
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="mt-4 h-24 bg-muted/50 rounded-md flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              {isAudioActive 
                ? `Visualizing ${mode}...` 
                : 'Start audio input to see visualization'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AudioPanel;
