import React from 'react'
import { Label } from '../ui/label'
import { Slider } from '../ui/slider'
import { Checkbox } from '../ui/checkbox'

interface AIParametersProps {
  inferenceSteps: number
  setInferenceSteps: (value: number) => void
  poseEnabled: boolean
  setPoseEnabled: (value: boolean) => void
  poseScale: number
  setPoseScale: (value: number) => void
  hedEnabled: boolean
  setHedEnabled: (value: boolean) => void
  hedScale: number
  setHedScale: (value: number) => void
  cannyEnabled: boolean
  setCannyEnabled: (value: boolean) => void
  cannyScale: number
  setCannyScale: (value: number) => void
  depthEnabled: boolean
  setDepthEnabled: (value: boolean) => void
  depthScale: number
  setDepthScale: (value: number) => void
  colorEnabled: boolean
  setColorEnabled: (value: boolean) => void
  colorScale: number
  setColorScale: (value: number) => void
}

const AIParameters: React.FC<AIParametersProps> = ({
  inferenceSteps,
  setInferenceSteps,
  poseEnabled,
  setPoseEnabled,
  poseScale,
  setPoseScale,
  hedEnabled,
  setHedEnabled,
  hedScale,
  setHedScale,
  cannyEnabled,
  setCannyEnabled,
  cannyScale,
  setCannyScale,
  depthEnabled,
  setDepthEnabled,
  depthScale,
  setDepthScale,
  colorEnabled,
  setColorEnabled,
  colorScale,
  setColorScale
}) => {


  return (
    <div className="p-2 space-y-2">
      {/* Image Quality */}
      <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-200 dark:border-orange-800">
        <Label htmlFor="inferenceSteps" className="flex items-center gap-1 text-xs font-semibold text-orange-800 dark:text-orange-300 mb-1">
          Inference (Steps)
        </Label>
        <div className="flex items-center gap-1">
          <Slider
            id="inferenceSteps"
            min={10}
            max={100}
            value={[inferenceSteps]}
            onValueChange={(value) => setInferenceSteps(value[0])}
            className="flex-1"
          />
          <span className="text-xs font-bold text-orange-700 dark:text-orange-300 min-w-[2rem] text-center bg-white dark:bg-gray-800 px-1 py-0.5 rounded border border-orange-300 dark:border-orange-700">{inferenceSteps}</span>
        </div>
      </div>

      {/* Pose Preservation */}
      <div className="p-1.5 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
        <div className="flex items-center gap-1 mb-1">
          <Checkbox
            id="poseEnabled"
            checked={poseEnabled}
            onCheckedChange={(checked) => setPoseEnabled(checked as boolean)}
            className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 w-3 h-3"
          />
          <Label htmlFor="poseEnabled" className="flex items-center gap-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
            Preserve Pose
          </Label>
        </div>
        <div className="flex items-center gap-1">
          <Slider
            id="poseScale"
            min={0}
            max={1}
            step={0.01}
            value={[poseScale]}
            onValueChange={(value) => setPoseScale(value[0])}
            className="flex-1"
            disabled={!poseEnabled}
          />
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 min-w-[2rem] text-center bg-gray-100 dark:bg-gray-600 px-1 py-0.5 rounded border">{poseScale.toFixed(2)}</span>
        </div>
      </div>

      {/* Soft Edges (HED) */}
      <div className="p-1.5 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
        <div className="flex items-center gap-1 mb-1">
          <Checkbox
            id="hedEnabled"
            checked={hedEnabled}
            onCheckedChange={(checked) => setHedEnabled(checked as boolean)}
            className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 w-3 h-3"
          />
          <Label htmlFor="hedEnabled" className="flex items-center gap-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
            Preserve Soft Edges
          </Label>
        </div>
        <div className="flex items-center gap-1">
          <Slider
            id="hedScale"
            min={0}
            max={1}
            step={0.01}
            value={[hedScale]}
            onValueChange={(value) => setHedScale(value[0])}
            className="flex-1"
            disabled={!hedEnabled}
          />
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 min-w-[2rem] text-center bg-gray-100 dark:bg-gray-600 px-1 py-0.5 rounded border">{hedScale.toFixed(2)}</span>
        </div>
      </div>

      {/* Sharp Edges (Canny) */}
      <div className="p-1.5 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
        <div className="flex items-center gap-1 mb-1">
          <Checkbox
            id="cannyEnabled"
            checked={cannyEnabled}
            onCheckedChange={(checked) => setCannyEnabled(checked as boolean)}
            className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 w-3 h-3"
          />
          <Label htmlFor="cannyEnabled" className="flex items-center gap-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
            Preserve Sharp Edges
          </Label>
        </div>
        <div className="flex items-center gap-1">
          <Slider
            id="cannyScale"
            min={0}
            max={1}
            step={0.01}
            value={[cannyScale]}
            onValueChange={(value) => setCannyScale(value[0])}
            className="flex-1"
            disabled={!cannyEnabled}
          />
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 min-w-[2rem] text-center bg-gray-100 dark:bg-gray-600 px-1 py-0.5 rounded border">{cannyScale.toFixed(2)}</span>
        </div>
      </div>

      {/* Depth Preservation */}
      <div className="p-1.5 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
        <div className="flex items-center gap-1 mb-1">
          <Checkbox
            id="depthEnabled"
            checked={depthEnabled}
            onCheckedChange={(checked) => setDepthEnabled(checked as boolean)}
            className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 w-3 h-3"
          />
          <Label htmlFor="depthEnabled" className="flex items-center gap-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
            Preserve Depth
          </Label>
        </div>
        <div className="flex items-center gap-1">
          <Slider
            id="depthScale"
            min={0}
            max={1}
            step={0.01}
            value={[depthScale]}
            onValueChange={(value) => setDepthScale(value[0])}
            className="flex-1"
            disabled={!depthEnabled}
          />
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 min-w-[2rem] text-center bg-gray-100 dark:bg-gray-600 px-1 py-0.5 rounded border">{depthScale.toFixed(2)}</span>
        </div>
      </div>

      {/* Color Preservation */}
      <div className="p-1.5 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
        <div className="flex items-center gap-1 mb-1">
          <Checkbox
            id="colorEnabled"
            checked={colorEnabled}
            onCheckedChange={(checked) => setColorEnabled(checked as boolean)}
            className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 w-3 h-3"
          />
          <Label htmlFor="colorEnabled" className="flex items-center gap-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
            Preserve Color & Lighting
          </Label>
        </div>
        <div className="flex items-center gap-1">
          <Slider
            id="colorScale"
            min={0}
            max={1}
            step={0.01}
            value={[colorScale]}
            onValueChange={(value) => setColorScale(value[0])}
            className="flex-1"
            disabled={!colorEnabled}
          />
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 min-w-[2rem] text-center bg-gray-100 dark:bg-gray-600 px-1 py-0.5 rounded border">{colorScale.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}

export default AIParameters
