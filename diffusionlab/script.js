/*
MIT License

Copyright (c) 2017 Pavel Dobryakov

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

'use strict';

// Mobile promo section - removed for modern UI

// Simulation section

let canvas = document.getElementById('fluidCanvas') || document.getElementsByTagName('canvas')[0];

// Mobile debugging for canvas initialization
if (isMobile()) {
    console.log('🔍 MOBILE DEBUG: Canvas initialization at script load');
    console.log('🔍 Canvas found:', !!canvas);
    console.log('🔍 Canvas ID:', canvas ? canvas.id : 'none');
    console.log('🔍 Total canvas elements:', document.getElementsByTagName('canvas').length);
    console.log('🔍 All canvas IDs:', Array.from(document.getElementsByTagName('canvas')).map(c => c.id));
}



// Ensure we have a canvas before proceeding
if (canvas) {
    resizeCanvas();
} else if (isMobile()) {
    console.log('🔍 MOBILE DEBUG: No canvas found at script load - will retry after DOM ready');
}

// Slider handle padding to prevent clipping at edges
const SLIDER_HANDLE_PADDING = 0.035; // 3.5% padding on each side

// Device-specific configuration presets
const desktopConfig = {
    SIM_RESOLUTION: 128,        // High-quality simulation for desktop
    DYE_RESOLUTION: 1024,       // High quality
    CAPTURE_RESOLUTION: 512,
    DENSITY_DISSIPATION: 1.0,    // Increased fade rate
    VELOCITY_DISSIPATION: 0.6,
    PRESSURE: 0.37,
    PRESSURE_ITERATIONS: 20,
    CURL: 4,                    // Swirl intensity
    SPLAT_RADIUS: 0.3,         // Increased brush size
    SPLAT_FORCE: 6000,
    SHADING: true,              // Enable 3D lighting effects for desktop
    COLORFUL: false,
    COLOR_UPDATE_SPEED: 10,
    PAUSED: false,
    BACK_COLOR: { r: 0, g: 0, b: 0 },
    STATIC_COLOR: { r: 0, g: 0.831, b: 1 },
    TRANSPARENT: false,
    BLOOM: true,                // Enable bloom for desktop
    BLOOM_ITERATIONS: 8,
    BLOOM_RESOLUTION: 256,
    BLOOM_INTENSITY: 0.4,
    BLOOM_THRESHOLD: 0.6,
    BLOOM_SOFT_KNEE: 0.7,
    SUNRAYS: true,              // Enable sunrays for desktop
    SUNRAYS_RESOLUTION: 196,
    SUNRAYS_WEIGHT: 0.4,
    VELOCITY_DRAWING: false,    // Velocity-based drawing intensity
    FORCE_CLICK: true           // Click burst effects (MOUSE ONLY - never affects OSC)
};

const mobileConfig = {
    SIM_RESOLUTION: 64,         // Lower resolution for mobile
    DYE_RESOLUTION: 512,        // Reduced quality for performance
    CAPTURE_RESOLUTION: 512,
    DENSITY_DISSIPATION: 1.0,    // Increased fade rate
    VELOCITY_DISSIPATION: 0.6,
    PRESSURE: 0.37,
    PRESSURE_ITERATIONS: 20,
    CURL: 4,                    // Swirl intensity
    SPLAT_RADIUS: 0.3,         // Increased brush size
    SPLAT_FORCE: 6000,
    SHADING: false,             // Disable 3D lighting effects for mobile
    COLORFUL: false,
    COLOR_UPDATE_SPEED: 10,
    PAUSED: false,
    BACK_COLOR: { r: 0, g: 0, b: 0 },
    STATIC_COLOR: { r: 0, g: 0.831, b: 1 },
    TRANSPARENT: false,
    BLOOM: false,               // Disable bloom for mobile
    BLOOM_ITERATIONS: 8,
    BLOOM_RESOLUTION: 128,      // Lower bloom resolution for mobile
    BLOOM_INTENSITY: 0.4,
    BLOOM_THRESHOLD: 0.6,
    BLOOM_SOFT_KNEE: 0.7,
    SUNRAYS: false,             // Disable sunrays for mobile
    SUNRAYS_RESOLUTION: 96,     // Lower sunrays resolution for mobile
    SUNRAYS_WEIGHT: 0.4,
    VELOCITY_DRAWING: false,    // Velocity-based drawing intensity
    FORCE_CLICK: true           // Click burst effects (MOUSE ONLY - never affects OSC)
};

// Initialize config based on device type
// Add common parameters to both configs
const commonParams = {
    // StreamDiffusion parameters
    INFERENCE_STEPS: 50,
    SEED: 42,
    CONTROLNET_POSE_SCALE: 0.65,  // Balanced preset default
    CONTROLNET_HED_SCALE: 0.41,   // Balanced preset default
    CONTROLNET_CANNY_SCALE: 0.00, // Balanced preset default
    CONTROLNET_DEPTH_SCALE: 0.21, // Balanced preset default
    CONTROLNET_COLOR_SCALE: 0.26, // Balanced preset default
    GUIDANCE_SCALE: 7.5,
    DELTA: 0.5,
    // Denoise controls
    DENOISE_X: 3,
    DENOISE_Y: 6,
    DENOISE_Z: 6,
    // Animation Parameters
    ANIMATE: true,
    LIVELINESS: 0.62,
    CHAOS: 0.73,
    BREATHING: 0.5,
    COLOR_LIFE: 0.22,
    ANIMATION_INTERVAL: 0.1,
    // Media Parameters
    FLUID_CAMERA_SCALE: 1.0,      // Fluid background camera scale
    FLUID_MEDIA_SCALE: 1.0,       // Fluid background media scale
    MEDIA_SCALE: 1.0,             // Media overlay scale
    BACKGROUND_IMAGE_SCALE: 1.0,  // Background image scale
    // Audio Parameters
    AUDIO_REACTIVITY: 2.0,
    AUDIO_DELAY: 0,
    AUDIO_OPACITY: 0.8,
    AUDIO_COLORFUL: 0.3,
    AUDIO_EDGE_SOFTNESS: 0.25,
    // Debug Parameters
    DEBUG_MODE: false,
    
    // Telegram Parameters
    TELEGRAM_RECEIVE: true,
    TELEGRAM_WAITLIST_INTERVAL: 1,
    
    // OSC Multi-splat channels REMOVED - replaced by OSC velocity drawing system
    HIDE_CURSOR: false,
};

// Initialize config based on device type with common parameters
let config = {
    ...(isMobile() ? mobileConfig : desktopConfig),
    ...commonParams
};

// Global State Variables (declared early to avoid initialization order issues)
let streamState = {
    isStreaming: false,
    streamId: null,
    playbackId: null,
    whipUrl: null,
    peerConnection: null,
    mediaStream: null,
    popupWindow: null,
    popupCheckInterval: null,
    promptUpdateInterval: null,
    lastParameterUpdate: 0,
    isUpdatingParameters: false
};

// Simple Camera System
let cameraState = {
    active: false,
    stream: null,
    video: null,
    canvas: null,
    ctx: null,
    animationId: null
};

// Media System
let mediaState = {
    active: false,
    canvas: null,
    ctx: null,
    animationId: null,
    mediaElement: null, // Could be image, video, etc.
    mediaType: null,    // 'image' or 'video'
    mediaName: null,    // filename
    scale: 1.0          // media scale factor (will be synced with config.MEDIA_SCALE)
};

// Fluid Background Media System
let fluidBackgroundMedia = {
    loaded: false,
    texture: null,
    width: 0,
    height: 0,
    type: null, // 'image' or 'video'
    element: null, // img or video element
    scale: 1.0
};

// Fluid Background Camera System (separate from main camera input mode)
let fluidBackgroundCamera = {
    active: false,
    stream: null,
    video: null,
    texture: null,
    width: 0,
    height: 0,
    scale: 1.0
};

// Audio Blob System
let audioBlobState = {
    active: false,
    audioContext: null,
    analyser: null,
    microphone: null,
    dataArray: null,
    frequencyData: null,
    canvas: null,
    gl: null,
    animationId: null,
    
    // Visual properties
    color: { r: 0, g: 0.831, b: 1 }, // Default cyan
    baseColor: { r: 0, g: 0.831, b: 1 }, // Store original color for cycling
    
    // Control properties
    reactivity: 2.0,     // 0.1-3.0 range - How much audio affects the blob
    delay: 0,            // 0-500ms range - Audio delay in milliseconds
    opacity: 0.8,        // 0-1 range - Blob opacity
    colorful: 0.3,       // 0-1 range - Color cycling intensity
    edgeSoftness: 0.25,  // 0-1 range - Blob edge softness
    
    // Audio processing nodes
    delayNode: null,     // DelayNode for audio delay
    previewGain: null,   // GainNode for audio preview (muted by default)
    
    // Shader program
    shaderProgram: null,
    uniforms: {}
};

// Idle Animation System
let idleAnimationEnabled = true;
let lastActivityTime = Date.now();
let idleAnimationTimer = null;
const IDLE_TIMEOUT = 5000; // 5 seconds
const IDLE_SPARK_MIN_INTERVAL = 1500; // 1.5 seconds
const IDLE_SPARK_MAX_INTERVAL = 4000; // 4 seconds

function pointerPrototype () {
    this.id = -1;
    this.texcoordX = 0;
    this.texcoordY = 0;
    this.prevTexcoordX = 0;
    this.prevTexcoordY = 0;
    this.deltaX = 0;
    this.deltaY = 0;
    this.down = false;
    this.moved = false;
    this.color = [30, 0, 300];
}

let pointers = [];
let splatStack = [];
pointers.push(new pointerPrototype());

const { gl, ext } = getWebGLContext(canvas);

if (isMobile()) {
    config.DYE_RESOLUTION = 512;
}
if (!ext.supportLinearFiltering) {
    config.DYE_RESOLUTION = 512;
    config.SHADING = false;
    config.BLOOM = false;
    config.SUNRAYS = false;
}

// Wait for DOM to be ready before initializing UI
document.addEventListener('DOMContentLoaded', () => {
    startGUI();
    initializeCursorIndicator();
    // Start idle animation immediately on page load
    setTimeout(() => {
        if (Date.now() - lastActivityTime >= IDLE_TIMEOUT) {
            startIdleAnimation();
        }
    }, IDLE_TIMEOUT);
});

function getWebGLContext (canvas) {
    const params = { alpha: true, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false };

    let gl = canvas.getContext('webgl2', params);
    const isWebGL2 = !!gl;
    if (!isWebGL2)
        gl = canvas.getContext('webgl', params) || canvas.getContext('experimental-webgl', params);

    let halfFloat;
    let supportLinearFiltering;
    if (isWebGL2) {
        gl.getExtension('EXT_color_buffer_float');
        supportLinearFiltering = gl.getExtension('OES_texture_float_linear');
    } else {
        halfFloat = gl.getExtension('OES_texture_half_float');
        supportLinearFiltering = gl.getExtension('OES_texture_half_float_linear');
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    const halfFloatTexType = isWebGL2 ? gl.HALF_FLOAT : halfFloat.HALF_FLOAT_OES;
    let formatRGBA;
    let formatRG;
    let formatR;

    if (isWebGL2)
    {
        formatRGBA = getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, halfFloatTexType);
        formatRG = getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloatTexType);
        formatR = getSupportedFormat(gl, gl.R16F, gl.RED, halfFloatTexType);
    }
    else
    {
        formatRGBA = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
        formatRG = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
        formatR = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
    }

    ga('send', 'event', isWebGL2 ? 'webgl2' : 'webgl', formatRGBA == null ? 'not supported' : 'supported');

    return {
        gl,
        ext: {
            formatRGBA,
            formatRG,
            formatR,
            halfFloatTexType,
            supportLinearFiltering
        }
    };
}

function getSupportedFormat (gl, internalFormat, format, type)
{
    if (!supportRenderTextureFormat(gl, internalFormat, format, type))
    {
        switch (internalFormat)
        {
            case gl.R16F:
                return getSupportedFormat(gl, gl.RG16F, gl.RG, type);
            case gl.RG16F:
                return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type);
            default:
                return null;
        }
    }

    return {
        internalFormat,
        format
    }
}

function supportRenderTextureFormat (gl, internalFormat, format, type) {
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);

    let fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

    let status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    return status == gl.FRAMEBUFFER_COMPLETE;
}

// Modern UI Control System - No external dependencies
function startGUI () {
    // Core quality settings - hidden, fixed at high quality
    // DYE_RESOLUTION is fixed at 1024 (high quality) for optimal visuals
    // SIM_RESOLUTION is fixed at 256 for optimal performance
    // SHADING is always enabled for 3D lighting effects
    
    // Initialize modern UI handlers
    initializeModernUI();
    
    // Mobile performance optimizations
    if (isMobile()) {
        config.DYE_RESOLUTION = 512; // Default to medium quality on mobile
        config.BLOOM_ITERATIONS = 4;  // Reduce bloom iterations for mobile
    }
}

// Modern UI Event Handlers
function initializeModernUI() {
    // Add slider drag functionality
    addSliderDragHandlers();
    
    // Initialize toggle states
    updateToggleStates();
    
    // Initialize slider positions
    updateSliderPositions();
}

function addSliderDragHandlers() {
    const sliders = ['density', 'velocity', 'pressure', 'vorticity', 'splat', 'bloomIntensity', 'sunray', 'denoiseX', 'denoiseY', 'denoiseZ', 'inferenceSteps', 'seed', 'controlnetPose', 'controlnetHed', 'controlnetCanny', 'controlnetDepth', 'controlnetColor', 'guidanceScale', 'delta', 'animationInterval', 'chaos', 'breathing', 'colorLife', 'backgroundImageScale', 'mediaScale', 'fluidMediaScale', 'fluidCameraScale', 'streamOpacity', 'audioReactivity', 'audioDelay', 'audioOpacity', 'audioColorful', 'audioEdgeSoftness', 'telegramWaitlistInterval'];
    
    sliders.forEach(slider => {
        const handle = document.getElementById(slider + 'Handle');
        const container = document.getElementById(slider + 'Fill');
        const sliderContainer = container ? container.parentElement : null;
        if (handle && container && sliderContainer) {
            let isDragging = false;
            
            handle.addEventListener('mousedown', (e) => {
                isDragging = true;
                e.preventDefault();
                // Immediately update slider position on mouse down
                updateSliderFromMouse(e, slider);
            });
            
            document.addEventListener('mousemove', (e) => {
                if (isDragging) {
                    updateSliderFromMouse(e, slider);
                }
            });
            
            document.addEventListener('mouseup', () => {
                isDragging = false;
            });
            
            // Touch support for handle
            handle.addEventListener('touchstart', (e) => {
                isDragging = true;
                e.preventDefault();
                e.stopPropagation(); // Prevent event bubbling
                // Immediately update slider position on touch start
                updateSliderFromTouch(e, slider);
            }, { passive: false }); // Need preventDefault for slider
            
            // Global touch move and end handlers
            document.addEventListener('touchmove', (e) => {
                if (isDragging) {
                    e.preventDefault(); // Prevent scrolling while dragging
                    updateSliderFromTouch(e, slider);
                }
            }, { passive: false }); // Need preventDefault to stop scrolling
            
            document.addEventListener('touchend', (e) => {
                if (isDragging) {
                    isDragging = false;
                    e.preventDefault();
                }
            }, { passive: false });
            
            // Add immediate response on container click/touch
            sliderContainer.addEventListener('mousedown', (e) => {
                if (e.target === sliderContainer || e.target === container) {
                    isDragging = true;
                    e.preventDefault();
                    e.stopPropagation();
                    updateSliderFromMouse(e, slider);
                }
            });
            
            sliderContainer.addEventListener('touchstart', (e) => {
                if (e.target === sliderContainer || e.target === container) {
                    isDragging = true;
                    e.preventDefault();
                    e.stopPropagation(); // Prevent event bubbling
                    updateSliderFromTouch(e, slider);
                }
            }, { passive: false }); // Need preventDefault for slider
        }
    });
}

function updateSliderFromMouse(e, sliderName) {
    const fillElement = document.getElementById(sliderName + 'Fill');
    if (!fillElement) return;
    
    const container = fillElement.parentElement;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const rawPercentage = Math.max(0, Math.min(1, x / rect.width));
    
    // Convert visual percentage back to actual percentage, accounting for handle padding
    const percentage = Math.max(0, Math.min(1, (rawPercentage - SLIDER_HANDLE_PADDING) / (1 - 2 * SLIDER_HANDLE_PADDING)));
    
    updateSliderValue(sliderName, percentage);
}

function updateSliderFromTouch(e, sliderName) {
    const fillElement = document.getElementById(sliderName + 'Fill');
    if (!fillElement) return;
    
    const container = fillElement.parentElement;
    const rect = container.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const rawPercentage = Math.max(0, Math.min(1, x / rect.width));
    
    // Convert visual percentage back to actual percentage, accounting for handle padding
    const percentage = Math.max(0, Math.min(1, (rawPercentage - SLIDER_HANDLE_PADDING) / (1 - 2 * SLIDER_HANDLE_PADDING)));
    
    updateSliderValue(sliderName, percentage);
}

function handleSliderClick(event, sliderName, min, max) {
    if (isMobile()) {
        console.log('🔍 MOBILE DEBUG: Slider click for', sliderName, 'event type:', event.type);
        console.log('🔍 Event target:', event.target.className, event.currentTarget.className);
    }
    
    event.stopPropagation(); // Prevent event bubbling
    event.preventDefault(); // Prevent default behavior
    
    const rect = event.currentTarget.getBoundingClientRect();
    let x;
    
    // Handle both mouse and touch events
    if (event.touches && event.touches.length > 0) {
        x = event.touches[0].clientX - rect.left;
    } else if (event.changedTouches && event.changedTouches.length > 0) {
        x = event.changedTouches[0].clientX - rect.left;
    } else {
        x = event.clientX - rect.left;
    }
    
    const rawPercentage = Math.max(0, Math.min(1, x / rect.width));
    
    // Convert visual percentage back to actual percentage, accounting for handle padding
    const percentage = Math.max(0, Math.min(1, (rawPercentage - SLIDER_HANDLE_PADDING) / (1 - 2 * SLIDER_HANDLE_PADDING)));
    
    updateSliderValue(sliderName, percentage);
}

function updateSliderValue(sliderName, percentage, skipSave = false, updateInput = true) {
    // Ensure percentage is between 0 and 1
    percentage = Math.min(1, Math.max(0, percentage));
    
    const sliderMap = {
        'density': { min: 0, max: 4, prop: 'DENSITY_DISSIPATION', decimals: 2 },
        'velocity': { min: 0, max: 4, prop: 'VELOCITY_DISSIPATION', decimals: 2 },
        'pressure': { min: 0, max: 1, prop: 'PRESSURE', decimals: 2 },
        'vorticity': { min: 0, max: 50, prop: 'CURL', decimals: 0 },
        'splat': { min: 0.01, max: 1, prop: 'SPLAT_RADIUS', decimals: 2 },
        'bloomIntensity': { min: 0.1, max: 2, prop: 'BLOOM_INTENSITY', decimals: 2 },
        'sunray': { min: 0.3, max: 1, prop: 'SUNRAYS_WEIGHT', decimals: 2 },
        'denoiseX': { min: 0, max: 45, prop: 'DENOISE_X', decimals: 0 },
        'denoiseY': { min: 0, max: 45, prop: 'DENOISE_Y', decimals: 0 },
        'denoiseZ': { min: 0, max: 45, prop: 'DENOISE_Z', decimals: 0 },
        'inferenceSteps': { min: 1, max: 100, prop: 'INFERENCE_STEPS', decimals: 0 },
        'seed': { min: 0, max: 1000, prop: 'SEED', decimals: 0 },
        'controlnetPose': { min: 0, max: 1, prop: 'CONTROLNET_POSE_SCALE', decimals: 2 },
        'controlnetHed': { min: 0, max: 1, prop: 'CONTROLNET_HED_SCALE', decimals: 2 },
        'controlnetCanny': { min: 0, max: 1, prop: 'CONTROLNET_CANNY_SCALE', decimals: 2 },
        'controlnetDepth': { min: 0, max: 1, prop: 'CONTROLNET_DEPTH_SCALE', decimals: 2 },
        'controlnetColor': { min: 0, max: 1, prop: 'CONTROLNET_COLOR_SCALE', decimals: 2 },
        'guidanceScale': { min: 1, max: 20, prop: 'GUIDANCE_SCALE', decimals: 1 },
        'delta': { min: 0, max: 1, prop: 'DELTA', decimals: 2 },
        'liveliness': { min: 0, max: 1, prop: 'LIVELINESS', decimals: 2 },
        'chaos': { min: 0, max: 1, prop: 'CHAOS', decimals: 2 },
        'breathing': { min: 0, max: 1, prop: 'BREATHING', decimals: 2 },
        'colorLife': { min: 0, max: 1, prop: 'COLOR_LIFE', decimals: 2 },
        'animationInterval': { min: 0, max: 1, prop: 'ANIMATION_INTERVAL', decimals: 2 },
        'backgroundImageScale': { min: 0.1, max: 2.0, prop: 'BACKGROUND_IMAGE_SCALE', decimals: 2 },
        'mediaScale': { min: 0.1, max: 2.0, prop: 'MEDIA_SCALE', decimals: 2, handler: updateMediaScale },
        'fluidMediaScale': { min: 0.1, max: 2.0, prop: 'FLUID_MEDIA_SCALE', decimals: 2, handler: updateFluidMediaScale },
        'fluidCameraScale': { min: 0.1, max: 2.0, prop: 'FLUID_CAMERA_SCALE', decimals: 2, handler: updateFluidCameraScale },
        'tIndexList': { min: 0, max: 50, prop: 'T_INDEX_LIST', decimals: 0, isArray: true },
        'audioReactivity': { min: 0.1, max: 3.0, prop: 'AUDIO_REACTIVITY', decimals: 1, handler: updateAudioReactivity },
        'audioDelay': { min: 0, max: 500, prop: 'AUDIO_DELAY', decimals: 0, handler: updateAudioDelay },
        'audioOpacity': { min: 0, max: 1, prop: 'AUDIO_OPACITY', decimals: 2, handler: updateAudioOpacity },
        'audioColorful': { min: 0, max: 1, prop: 'AUDIO_COLORFUL', decimals: 1, handler: updateAudioColorful },
        'audioEdgeSoftness': { min: 0, max: 1, prop: 'AUDIO_EDGE_SOFTNESS', decimals: 2, handler: updateAudioEdgeSoftness },
        'streamOpacity': { min: 0, max: 1, prop: 'STREAM_OPACITY', decimals: 2, handler: updateStreamOpacity },
        'telegramWaitlistInterval': { min: 1, max: 30, prop: 'TELEGRAM_WAITLIST_INTERVAL', decimals: 0, handler: updateTelegramWaitlistInterval }
    };
    
    const slider = sliderMap[sliderName];
    if (!slider) return;
    
    const value = slider.min + (slider.max - slider.min) * percentage;
    
    // Handle special array case for T_INDEX_LIST
    if (slider.isArray && slider.prop === 'T_INDEX_LIST') {
        // Generate array based on slider value (middle index)
        const middleIndex = Math.round(value);
        const step = Math.max(1, Math.floor(middleIndex / 3));
        config[slider.prop] = [0, middleIndex, Math.min(middleIndex * 2, 50)];
    } else {
        config[slider.prop] = value;
    }
    
    // Call custom handler if defined (for audio controls)
    if (slider.handler && typeof slider.handler === 'function') {
        slider.handler(value);
    }
    
    // Special handling for background media scale
    if (sliderName === 'backgroundImageScale' && backgroundMedia.loaded) {
        if (backgroundMedia.type === 'image' && backgroundMedia.originalDataURL) {
            // Regenerate the entire image with the new scale
            loadBackgroundImage(backgroundMedia.originalDataURL);
        }
        // For videos, scaling is handled in the shader via uniforms - no action needed here
    }
    
    // Update UI
    const fill = document.getElementById(sliderName + 'Fill');
    const valueDisplay = document.getElementById(sliderName + 'Value');
    
    if (fill) {
        // Convert percentage (0-1) to percentage display (0-100) and adjust for handle padding
        const displayPercentage = SLIDER_HANDLE_PADDING * 100 + (percentage * (100 - 2 * SLIDER_HANDLE_PADDING * 100));
        fill.style.width = displayPercentage + '%';
    }
    
    if (valueDisplay && updateInput) {
        if (slider.isArray && slider.prop === 'T_INDEX_LIST') {
            valueDisplay.value = '[' + config[slider.prop].join(',') + ']';
        } else {
            valueDisplay.value = value.toFixed(slider.decimals);
        }
    }
    
    // Save to localStorage only if not loading from storage
    if (!skipSave) {
        saveConfig();
    }
}

function updateSliderPositions() {
    const sliderMap = {
        'density': { prop: 'DENSITY_DISSIPATION', min: 0, max: 4 },
        'velocity': { prop: 'VELOCITY_DISSIPATION', min: 0, max: 4 },
        'pressure': { prop: 'PRESSURE', min: 0, max: 1 },
        'vorticity': { prop: 'CURL', min: 0, max: 50 },
        'splat': { prop: 'SPLAT_RADIUS', min: 0.01, max: 1 },
        'bloomIntensity': { prop: 'BLOOM_INTENSITY', min: 0.1, max: 2 },
        'sunray': { prop: 'SUNRAYS_WEIGHT', min: 0.3, max: 1 },
        'denoiseX': { prop: 'DENOISE_X', min: 0, max: 45 },
        'denoiseY': { prop: 'DENOISE_Y', min: 0, max: 45 },
        'denoiseZ': { prop: 'DENOISE_Z', min: 0, max: 45 },
        'inferenceSteps': { prop: 'INFERENCE_STEPS', min: 1, max: 100 },
        'seed': { prop: 'SEED', min: 0, max: 1000 },
        'controlnetPose': { prop: 'CONTROLNET_POSE_SCALE', min: 0, max: 1 },
        'controlnetHed': { prop: 'CONTROLNET_HED_SCALE', min: 0, max: 1 },
        'controlnetCanny': { prop: 'CONTROLNET_CANNY_SCALE', min: 0, max: 1 },
        'controlnetDepth': { prop: 'CONTROLNET_DEPTH_SCALE', min: 0, max: 1 },
        'controlnetColor': { prop: 'CONTROLNET_COLOR_SCALE', min: 0, max: 1 },
        'guidanceScale': { prop: 'GUIDANCE_SCALE', min: 1, max: 20 },
        'delta': { prop: 'DELTA', min: 0, max: 1 },
        'liveliness': { prop: 'LIVELINESS', min: 0, max: 1 },
        'chaos': { prop: 'CHAOS', min: 0, max: 1 },
        'breathing': { prop: 'BREATHING', min: 0, max: 1 },
        'colorLife': { prop: 'COLOR_LIFE', min: 0, max: 1 },
        'animationInterval': { prop: 'ANIMATION_INTERVAL', min: 0, max: 1 },
        'backgroundImageScale': { prop: 'BACKGROUND_IMAGE_SCALE', min: 0.1, max: 2.0 },
        'mediaScale': { prop: 'MEDIA_SCALE', min: 0.1, max: 2.0 },
        'fluidMediaScale': { prop: 'FLUID_MEDIA_SCALE', min: 0.1, max: 2.0 },
        'fluidCameraScale': { prop: 'FLUID_CAMERA_SCALE', min: 0.1, max: 2.0 },
        'tIndexList': { prop: 'T_INDEX_LIST', min: 0, max: 50, isArray: true },
        'audioReactivity': { prop: 'AUDIO_REACTIVITY', min: 0.1, max: 3.0 },
        'audioDelay': { prop: 'AUDIO_DELAY', min: 0, max: 500 },
        'audioOpacity': { prop: 'AUDIO_OPACITY', min: 0, max: 1 },
        'audioColorful': { prop: 'AUDIO_COLORFUL', min: 0, max: 1 },
        'audioEdgeSoftness': { prop: 'AUDIO_EDGE_SOFTNESS', min: 0, max: 1 },
        'telegramWaitlistInterval': { prop: 'TELEGRAM_WAITLIST_INTERVAL', min: 1, max: 30 }
    };
    
    Object.keys(sliderMap).forEach(sliderName => {
        const slider = sliderMap[sliderName];
        let percentage;
        
        if (slider.isArray && slider.prop === 'T_INDEX_LIST') {
            // For T_INDEX_LIST, use the middle value to determine percentage
            const middleValue = Array.isArray(config[slider.prop]) ? config[slider.prop][1] || 8 : 8;
            percentage = (middleValue - slider.min) / (slider.max - slider.min);
        } else {
            // Handle undefined config values gracefully
            const configValue = config[slider.prop];
            if (configValue === undefined || configValue === null || isNaN(configValue)) {
                // Use default value (middle of range) for undefined properties
                const defaultValue = slider.min + (slider.max - slider.min) * 0.5;
                config[slider.prop] = defaultValue;
                percentage = 0.5;
                console.warn(`Config property ${slider.prop} was undefined, using default value: ${defaultValue}`);
            } else {
                percentage = (configValue - slider.min) / (slider.max - slider.min);
            }
        }
        
        updateSliderValue(sliderName, percentage, true); // Skip saving when loading
    });
}

function updateToggleStates() {
    updateToggle('colorfulToggle', config.COLORFUL);
    updateToggle('pausedToggle', config.PAUSED);
    updateToggle('animateToggle', config.ANIMATE);
    updateToggle('hideCursorToggle', config.HIDE_CURSOR);
    updateToggle('bloomToggle', config.BLOOM);
    updateToggle('sunraysToggle', config.SUNRAYS);
    updateToggle('velocityDrawingToggle', config.VELOCITY_DRAWING);
    updateToggle('forceClickToggle', config.FORCE_CLICK);
    updateToggle('debugToggle', config.DEBUG_MODE);
    
    // Apply cursor hiding CSS class if needed
    if (config.HIDE_CURSOR) {
        document.body.classList.add('hide-cursor');
    } else {
        document.body.classList.remove('hide-cursor');
    }
    
    // Update cursor indicator visibility
    if (cursorIndicator) {
        cursorIndicator.style.display = config.HIDE_CURSOR ? 'block' : 'none';
    }
}

function updateToggle(toggleId, state) {
    const toggle = document.getElementById(toggleId);
    if (toggle) {
        if (state) {
            toggle.classList.add('active');
        } else {
            toggle.classList.remove('active');
        }
    }
}

// Toggle Functions
function togglePanel() {
    const panel = document.getElementById('controlPanel');
    panel.classList.toggle('collapsed');
    
    // Close color picker when panel is collapsed (especially important on tablets)
    if (panel.classList.contains('collapsed') && typeof Coloris !== 'undefined') {
        Coloris.close();
    }
}

function togglePanelVisibility() {
    const panel = document.getElementById('controlPanel');
    if (panel.style.display === 'none') {
        panel.style.display = 'block';
    } else {
        panel.style.display = 'none';
        // Close color picker when panel is hidden (especially important on tablets)
        if (typeof Coloris !== 'undefined') {
            Coloris.close();
        }
    }
}

function toggleFullscreen() {
    const doc = document.documentElement;
    const isFullscreen = document.fullscreenElement || 
                        document.webkitFullscreenElement || 
                        document.mozFullScreenElement || 
                        document.msFullscreenElement;
    
    if (!isFullscreen) {
        // Enter fullscreen
        if (doc.requestFullscreen) {
            doc.requestFullscreen().catch(err => {
                console.log('Fullscreen request failed:', err);
                showFullscreenFeedback('Fullscreen not supported');
            });
        } else if (doc.webkitRequestFullscreen) {
            // Safari
            doc.webkitRequestFullscreen().catch(err => {
                console.log('Webkit fullscreen request failed:', err);
                showFullscreenFeedback('Fullscreen not supported on this device');
            });
        } else if (doc.mozRequestFullScreen) {
            // Firefox
            doc.mozRequestFullScreen().catch(err => {
                console.log('Mozilla fullscreen request failed:', err);
                showFullscreenFeedback('Fullscreen not supported');
            });
        } else if (doc.msRequestFullscreen) {
            // IE/Edge
            doc.msRequestFullscreen().catch(err => {
                console.log('MS fullscreen request failed:', err);
                showFullscreenFeedback('Fullscreen not supported');
            });
        } else {
            // Fallback for unsupported browsers
            showFullscreenFeedback('Fullscreen not supported on this device');
        }
    } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
            document.exitFullscreen().catch(err => {
                console.log('Exit fullscreen failed:', err);
            });
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen().catch(err => {
                console.log('Webkit exit fullscreen failed:', err);
            });
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen().catch(err => {
                console.log('Mozilla exit fullscreen failed:', err);
            });
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen().catch(err => {
                console.log('MS exit fullscreen failed:', err);
            });
        }
    }
}

function showFullscreenFeedback(message) {
    // Show a temporary message to the user
    const button = document.getElementById('fullscreenToggleButton');
    if (button) {
        const originalTooltip = button.querySelector('.tooltiptext').textContent;
        button.querySelector('.tooltiptext').textContent = message;
        
        // Reset tooltip after 2 seconds
        setTimeout(() => {
            button.querySelector('.tooltiptext').textContent = originalTooltip;
        }, 2000);
    }
}

function updateFullscreenButton() {
    const icon = document.getElementById('fullscreenIcon');
    const tooltip = document.getElementById('fullscreenTooltip');
    
    if (!icon || !tooltip) return;
    
    const isFullscreen = document.fullscreenElement || 
                        document.webkitFullscreenElement || 
                        document.mozFullScreenElement || 
                        document.msFullscreenElement;
    
    if (isFullscreen) {
        icon.className = 'fas fa-compress';
        tooltip.textContent = 'Exit Fullscreen';
    } else {
        icon.className = 'fas fa-expand';
        tooltip.textContent = 'Enter Fullscreen';
    }
}

// Safe wrapper functions for mobile compatibility
function safeTogglePanel(event) {
    try {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        if (isMobile()) {
            console.log('🔍 MOBILE DEBUG: Panel toggle called');
        }
        togglePanel();
    } catch (error) {
        console.error('Error in safeTogglePanel:', error);
    }
}

function safeToggleStream(event) {
    try {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        if (isMobile()) {
            console.log('🔍 MOBILE DEBUG: Stream toggle called');
        }
        toggleStream();
    } catch (error) {
        console.error('Error in safeToggleStream:', error);
    }
}

function safeToggleNegativePrompt(event) {
    try {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        if (isMobile()) {
            console.log('🔍 MOBILE DEBUG: Negative prompt toggle called');
        }
        toggleNegativePrompt();
    } catch (error) {
        console.error('Error in safeToggleNegativePrompt:', error);
    }
}

function safeToggleFluidDrawing(event) {
    try {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        if (isMobile()) {
            console.log('🔍 MOBILE DEBUG: Fluid drawing toggle called');
        }
        toggleFluidDrawing();
    } catch (error) {
        console.error('Error in safeToggleFluidDrawing:', error);
    }
}

function safeToggleAudioBlob(event) {
    try {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        if (isMobile()) {
            console.log('🔍 MOBILE DEBUG: Audio blob toggle called');
        }
        toggleAudioBlob();
    } catch (error) {
        console.error('Error in safeToggleAudioBlob:', error);
    }
}

// Ensure global availability of safe functions for mobile
window.safeTogglePanel = safeTogglePanel;
window.safeToggleStream = safeToggleStream;
window.safeToggleNegativePrompt = safeToggleNegativePrompt;
window.safeToggleFluidDrawing = safeToggleFluidDrawing;
window.safeToggleAudioBlob = safeToggleAudioBlob;

// Also ensure toggle functions are globally available
window.toggleDebug = toggleDebug;

// Ensure original functions are globally available as fallback (deferred)
function ensureGlobalFunctions() {
    if (typeof toggleStream !== 'undefined') window.toggleStream = toggleStream;
    if (typeof toggleNegativePrompt !== 'undefined') window.toggleNegativePrompt = toggleNegativePrompt;
    if (typeof toggleFluidDrawing !== 'undefined') window.toggleFluidDrawing = toggleFluidDrawing;
    if (typeof toggleAudioBlob !== 'undefined') window.toggleAudioBlob = toggleAudioBlob;
}

// Make togglePanel available immediately since it's defined above
window.togglePanel = togglePanel;

// Mobile debugging - log function availability
if (isMobile()) {
    console.log('🔍 MOBILE DEBUG: Function availability check:');
    console.log('🔍 safeTogglePanel:', typeof window.safeTogglePanel);
    console.log('🔍 safeToggleStream:', typeof window.safeToggleStream);
    console.log('🔍 safeToggleFluidDrawing:', typeof window.safeToggleFluidDrawing);
    console.log('🔍 safeToggleAudioBlob:', typeof window.safeToggleAudioBlob);
}

// Mobile pull-down gesture to close control panel
function initializeMobilePanelGestures() {
    // Skip if not mobile or already initialized
    if (!isMobile()) return;
    
    console.log('🔍 MOBILE DEBUG: Initializing mobile panel gestures');
    
    try {
        const panel = document.getElementById('controlPanel');
        const panelHeader = document.querySelector('.panel-header');
        const panelContent = document.querySelector('.panel-content');
        
        console.log('🔍 MOBILE DEBUG: Panel elements found:', {
            panel: !!panel,
            panelHeader: !!panelHeader,
            panelContent: !!panelContent,
            panelCollapsed: panel ? panel.classList.contains('collapsed') : 'N/A'
        });
        
        if (!panel || !panelHeader) {
            console.log('🔍 MOBILE DEBUG: Missing panel elements, aborting gesture setup');
            return;
        }
        
        let startY = 0;
        let startTime = 0;
        let isDragging = false;
        let startScrollTop = 0;
        
        // Only add gesture to header to avoid conflicts with content scrolling
        setupGestureHandlers(panelHeader, panel, true);
        
        function setupGestureHandlers(element, panel, isHeader) {
            // Use AbortController for proper cleanup
            const controller = new AbortController();
            const signal = controller.signal;
            
            element.addEventListener('touchstart', (e) => {
                try {
                    // Only handle if panel is expanded (not collapsed)
                    if (!e.touches || e.touches.length === 0 || panel.classList.contains('collapsed')) return;
                    
                    startY = e.touches[0].clientY;
                    startTime = Date.now();
                    isDragging = false;
                } catch (err) {
                    console.warn('Touch start error:', err);
                }
            }, { passive: true, signal });
            
            element.addEventListener('touchmove', (e) => {
                try {
                    if (!e.touches || e.touches.length === 0 || panel.classList.contains('collapsed')) return;
                    
                    const currentY = e.touches[0].clientY;
                    const deltaY = currentY - startY;
                    
                    // Only track significant downward movement
                    if (deltaY > 15) {
                        isDragging = true;
                    }
                } catch (err) {
                    console.warn('Touch move error:', err);
                }
            }, { passive: true, signal });
            
            element.addEventListener('touchend', (e) => {
                try {
                    if (!e.changedTouches || e.changedTouches.length === 0 || panel.classList.contains('collapsed')) return;
                    
                    const endTime = Date.now();
                    const duration = endTime - startTime;
                    const endY = e.changedTouches[0].clientY;
                    const deltaY = endY - startY;
                    
                    // Close panel if dragged down significantly
                    const isValidPull = deltaY > 40 && duration < 500;
                    
                    if (isDragging && isValidPull) {
                        // Animate the collapse
                        panel.classList.add('collapsed');
                        // Close color picker when panel is closed via gesture (important on tablets)
                        if (typeof Coloris !== 'undefined') {
                            Coloris.close();
                        }
                        // Prevent the click event from firing
                        e.preventDefault();
                        e.stopPropagation();
                    }
                    
                    isDragging = false;
                } catch (err) {
                    console.warn('Touch end error:', err);
                }
            }, { passive: false }); // passive: false to allow preventDefault
        }
    } catch (err) {
        console.error('Failed to initialize mobile panel gestures:', err);
    }
}

function toggleColorful() {
    if (isMobile()) {
        console.log('🔍 MOBILE DEBUG: toggleColorful called, current value:', config.COLORFUL);
    }
    config.COLORFUL = !config.COLORFUL;
    updateToggle('colorfulToggle', config.COLORFUL);
    saveConfig();
}

function togglePaused() {
    if (isMobile()) {
        console.log('🔍 MOBILE DEBUG: togglePaused called, current value:', config.PAUSED);
    }
    config.PAUSED = !config.PAUSED;
    updateToggle('pausedToggle', config.PAUSED);
    saveConfig();
}

function toggleAnimate() {
    config.ANIMATE = !config.ANIMATE;
    updateToggle('animateToggle', config.ANIMATE);
    saveConfig();
    
    // Start or stop animation based on state
    if (config.ANIMATE && !config.PAUSED) {
        startIdleAnimation();
    } else if (idleAnimationTimer) {
        clearTimeout(idleAnimationTimer);
        idleAnimationTimer = null;
    }
}

function toggleHideCursor() {
    config.HIDE_CURSOR = !config.HIDE_CURSOR;
    updateToggle('hideCursorToggle', config.HIDE_CURSOR);
    
    // Apply or remove cursor hiding CSS class
    if (config.HIDE_CURSOR) {
        document.body.classList.add('hide-cursor');
    } else {
        document.body.classList.remove('hide-cursor');
    }
    
    // Update cursor indicator visibility
    if (cursorIndicator) {
        cursorIndicator.style.display = config.HIDE_CURSOR ? 'block' : 'none';
    }
    
    saveConfig();
}

// Cursor indicator functionality
let cursorIndicator = null;

function updateCursorIndicator(x, y) {
    if (cursorIndicator && config.HIDE_CURSOR) {
        cursorIndicator.style.left = x + 'px';
        cursorIndicator.style.top = y + 'px';
    }
}

function initializeCursorIndicator() {
    cursorIndicator = document.getElementById('cursorIndicator');
    if (!cursorIndicator) return;
    
    // Track mouse movement for cursor indicator
    document.addEventListener('mousemove', (e) => {
        updateCursorIndicator(e.clientX, e.clientY);
    });
}

function toggleBloom() {
    config.BLOOM = !config.BLOOM;
    updateToggle('bloomToggle', config.BLOOM);
    updateKeywords();
    saveConfig();
}

function toggleSunrays() {
    config.SUNRAYS = !config.SUNRAYS;
    updateToggle('sunraysToggle', config.SUNRAYS);
    updateKeywords();
    saveConfig();
}

function toggleVelocityDrawing() {
    if (isMobile()) {
        console.log('🔍 MOBILE DEBUG: toggleVelocityDrawing called, current value:', config.VELOCITY_DRAWING);
    }
    config.VELOCITY_DRAWING = !config.VELOCITY_DRAWING;
    updateToggle('velocityDrawingToggle', config.VELOCITY_DRAWING);
    saveConfig();
}

function toggleForceClick() {
    config.FORCE_CLICK = !config.FORCE_CLICK;
    updateToggle('forceClickToggle', config.FORCE_CLICK);
    saveConfig();
}

function toggleSettings() {
    const content = document.getElementById('settingsContent');
    const toggle = document.getElementById('settingsIcon');
    
    if (content.classList.contains('expanded')) {
        content.classList.remove('expanded');
        toggle.textContent = '▶';
    } else {
        content.classList.add('expanded');
        toggle.textContent = '▼';
    }
}

function toggleDebug() {
    config.DEBUG_MODE = !config.DEBUG_MODE;
    updateToggle('debugToggle', config.DEBUG_MODE);
    
    // Control mobile debug overlay visibility
    const debugOverlay = document.getElementById('mobileDebug');
    const oscMessagesDiv = document.getElementById('oscMessages');
    
    if (debugOverlay) {
        if (config.DEBUG_MODE) {
            debugOverlay.style.display = 'block';
            debugOverlay.style.setProperty('display', 'block', 'important');
            console.log('🔍 Debug mode enabled - OSC messages and debug overlay will be shown');
            // Set initial OSC section visibility (hidden since no messages yet)
            updateOSCSectionVisibility();
        } else {
            debugOverlay.style.display = 'none';
            debugOverlay.style.setProperty('display', 'none', 'important');
            // Clear OSC messages when debug is disabled
            if (oscMessagesDiv) {
                oscMessagesDiv.innerHTML = '';
                // Update OSC section visibility after clearing
                updateOSCSectionVisibility();
            }
            console.log('🔍 Debug mode disabled');
        }
    }
    
          saveConfig();
  }
  

  
  

function toggleNegativePrompt() {
    const content = document.getElementById('negativePromptContent');
    const toggle = document.getElementById('negativePromptIcon');
    
    if (content.classList.contains('expanded')) {
        content.classList.remove('expanded');
        toggle.textContent = '▶';
    } else {
        content.classList.add('expanded');
        toggle.textContent = '▼';
    }
}

function toggleTelegramReceive() {
    // Toggle the global state
    if (typeof config.TELEGRAM_RECEIVE === 'undefined') {
        config.TELEGRAM_RECEIVE = true; // Default to enabled
    }
    config.TELEGRAM_RECEIVE = !config.TELEGRAM_RECEIVE;
    
    // Update the UI toggle
    updateToggle('telegramReceiveToggle', config.TELEGRAM_RECEIVE);
    
    // Show/hide waitlist controls based on state
    updateTelegramControlsVisibility();
    
    // Save the setting
    saveTelegramSettings();
    
    console.log(`📱 Telegram receive ${config.TELEGRAM_RECEIVE ? 'enabled' : 'disabled'}`);
}



function generateTelegramQR(retryCount = 0) {
    const canvas = document.getElementById('telegramQRCanvas');
    if (!canvas) {
        console.error('QR Canvas element not found');
        return;
    }
    
    // Check if both token and username fields have values
    if (!validateTelegramFields()) {
        console.log('Token or username fields are empty, skipping QR generation');
        // Clear the canvas
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }
    
    // Use stored bot username or fallback to default
    const botUsername = telegramBotUsername || 'DiffusionPromptBot';
    const telegramBotUrl = `https://t.me/${botUsername}`;
    
    // Check if QRious library is loaded
    if (typeof QRious === 'undefined') {
        if (retryCount < 5) { // Limit to 5 retries (2.5 seconds)
            console.warn(`QRious library not loaded yet, retrying in 500ms... (${retryCount + 1}/5)`);
            setTimeout(() => generateTelegramQR(retryCount + 1), 500);
            return;
        } else {
            console.error('QRious library failed to load after 5 attempts');
            // Show fallback message
            const ctx = canvas.getContext('2d');
            canvas.width = 300;
            canvas.height = 300;
            ctx.fillStyle = '#ffeeee';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#cc0000';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('QR Library Failed to Load', canvas.width/2, canvas.height/2 - 20);
            ctx.font = '12px Arial';
            ctx.fillText(telegramBotUrl, canvas.width/2, canvas.height/2 + 10);
            return;
        }
    }
    
    console.log('📱 Generating QR code for:', telegramBotUrl);
    
    // Determine QR code size based on screen size
    const isMobile = window.innerWidth <= 768;
    const qrSize = isMobile ? 120 : 300;
    
    try {
        // Create QR code using QRious
        const qr = new QRious({
            element: canvas,
            value: telegramBotUrl,
            size: qrSize,
            background: 'white',
            foreground: 'black',
            level: 'M'
        });
        
        console.log('📱 Telegram QR code generated successfully with QRious');
        canvas.style.display = 'block';
        
    } catch (error) {
        console.error('Failed to generate QR code with QRious:', error);
        // Fallback: show error message on canvas
        const ctx = canvas.getContext('2d');
        canvas.width = qrSize;
        canvas.height = qrSize;
        ctx.fillStyle = '#ffcccc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ff0000';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('QR Generation Error:', canvas.width/2, canvas.height/2 - 20);
        ctx.font = '12px Arial';
        ctx.fillText(error.message, canvas.width/2, canvas.height/2);
        ctx.fillText(telegramBotUrl, canvas.width/2, canvas.height/2 + 20);
    }
}

function validateTelegramBotToken(token) {
    // Telegram bot token format: 8-10 digits, colon, 35 alphanumeric chars with underscores/hyphens
    const tokenPattern = /^[0-9]{8,10}:[a-zA-Z0-9_-]{35}$/;
    return tokenPattern.test(token);
}

async function fetchTelegramBotInfo(token) {
    try {
        console.log('📱 Fetching bot information from Telegram API...');
        const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
        const data = await response.json();
        
        if (data.ok && data.result) {
            console.log('📱 Bot info fetched successfully:', data.result);
            return {
                success: true,
                username: data.result.username,
                firstName: data.result.first_name,
                id: data.result.id
            };
        } else {
            console.error('📱 Telegram API error:', data.description || 'Unknown error');
            return {
                success: false,
                error: data.description || 'Invalid bot token'
            };
        }
    } catch (error) {
        console.error('📱 Network error fetching bot info:', error);
        return {
            success: false,
            error: 'Network error: Unable to connect to Telegram API'
        };
    }
}

// Store bot username in memory after API call
let telegramBotUsername = null;

async function fetchAndStoreBotUsername(token) {
    // Validate token format first
    if (!validateTelegramBotToken(token)) {
        console.log('📱 Invalid token format, skipping bot info fetch');
        telegramBotUsername = null;
        updateTelegramBotElements();
        return;
    }
    
    try {
        console.log('📱 Fetching bot information...');
        const botInfo = await fetchTelegramBotInfo(token);
        
        if (botInfo.success && botInfo.username) {
            telegramBotUsername = botInfo.username;
            console.log(`📱 Bot username fetched: ${telegramBotUsername}`);
            
            // Update UI elements with new username
            updateTelegramBotElements();
            
        } else {
            console.error('📱 Failed to fetch bot info:', botInfo.error);
            telegramBotUsername = null;
            updateTelegramBotElements();
        }
    } catch (error) {
        console.error('📱 Error fetching bot info:', error);
        telegramBotUsername = null;
        updateTelegramBotElements();
    }
}

function validateTelegramFields() {
    const tokenInput = document.getElementById('telegramTokenInput');
    const hasToken = tokenInput && tokenInput.value.trim().length > 0;
    const hasUsername = telegramBotUsername && telegramBotUsername.length > 0;
    
    return hasToken && hasUsername;
}

function updateTelegramBotElements() {
    // Use stored bot username or fallback to default
    const botUsername = telegramBotUsername || 'DiffusionPromptBot';
    
    // Check if both token and username are available
    const fieldsValid = validateTelegramFields();
    
    // Update bot link
    const botLink = document.getElementById('telegramBotLink');
    if (botLink) {
        botLink.href = `https://t.me/${botUsername}`;
        botLink.closest('.control-item').style.display = fieldsValid ? 'block' : 'none';
    }
    
    // Update bot display name
    const botDisplayName = document.getElementById('telegramBotDisplayName');
    if (botDisplayName) {
        botDisplayName.textContent = `@${botUsername}`;
    }
    
    // Update QR code section visibility
    const qrSection = document.getElementById('telegramQRContent');
    if (qrSection) {
        qrSection.style.display = fieldsValid ? 'block' : 'none';
    }
    
    // Generate QR code if fields are valid
    if (fieldsValid) {
        generateTelegramQR();
    }
    
    console.log(`📱 Updated Telegram bot elements for: @${botUsername} (visible: ${fieldsValid})`);
}

// Add event listener to fetch bot info when token changes
document.addEventListener('DOMContentLoaded', function() {
    const tokenInput = document.getElementById('telegramTokenInput');
    
    if (tokenInput) {
        // Clear stored username when token changes
        tokenInput.addEventListener('input', function() {
            telegramBotUsername = null;
            updateTelegramBotElements();
        });
        
        // Fetch bot info with debouncing
        let fetchTimeout;
        tokenInput.addEventListener('input', function() {
            clearTimeout(fetchTimeout);
            const token = this.value.trim();
            
            if (token.length > 0) {
                // Debounce the fetch to avoid excessive API calls
                fetchTimeout = setTimeout(() => {
                    fetchAndStoreBotUsername(token);
                }, 1000); // Wait 1 second after user stops typing
            } else {
                // Clear username if token is empty
                telegramBotUsername = null;
                updateTelegramBotElements();
            }
        });
        
        // Also trigger on blur for immediate response
        tokenInput.addEventListener('blur', function() {
            clearTimeout(fetchTimeout);
            const token = this.value.trim();
            if (token.length > 0) {
                fetchAndStoreBotUsername(token);
            }
        });
    }
});

// Telegram Waitlist System - Server-Only Management
// Client now only applies prompts when instructed by server

function updateTelegramControlsVisibility() {
    const isVisible = config.TELEGRAM_RECEIVE === true;
    const displayValue = isVisible ? 'block' : 'none';
    
    // Control visibility of individual Telegram elements
    const waitlistControls = document.getElementById('telegramWaitlistControls');
    const clearButton = document.getElementById('telegramClearButton');
    const qrContent = document.getElementById('telegramQRContent');
    
    if (waitlistControls) waitlistControls.style.display = displayValue;
    if (clearButton) clearButton.style.display = displayValue;
    if (qrContent) qrContent.style.display = displayValue;
    
    // Find and hide/show the Bot Token section
    const telegramTokenInput = document.getElementById('telegramTokenInput');
    if (telegramTokenInput) {
        const botTokenSection = telegramTokenInput.closest('.control-item');
        if (botTokenSection) botTokenSection.style.display = displayValue;
    }
    
    // Find and hide/show the Telegram Bot Link section
    const telegramBotLink = document.getElementById('telegramBotLink');
    if (telegramBotLink) {
        const botLinkSection = telegramBotLink.closest('.control-item');
        if (botLinkSection) botLinkSection.style.display = displayValue;
    }
}

function updateTelegramWaitlistInterval(value) {
    // Ensure we store and send integer values
    const intValue = Math.round(value);
    config.TELEGRAM_WAITLIST_INTERVAL = intValue;
    console.log(`📱 Telegram waitlist interval set to ${intValue} seconds`);
    
    // Add to debug log
    addTelegramMessageToDebug({
        type: 'telegram_waitlist_interval_changed',
        interval: intValue
    });
    
    // Notify server of interval change
    sendToServer({
        type: 'telegram_waitlist_interval_changed',
        interval: intValue
    });
    
    // Save settings
    saveTelegramSettings();
}

function addToTelegramWaitlist(message) {
    // Add to debug log
    addTelegramMessageToDebug({
        type: 'telegram_waitlist_added',
        prompt: message.prompt,
        from: message.from,
        messageType: message.type || 'telegram_prompt'
    });
    
    const waitlistEntry = {
        prompt: message.prompt,
        from: message.from,
        timestamp: new Date().toLocaleString(),
        id: Date.now() + Math.random(), // Simple unique ID
        chatId: message.chatId, // Store for server feedback
        addedAt: Date.now(), // Add timestamp for smart processing
        type: message.type || 'telegram_prompt', // Store message type
        // Store additional data for ControlNet presets
        ...(message.type === 'controlnet_preset' ? {
            presetName: message.presetName,
            presetDisplayName: message.presetDisplayName,
            presetDescription: message.presetDescription,
            parameters: message.parameters
        } : {})
    };
    
    // Handle different types of prompts
    if (message.type === 'controlnet_preset') {
        // Apply ControlNet preset parameters
        Object.entries(message.parameters).forEach(([key, value]) => {
            if (config.hasOwnProperty(key)) {
                config[key] = value;
                console.log(`⚙️ Updated ${key} = ${value}`);
            }
        });
        
        // Update all slider positions and values
        updateSliderPositions();
        
        // Save configuration
        saveConfig();
        
        console.log(`✅ Applied ControlNet preset: ${message.presetDisplayName}`);
        
        // Confirm to server that ControlNet preset was applied
        sendToServer({
            type: 'controlnet_preset_applied',
            presetName: message.presetName,
            presetDisplayName: message.presetDisplayName,
            from: message.from,
            chatId: message.chatId
        });
    } else if (message.isPreset && message.presetName) {
        // Handle prompt preset
        setPrompt(message.prompt);
        
        // Confirm to server that prompt preset was applied
        sendToServer({
            type: 'telegram_prompt_applied',
            promptId: message.id,
            prompt: message.prompt,
            from: message.from,
            chatId: message.chatId,
            isPreset: true,
            presetName: message.presetName
        });
    } else {
        // Handle regular prompt (default behavior)
        setPrompt(message.prompt);
        
        // Confirm to server that prompt was applied
        sendToServer({
            type: 'telegram_prompt_applied',
            promptId: message.id,
            prompt: message.prompt,
            from: message.from,
            chatId: message.chatId
        });
    }
    
    // Update debug display
    if (config.DEBUG_MODE) {
        updateMobileDebugInfo({
            status: 'Running',
            panelState: document.getElementById('controlPanel')?.classList.contains('collapsed') ? 'collapsed' : 'expanded',
            touchEvents: window.mobileDebugTouchCount || 0,
            canvasReady: !!document.getElementById('fluidCanvas'),
            screenSize: `${window.innerWidth}x${window.innerHeight}`,
            timestamp: new Date().toLocaleTimeString()
        });
    }
}

function processNextTelegramPrompt() {
    if (telegramWaitlist.length === 0) {
        stopTelegramProcessing();
        return;
    }
    
    const nextItem = telegramWaitlist.shift(); // Remove first item (FIFO)
    console.log(`📱 Processing waitlist item: "${nextItem.prompt}" from ${nextItem.from} (type: ${nextItem.type || 'prompt'})`);
    
    // Debug logging removed - now handled in the specific processing sections below
    
    // Handle different types of waitlist items
    if (nextItem.type === 'controlnet_preset') {
        // Apply ControlNet preset parameters
        Object.entries(nextItem.parameters).forEach(([key, value]) => {
            if (config.hasOwnProperty(key)) {
                config[key] = value;
                console.log(`⚙️ Updated ${key} = ${value}`);
            }
        });
        
        // Update all slider positions and values
        updateSliderPositions();
        
        // Save configuration
        saveConfig();
        
        console.log(`✅ Applied ControlNet preset: ${nextItem.presetDisplayName}`);
        
        // Send feedback to server that ControlNet preset was applied
        sendToServer({
            type: 'controlnet_preset_applied',
            presetName: nextItem.presetName,
            presetDisplayName: nextItem.presetDisplayName,
            from: nextItem.from,
            chatId: nextItem.chatId
        });
    } else if (nextItem.isPreset && nextItem.presetName) {
        // Handle prompt preset
        setPrompt(nextItem.prompt);
        
        // Add to debug log - show processed message with content and timestamp
        addTelegramMessageToDebug({
            type: 'telegram_prompt_processed',
            prompt: nextItem.prompt,
            from: nextItem.from,
            timestamp: nextItem.timestamp || new Date().toLocaleString()
        });
        
        // Send feedback to server that prompt preset was applied
        sendToServer({
            type: 'telegram_prompt_applied',
            promptId: nextItem.id,
            prompt: nextItem.prompt,
            from: nextItem.from,
            chatId: nextItem.chatId,
            isPreset: true,
            presetName: nextItem.presetName
        });
    } else {
        // Handle regular prompt (default behavior)
        setPrompt(nextItem.prompt);
        
        // Add to debug log - show processed message with content and timestamp
        addTelegramMessageToDebug({
            type: 'telegram_prompt_processed',
            prompt: nextItem.prompt,
            from: nextItem.from,
            timestamp: nextItem.timestamp || new Date().toLocaleString()
        });
        
        // Send feedback to server that prompt was applied
        sendToServer({
            type: 'telegram_prompt_applied',
            promptId: nextItem.id,
            prompt: nextItem.prompt,
            from: nextItem.from,
            chatId: nextItem.chatId
        });
    }
    
    // Update timestamps for remaining items (they become the new "first")
    if (telegramWaitlist.length > 0) {
        telegramWaitlist[0].addedAt = Date.now();
    }
    
    // Update debug display
    if (config.DEBUG_MODE) {
        updateMobileDebugInfo({
            status: 'Running',
            panelState: document.getElementById('controlPanel')?.classList.contains('collapsed') ? 'collapsed' : 'expanded',
            touchEvents: window.mobileDebugTouchCount || 0,
            canvasReady: !!document.getElementById('fluidCanvas'),
            screenSize: `${window.innerWidth}x${window.innerHeight}`,
            timestamp: new Date().toLocaleTimeString()
        });
    }
}

function startTelegramProcessing() {
    if (telegramProcessingTimer) return; // Already running
    
    const interval = (config.TELEGRAM_WAITLIST_INTERVAL || 1) * 1000; // Convert to milliseconds
    
    telegramProcessingTimer = setInterval(() => {
        processNextTelegramPrompt();
    }, interval);
    
    console.log(`📱 Started Telegram processing timer (${config.TELEGRAM_WAITLIST_INTERVAL || 1}s intervals)`);
}

function stopTelegramProcessing() {
    if (telegramProcessingTimer) {
        clearInterval(telegramProcessingTimer);
        telegramProcessingTimer = null;
        console.log('📱 Stopped Telegram processing timer');
    }
}

function clearTelegramWaitlist() {
    // Add to debug log
    addTelegramMessageToDebug({
        type: 'telegram_waitlist_cleared'
    });
    
    // Notify server to clear its waitlist
    sendToServer({
        type: 'telegram_waitlist_cleared'
    });
    
    console.log('📱 Requested server to clear Telegram waitlist');
    
    // Show brief notification
    const notification = document.createElement('div');
    notification.textContent = '🗑️ Clearing waitlist...';
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; background: rgba(255, 107, 107, 0.9);
        color: white; padding: 10px 15px; border-radius: 5px; z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

function updateDebugDisplay() {
    const debugInfo = document.getElementById('debugInfo');
    if (!debugInfo || !config.DEBUG_MODE) return;
    
    // Get basic debug info (similar to existing updateMobileDebugInfo)
    const panel = document.getElementById('controlPanel');
    const info = {
        status: 'Running',
        panelState: panel ? (panel.classList.contains('collapsed') ? 'collapsed' : 'expanded') : 'missing',
        touchEvents: window.mobileDebugTouchCount || 0,
        canvasReady: !!document.getElementById('fluidCanvas'),
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
        timestamp: new Date().toLocaleTimeString()
    };
    
    // Get OSC status info
    const oscStatus = getOSCStatusForDebug();
    
    // Get Telegram waitlist info
    const waitlistInfo = getTelegramWaitlistInfo();
    
    debugInfo.innerHTML = `
        <div><span style="color: #60a5fa;">Status:</span> <span style="color: #fbbf24;">${info.status}</span></div>
        <div><span style="color: #60a5fa;">Panel:</span> <span style="color: #fbbf24;">${info.panelState}</span></div>
        <div><span style="color: #60a5fa;">Touch Events:</span> <span style="color: #fbbf24;">${info.touchEvents}</span></div>
        <div><span style="color: #60a5fa;">Canvas:</span> <span style="color: #fbbf24;">${info.canvasReady ? 'Ready' : 'Missing'}</span></div>
        <div><span style="color: #60a5fa;">Screen:</span> <span style="color: #fbbf24;">${info.screenSize || 'Unknown'}</span></div>
        <div><span style="color: #60a5fa;">Time:</span> <span style="color: #fbbf24;">${info.timestamp || 'N/A'}</span></div>
        <div><span style="color: #60a5fa;">OSC Server:</span> <span style="color: ${oscStatus.color};">${oscStatus.text}</span></div>
        <div style="margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 6px;">
            <div><span style="color: #f472b6;">📱 Telegram:</span> <span style="color: #fbbf24;">${waitlistInfo.status}</span></div>
            <div><span style="color: #f472b6;">Waitlist:</span> <span style="color: #fbbf24;">${waitlistInfo.count} queued</span></div>
            ${waitlistInfo.nextPrompt ? `<div><span style="color: #f472b6;">Next:</span> <span style="color: #fbbf24;">"${waitlistInfo.nextPrompt}"</span></div>` : ''}
            <div><span style="color: #f472b6;">Interval:</span> <span style="color: #fbbf24;">${waitlistInfo.interval}s</span></div>
        </div>
    `;
}

function getTelegramWaitlistInfo() {
    const isEnabled = config.TELEGRAM_RECEIVE === true;
    const interval = config.TELEGRAM_WAITLIST_INTERVAL || 1;
    
    let status = 'Disabled';
    if (isEnabled) {
        status = 'Server Managed';
    }
    
    return {
        status: status,
        count: '?', // Server manages queue now
        nextPrompt: null, // Server manages queue now
        interval: interval
    };
}

// Send message to server via WebSocket
function sendToServer(message) {
    if (oscWebSocket && oscWebSocket.readyState === WebSocket.OPEN) {
        try {
            oscWebSocket.send(JSON.stringify(message));
            console.log('📤 Sent to server:', message.type);
        } catch (error) {
            console.error('❌ Error sending to server:', error);
        }
    } else {
        console.log('⚠️ Cannot send to server: WebSocket not connected');
    }
}

// Prompt presets for keyboard shortcuts
const PROMPT_PRESETS = [
    'blooming flower with delicate petals, vibrant colors, soft natural lighting, botanical beauty, detailed macro photography, spring garden atmosphere',
    'giant glowing jellyfish, slow graceful movement, neon blue and pink bioluminescence, flowing tendrils like silk, underwater ballet, dreamlike ocean atmosphere',
    'evolving fractal jellyfish, recursive growth, rainbow light trails, kaleidoscopic motion',
    'northern lights over snow-capped mountains, aurora borealis, starry night sky, ethereal green and purple lights, pristine wilderness',
    'floating islands with waterfalls, magical gardens, ethereal mist, fantasy landscape, soft pastel colors, Studio Ghibli style',
    'bioluminescent mushrooms, glowing forest at night, magical blue and green lights, fairy tale atmosphere, mystical fog'
];

function setPrompt(promptText) {
    const promptInput = document.getElementById('promptInput');
    console.log('🎯 setPrompt called with:', promptText);
    console.log('🎯 promptInput element:', promptInput);
    console.log('🎯 Current prompt value before setting:', promptInput ? promptInput.value : 'N/A');
    
    if (promptInput) {
        promptInput.value = promptText;
        console.log('✅ Prompt input field updated to:', promptInput.value);
        
        // Save the new prompt
        savePrompts();
        
        // Update active state for preset buttons
        const presetButtons = document.querySelectorAll('.preset-btn');
        presetButtons.forEach(button => {
            button.classList.remove('active');
            // Check if this button's prompt matches the current prompt
            const buttonPrompt = button.getAttribute('onclick').match(/setPrompt\('([^']+)'\)/);
            if (buttonPrompt && buttonPrompt[1] === promptText) {
                button.classList.add('active');
            }
        });
        
        // Trigger parameter update if stream is active
        if (streamState.streamId) {
            debouncedParameterUpdate();
        }
        
        console.log('✅ Prompt set to:', promptText);
        
        // Verify the value is still set after a short delay
        setTimeout(() => {
            console.log('🔍 Prompt verification after 100ms:', promptInput.value);
        }, 100);
    } else {
        console.error('❌ promptInput element not found!');
    }
}

function setPromptPreset(presetIndex) {
    if (presetIndex >= 0 && presetIndex < PROMPT_PRESETS.length) {
        setPrompt(PROMPT_PRESETS[presetIndex]);
    }
}

// ControlNet Presets based on Stable Diffusion Art best practices
function setControlNetPreset(presetName, event) {
    // Remove active class from all buttons
    document.querySelectorAll('.preset-button').forEach(btn => btn.classList.remove('active'));
    
    // Add active class to clicked button
    if (event && event.target) {
        event.target.classList.add('active');
    } else {
        // Fallback: find button by preset name
        const buttons = document.querySelectorAll('.preset-button');
        buttons.forEach(btn => {
            if (btn.textContent.toLowerCase() === presetName.toLowerCase()) {
                btn.classList.add('active');
            }
        });
    }
    
    let presetConfig = {};
    
    switch(presetName) {
        case 'balanced':
            // Balanced preset: Good for general use with moderate control
            presetConfig = {
                CONTROLNET_POSE_SCALE: 0.65,
                CONTROLNET_HED_SCALE: 0.41,
                CONTROLNET_CANNY_SCALE: 0.00,
                CONTROLNET_DEPTH_SCALE: 0.21,
                CONTROLNET_COLOR_SCALE: 0.26,
                DENOISE_X: 3,
                DENOISE_Y: 6,
                DENOISE_Z: 6
            };
            break;
            
        case 'portrait':
            // Portrait preset: Optimized for human subjects with strong pose control
            presetConfig = {
                CONTROLNET_POSE_SCALE: 0.85,  // Strong pose control for human figures
                CONTROLNET_HED_SCALE: 0.70,   // Good edge detection for faces
                CONTROLNET_CANNY_SCALE: 0.40, // Moderate edge detection
                CONTROLNET_DEPTH_SCALE: 0.60, // Good depth for facial features
                CONTROLNET_COLOR_SCALE: 0.75, // Strong color preservation for skin tones
                DENOISE_X: 2,
                DENOISE_Y: 4,
                DENOISE_Z: 6
            };
            break;
            
        case 'composition':
            // Composition preset: Strong structural control with Canny and Depth
            presetConfig = {
                CONTROLNET_POSE_SCALE: 0.40,  // Less pose control
                CONTROLNET_HED_SCALE: 0.45,   // Moderate soft edges
                CONTROLNET_CANNY_SCALE: 0.80, // Strong edge detection for composition
                CONTROLNET_DEPTH_SCALE: 0.75, // Strong depth control
                CONTROLNET_COLOR_SCALE: 0.35, // Lower color control for more creativity
                DENOISE_X: 4,
                DENOISE_Y: 8,
                DENOISE_Z: 12
            };
            break;
            
        case 'artistic':
            // Artistic preset: More creative freedom with subtle controls
            presetConfig = {
                CONTROLNET_POSE_SCALE: 0.30,  // Loose pose control
                CONTROLNET_HED_SCALE: 0.75,   // Strong soft edge detection
                CONTROLNET_CANNY_SCALE: 0.25, // Minimal hard edges
                CONTROLNET_DEPTH_SCALE: 0.35, // Subtle depth guidance
                CONTROLNET_COLOR_SCALE: 0.40, // Moderate color influence
                DENOISE_X: 6,
                DENOISE_Y: 12,
                DENOISE_Z: 18
            };
            break;
    }
    
    // Apply the preset configuration
    Object.keys(presetConfig).forEach(key => {
        if (config.hasOwnProperty(key)) {
            config[key] = presetConfig[key];
        }
    });
    
    // Update all slider positions and values
    updateSliderPositions();
    
    // Save configuration
    saveConfig();
    
    console.log(`Applied ControlNet preset: ${presetName}`);
}

function toggleFluidControls() {
    const content = document.getElementById('fluidControlsContent');
    const toggle = document.getElementById('fluidControlsIcon');
    
    if (content.classList.contains('expanded')) {
        content.classList.remove('expanded');
        toggle.textContent = '▶';
    } else {
        content.classList.add('expanded');
        toggle.textContent = '▼';
    }
}

function isMobile () {
    const mobile = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           ('ontouchstart' in window) || 
           (navigator.maxTouchPoints > 0);
    
    // Mobile debugging
    if (mobile) {
        console.log('🔍 MOBILE DEBUG: Device detected as mobile');
        console.log('🔍 User Agent:', navigator.userAgent);
        console.log('🔍 Touch Support:', 'ontouchstart' in window);
        console.log('🔍 Max Touch Points:', navigator.maxTouchPoints);
        console.log('🔍 Screen Size:', window.screen.width, 'x', window.screen.height);
        console.log('🔍 Viewport Size:', window.innerWidth, 'x', window.innerHeight);
    }
    
    return mobile;
}

function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// Mobile Debug Overlay System
function initializeMobileDebug() {
    if (!isMobile()) return;
    
    const debugOverlay = document.getElementById('mobileDebug');
    const debugInfo = document.getElementById('debugInfo');
    
    if (debugOverlay && debugInfo) {
        // Show debug overlay only if debug mode is enabled
        if (config.DEBUG_MODE) {
            debugOverlay.style.display = 'block';
            debugOverlay.style.setProperty('display', 'block', 'important');
        }
        
        // Initial debug info
        updateMobileDebugInfo({
            status: 'Initializing...',
            panelState: 'unknown',
            touchEvents: 0,
            canvasReady: !!document.getElementById('fluidCanvas')
        });
        
        // Update debug info periodically
        setInterval(() => {
            const panel = document.getElementById('controlPanel');
            updateMobileDebugInfo({
                status: 'Running',
                panelState: panel ? (panel.classList.contains('collapsed') ? 'collapsed' : 'expanded') : 'missing',
                touchEvents: window.mobileDebugTouchCount || 0,
                canvasReady: !!document.getElementById('fluidCanvas'),
                screenSize: `${window.innerWidth}x${window.innerHeight}`,
                timestamp: new Date().toLocaleTimeString()
            });
        }, 2000);
    }
}

function updateMobileDebugInfo(info) {
    const debugInfo = document.getElementById('debugInfo');
    if (!debugInfo) return;
    
    // Get OSC status info
    const oscStatus = getOSCStatusForDebug();
    
    // Get Telegram waitlist info
    const waitlistInfo = getTelegramWaitlistInfo();
    
    // Get Daydream stream status
    const daydreamStatus = getDaydreamStatusForDebug();
    
    debugInfo.innerHTML = `
        <div><span style="color: #60a5fa;">Status:</span> <span style="color: #fbbf24;">${info.status}</span></div>
        <div><span style="color: #60a5fa;">Panel:</span> <span style="color: #fbbf24;">${info.panelState}</span></div>
        <div><span style="color: #60a5fa;">Touch Events:</span> <span style="color: #fbbf24;">${info.touchEvents}</span></div>
        <div><span style="color: #60a5fa;">Canvas:</span> <span style="color: #fbbf24;">${info.canvasReady ? 'Ready' : 'Missing'}</span></div>
        <div><span style="color: #60a5fa;">Screen:</span> <span style="color: #fbbf24;">${info.screenSize || 'Unknown'}</span></div>
        <div><span style="color: #60a5fa;">Time:</span> <span style="color: #fbbf24;">${info.timestamp || 'N/A'}</span></div>
        <div><span style="color: #60a5fa;">OSC Server:</span> <span style="color: ${oscStatus.color};">${oscStatus.text}</span></div>
        <div style="margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 6px;">
            <div><span style="color: #f472b6;">📱 Telegram:</span> <span style="color: #fbbf24;">${waitlistInfo.status}</span></div>
            <div><span style="color: #f472b6;">Waitlist:</span> <span style="color: #fbbf24;">${waitlistInfo.count} queued</span></div>
            ${waitlistInfo.nextPrompt ? `<div><span style="color: #f472b6;">Next:</span> <span style="color: #fbbf24;">"${waitlistInfo.nextPrompt}"</span></div>` : ''}
            <div><span style="color: #f472b6;">Interval:</span> <span style="color: #fbbf24;">${waitlistInfo.interval}s</span></div>
        </div>
        <div style="margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 6px;">
            <div><span style="color: #8b5cf6;">☁️ Daydream:</span> <span style="color: ${daydreamStatus.color};">${daydreamStatus.text}</span></div>
            ${streamState.playbackId ? `<div><span style="color: #8b5cf6;">Playback:</span> <span style="color: #fbbf24;">${streamState.playbackId.substring(0, 12)}...</span></div>` : ''}
            ${streamState.peerConnection ? `<div><span style="color: #8b5cf6;">WebRTC:</span> <span style="color: #fbbf24;">${streamState.peerConnection.connectionState}</span></div>` : ''}
            ${streamState.isStreaming && streamState.streamId ? `
                <div><span style="color: #8b5cf6;">Stream ID:</span> <span style="color: #fbbf24;">${streamState.streamId}</span></div>
                <div><span style="color: #8b5cf6;">WHIP URL:</span> <span style="color: #fbbf24;">${streamState.whipUrl || 'N/A'}</span></div>
                <div><span style="color: #8b5cf6;">Livepeer URL:</span> <span style="color: #fbbf24;">https://lvpr.tv/?v=${streamState.playbackId}&lowLatency=force&controls=false</span></div>
            ` : ''}
        </div>
    `;
}

function getOSCStatusForDebug() {
    if (oscConnectionStatus === 'connected' && oscServerIP) {
        return {
            text: `192.168.178.59:8000`,
            color: '#22c55e' // Green
        };
    } else if (oscConnectionStatus === 'https_blocked') {
        return {
            text: 'HTTPS Blocked',
            color: '#f59e0b' // Orange
        };
    } else {
        return {
            text: 'Disconnected',
            color: '#ef4444' // Red
        };
    }
}

function getDaydreamStatusForDebug() {
    if (streamState.isStreaming && streamState.streamId && streamState.playbackId) {
        return {
            text: `Active (${streamState.streamId.substring(0, 8)}...)`,
            color: '#22c55e' // Green for active stream
        };
    } else if (streamState.streamId && streamState.playbackId && !streamState.isStreaming) {
        return {
            text: `Ready (${streamState.streamId.substring(0, 8)}...)`,
            color: '#f59e0b' // Orange for ready but not streaming
        };
    } else if (streamState.streamId && !streamState.playbackId) {
        return {
            text: 'Creating...',
            color: '#8b5cf6' // Purple for creating
        };
    } else {
        return {
            text: 'Not Connected',
            color: '#6b7280' // Gray for not connected
        };
    }
}

async function fetchDaydreamStreamStatus() {
    if (!streamState.streamId || !config.DEBUG_MODE) return null;
    
    try {
        const apiKey = document.getElementById('apiKeyInput').value;
        if (!apiKey) return null;
        
        const response = await fetch(`https://daydream.live/api/streams/${streamState.streamId}/status`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.data;
        }
    } catch (error) {
        console.warn('Failed to fetch stream status:', error);
    }
    
    return null;
}

function updateOSCSectionVisibility() {
    const oscInfoDiv = document.getElementById('oscInfo');
    const oscMessagesDiv = document.getElementById('oscMessages');
    
    if (!oscInfoDiv || !oscMessagesDiv) return;
    
    // Hide OSC section if no messages, show if messages exist
    if (oscMessagesDiv.children.length === 0) {
        oscInfoDiv.style.display = 'none';
    } else {
        oscInfoDiv.style.display = 'block';
    }
}

function updateTelegramSectionVisibility() {
    const telegramInfoDiv = document.getElementById('telegramInfo');
    const telegramMessagesDiv = document.getElementById('telegramMessages');
    
    if (!telegramInfoDiv || !telegramMessagesDiv) return;
    
    // Hide Telegram section if no messages, show if messages exist
    if (telegramMessagesDiv.children.length === 0) {
        telegramInfoDiv.style.display = 'none';
    } else {
        telegramInfoDiv.style.display = 'block';
    }
}

function updateDaydreamSectionVisibility() {
    const daydreamInfoDiv = document.getElementById('daydreamInfo');
    const daydreamMessagesDiv = document.getElementById('daydreamMessages');
    
    if (!daydreamInfoDiv || !daydreamMessagesDiv) return;
    
    // Hide Daydream section if no messages, show if messages exist
    if (daydreamMessagesDiv.children.length === 0) {
        daydreamInfoDiv.style.display = 'none';
    } else {
        daydreamInfoDiv.style.display = 'block';
    }
}

function addOSCMessageToDebug(message) {
    if (!config.DEBUG_MODE) return;
    
    const oscMessagesDiv = document.getElementById('oscMessages');
    if (!oscMessagesDiv) return;
    
    const timestamp = new Date().toLocaleTimeString();
    let messageText = '';
    let messageColor = '#60a5fa'; // Default blue
    
    if (message.type === 'osc_message') {
        if (message.parameter) {
            // Format parameter name for better readability
            const paramName = message.parameter.replace('OSC_SPLAT_', 'S').replace('_', '');
            const value = typeof message.value === 'number' ? message.value.toFixed(3) : message.value;
            messageText = `${paramName} = ${value}`;
            messageColor = '#60a5fa'; // Blue for parameters
        } else if (message.action) {
            messageText = `Action: ${message.action}`;
            messageColor = '#22c55e'; // Green for actions
        }
    } else if (message.type === 'osc_velocity_drawing') {
        const velocity = Math.sqrt(message.deltaX * message.deltaX + message.deltaY * message.deltaY);
        messageText = `VelDraw${message.channel}: (${message.x.toFixed(2)}, ${message.y.toFixed(2)}) v=${velocity.toFixed(2)}`;
        messageColor = '#f59e0b'; // Orange for velocity drawing
    } else if (message.type === 'server_info') {
        messageText = 'Server Info';
        messageColor = '#a855f7'; // Purple for server info
    } else {
        messageText = JSON.stringify(message);
    }
    
    const messageElement = document.createElement('div');
    messageElement.style.cssText = `
        margin-bottom: 2px;
        font-size: 10px;
        line-height: 1.2;
    `;
    messageElement.innerHTML = `
        <span style="color: #6b7280;">${timestamp}</span> 
        <span style="color: ${messageColor};">${messageText}</span>
    `;
    
    oscMessagesDiv.appendChild(messageElement);
    
    // Keep only the last 20 messages
    while (oscMessagesDiv.children.length > 20) {
        oscMessagesDiv.removeChild(oscMessagesDiv.firstChild);
    }
    
    // Auto-scroll to bottom
    oscMessagesDiv.scrollTop = oscMessagesDiv.scrollHeight;
    
    // Update OSC section visibility
    updateOSCSectionVisibility();
}

function addTelegramMessageToDebug(message) {
    if (!config.DEBUG_MODE) return;
    
    const telegramMessagesDiv = document.getElementById('telegramMessages');
    if (!telegramMessagesDiv) return;
    
    const timestamp = new Date().toLocaleTimeString();
    let messageText = '';
    let messageColor = '#60a5fa'; // Default blue
    
    if (message.type === 'telegram_prompt' || message.type === 'apply_telegram_prompt') {
        const prompt = message.prompt || 'No prompt';
        const from = message.from || 'Unknown';
        messageText = `Prompt from ${from}: "${prompt}"`;
        messageColor = '#60a5fa'; // Blue for prompts
    } else if (message.type === 'controlnet_preset') {
        const presetName = message.presetName || 'Unknown preset';
        messageText = `ControlNet Preset: ${presetName}`;
        messageColor = '#22c55e'; // Green for presets
    } else if (message.type === 'telegram_prompt_applied') {
        const prompt = message.prompt || 'No prompt';
        messageText = `Applied: "${prompt}"`;
        messageColor = '#10b981'; // Emerald for applied prompts
    } else if (message.type === 'telegram_waitlist_cleared') {
        messageText = 'Waitlist cleared';
        messageColor = '#f59e0b'; // Orange for waitlist actions
    } else if (message.type === 'telegram_waitlist_interval_changed') {
        const interval = message.interval || 'Unknown';
        messageText = `Interval changed to ${interval}s`;
        messageColor = '#8b5cf6'; // Purple for settings changes
    } else if (message.type === 'telegram_token_updated') {
        messageText = 'Bot token updated';
        messageColor = '#ef4444'; // Red for token updates
    } else if (message.type === 'telegram_waitlist_added') {
        const prompt = message.prompt || 'No prompt';
        const from = message.from || 'Unknown';
        messageText = `Added to waitlist: "${prompt}" from ${from}`;
        messageColor = '#f59e0b'; // Orange for waitlist additions
    } else if (message.type === 'telegram_waitlist_processing') {
        const prompt = message.prompt || 'No prompt';
        const from = message.from || 'Unknown';
        messageText = `Processing: "${prompt}" from ${from}`;
        messageColor = '#10b981'; // Emerald for processing
    } else if (message.type === 'telegram_prompt_processed') {
        const prompt = message.prompt || 'No prompt';
        const from = message.from || 'Unknown';
        const timestamp = message.timestamp || 'Unknown time';
        messageText = `Processed: "${prompt}" from ${from} (${timestamp})`;
        messageColor = '#10b981'; // Emerald for processed
    } else {
        messageText = JSON.stringify(message);
    }
    
    const messageElement = document.createElement('div');
    messageElement.style.cssText = `
        margin-bottom: 2px;
        font-size: 10px;
        line-height: 1.2;
    `;
    messageElement.innerHTML = `
        <span style="color: #6b7280;">${timestamp}</span> 
        <span style="color: ${messageColor};">${messageText}</span>
    `;
    
    telegramMessagesDiv.appendChild(messageElement);
    
    // Keep only the last 20 messages
    while (telegramMessagesDiv.children.length > 20) {
        telegramMessagesDiv.removeChild(telegramMessagesDiv.firstChild);
    }
    
    // Auto-scroll to bottom
    telegramMessagesDiv.scrollTop = telegramMessagesDiv.scrollHeight;
    
    // Update Telegram section visibility
    updateTelegramSectionVisibility();
}

function addDaydreamEventToDebug(message) {
    if (!config.DEBUG_MODE) return;
    
    const daydreamMessagesDiv = document.getElementById('daydreamMessages');
    if (!daydreamMessagesDiv) return;
    
    const timestamp = new Date().toLocaleTimeString();
    let messageText = '';
    let messageColor = '#60a5fa'; // Default blue
    
    if (message.type === 'stream_created') {
        const streamId = message.streamId || 'Unknown';
        const playbackId = message.playbackId || 'Unknown';
        messageText = `Stream created: ${streamId.substring(0, 8)}... (${playbackId.substring(0, 8)}...)`;
        messageColor = '#22c55e'; // Green for successful creation
    } else if (message.type === 'stream_started') {
        messageText = 'Stream started';
        messageColor = '#10b981'; // Emerald for active stream
    } else if (message.type === 'stream_stopped') {
        messageText = 'Stream stopped';
        messageColor = '#ef4444'; // Red for stopped stream
    } else if (message.type === 'stream_connecting') {
        messageText = 'Connecting to stream...';
        messageColor = '#f59e0b'; // Orange for connecting
    } else if (message.type === 'stream_connected') {
        messageText = 'WebRTC connected';
        messageColor = '#22c55e'; // Green for connected
    } else if (message.type === 'stream_disconnected') {
        messageText = 'WebRTC disconnected';
        messageColor = '#ef4444'; // Red for disconnected
    } else if (message.type === 'stream_error') {
        const error = message.error || 'Unknown error';
        messageText = `Error: ${error}`;
        messageColor = '#ef4444'; // Red for errors
    } else if (message.type === 'parameters_updated') {
        const prompt = message.prompt || 'No prompt';
        messageText = `Parameters updated: "${prompt.substring(0, 30)}${prompt.length > 30 ? '...' : ''}"`;
        messageColor = '#8b5cf6'; // Purple for parameter updates
    } else if (message.type === 'popup_opened') {
        const playbackId = message.playbackId || 'Unknown';
        messageText = `Player opened: ${playbackId.substring(0, 8)}...`;
        messageColor = '#06a3d7'; // Blue for popup actions
    } else if (message.type === 'popup_closed') {
        messageText = 'Player closed';
        messageColor = '#6b7280'; // Gray for popup closed
    } else if (message.type === 'stream_validated') {
        const streamId = message.streamId || 'Unknown';
        messageText = `Stream validated: ${streamId.substring(0, 8)}...`;
        messageColor = '#22c55e'; // Green for validation
    } else if (message.type === 'stream_invalid') {
        messageText = 'Saved stream invalid, creating new';
        messageColor = '#f59e0b'; // Orange for invalid stream
    } else {
        messageText = JSON.stringify(message);
    }
    
    const messageElement = document.createElement('div');
    messageElement.style.cssText = `
        margin-bottom: 2px;
        font-size: 10px;
        line-height: 1.2;
    `;
    messageElement.innerHTML = `
        <span style="color: #6b7280;">${timestamp}</span> 
        <span style="color: ${messageColor};">${messageText}</span>
    `;
    
    daydreamMessagesDiv.appendChild(messageElement);
    
    // Keep only the last 20 messages
    while (daydreamMessagesDiv.children.length > 20) {
        daydreamMessagesDiv.removeChild(daydreamMessagesDiv.firstChild);
    }
    
    // Auto-scroll to bottom
    daydreamMessagesDiv.scrollTop = daydreamMessagesDiv.scrollHeight;
    
    // Update Daydream section visibility
    updateDaydreamSectionVisibility();
}

function getDevicePixelRatio() {
    return window.devicePixelRatio || 1;
}

function captureScreenshot () {
    let res = getResolution(config.CAPTURE_RESOLUTION);
    let target = createFBO(res.width, res.height, ext.formatRGBA.internalFormat, ext.formatRGBA.format, ext.halfFloatTexType, gl.NEAREST);
    render(target);

    let texture = framebufferToTexture(target);
    texture = normalizeTexture(texture, target.width, target.height);

    let captureCanvas = textureToCanvas(texture, target.width, target.height);
    let datauri = captureCanvas.toDataURL();
    
    // Check if device is iOS (iPad/iPhone)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    if (isIOS) {
        // Show image in modal for iOS devices so users can long-press to save to Photos
        showScreenshotModal(datauri);
    } else {
        // Use download behavior for other devices
        downloadURI('fluid.png', datauri);
    }
    URL.revokeObjectURL(datauri);
}

function showScreenshotModal(datauri) {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.id = 'screenshotModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
    `;
    
    // Create image element
    const img = document.createElement('img');
    img.src = datauri;
    img.style.cssText = `
        max-width: 90%;
        max-height: 70%;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        user-select: none;
        -webkit-user-select: none;
    `;
    
    // Create instruction text
    const instructions = document.createElement('div');
    instructions.style.cssText = `
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 18px;
        text-align: center;
        margin-top: 20px;
        padding: 0 20px;
        line-height: 1.4;
    `;
    instructions.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 8px;">Screenshot Captured!</div>
        <div style="font-size: 16px; opacity: 0.9;">Long press the image above to save to Photos</div>
        <div style="font-size: 14px; opacity: 0.7; margin-top: 12px;">Tap anywhere else to close</div>
    `;
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.textContent = '✕';
    closeButton.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        font-size: 24px;
        width: 44px;
        height: 44px;
        border-radius: 22px;
        cursor: pointer;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
    `;
    
    // Add elements to modal
    modal.appendChild(closeButton);
    modal.appendChild(img);
    modal.appendChild(instructions);
    
    // Close modal function
    const closeModal = () => {
        if (modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
    };
    
    // Event listeners
    closeButton.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // ESC key to close
    const handleKeydown = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleKeydown);
        }
    };
    document.addEventListener('keydown', handleKeydown);
    
    // Add to DOM
    document.body.appendChild(modal);
    
    // Auto-close after 30 seconds
    setTimeout(() => {
        if (modal.parentNode) {
            closeModal();
        }
    }, 30000);
}

// Video recording functionality
let videoRecorder = {
    mediaRecorder: null,
    recordedChunks: [],
    isRecording: false,
    displayStream: null
};

async function toggleVideoRecording() {
    if (videoRecorder.isRecording) {
        stopVideoRecording();
    } else {
        await startVideoRecording();
    }
}

async function startVideoRecording() {
    try {
        // Check if there's an active stream
        if (!streamState.playbackId) {
            alert('Please start a stream first before recording.');
            return;
        }

        // Request screen capture with audio
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
                mediaSource: 'screen',
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                frameRate: { ideal: 30 }
            },
            audio: {
                mediaSource: 'screen',
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
            }
        });

        videoRecorder.displayStream = displayStream;
        videoRecorder.recordedChunks = [];

        // Create MediaRecorder with MP4 support
        const options = {
            mimeType: 'video/webm;codecs=vp9,opus' // WebM with VP9 for better compatibility
        };
        
        // Fallback to other formats if VP9 not supported
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options.mimeType = 'video/webm;codecs=vp8,opus';
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options.mimeType = 'video/webm';
            }
        }

        videoRecorder.mediaRecorder = new MediaRecorder(displayStream, options);

        videoRecorder.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                videoRecorder.recordedChunks.push(event.data);
            }
        };

        videoRecorder.mediaRecorder.onstop = () => {
            downloadRecording();
            cleanup();
        };

        // Handle when user stops screen sharing
        displayStream.getVideoTracks()[0].onended = () => {
            if (videoRecorder.isRecording) {
                stopVideoRecording();
            }
        };

        videoRecorder.mediaRecorder.start(1000); // Collect data every second
        videoRecorder.isRecording = true;
        
        updateRecordButton(true);
        
        alert('Recording started! Please select the stream window to record. Click "Stop Recording" when done.');

    } catch (error) {
        console.error('Error starting video recording:', error);
        alert('Failed to start recording. Please make sure you grant screen capture permission and select the stream window.');
        cleanup();
    }
}

function stopVideoRecording() {
    if (videoRecorder.mediaRecorder && videoRecorder.isRecording) {
        videoRecorder.mediaRecorder.stop();
        videoRecorder.isRecording = false;
        updateRecordButton(false);
    }
}

function downloadRecording() {
    if (videoRecorder.recordedChunks.length === 0) {
        console.warn('No recorded data available');
        return;
    }

    const blob = new Blob(videoRecorder.recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `fluid-stream-${timestamp}.webm`;
    
    downloadURI(filename, url);
    URL.revokeObjectURL(url);
}

function updateRecordButton(isRecording) {
    const button = document.getElementById('recordButton');
    if (button) {
        button.textContent = isRecording ? 'Stop Recording' : 'Record Video';
        button.className = isRecording ? 'modern-button streaming' : 'modern-button';
    }
}

function cleanup() {
    if (videoRecorder.displayStream) {
        videoRecorder.displayStream.getTracks().forEach(track => track.stop());
        videoRecorder.displayStream = null;
    }
    videoRecorder.mediaRecorder = null;
    videoRecorder.recordedChunks = [];
    videoRecorder.isRecording = false;
    updateRecordButton(false);
}

// Background media functionality (images and videos)
let backgroundMedia = {
    texture: null,
    loaded: false,
    canvas: null,
    width: 0,
    height: 0,
    type: null, // 'image' or 'video'
    element: null, // img or video element
    originalDataURL: null // for images only
};

// Camera feed functionality (moved to line 3416 for WebGL integration)

function initializeMediaUpload() {
    // Initialize media file input
    const fileInput = document.getElementById('mediaFileInput');
    const chooseMediaButton = document.getElementById('chooseMediaButton');
    
    if (!fileInput) {
        console.error('Media file input not found');
        return;
    }
    
    // Set up file change handler
    fileInput.onchange = handleMediaFileSelection;
    
    // Initialize fluid background media upload
    const fluidMediaUpload = document.getElementById('mediaUpload');
    if (fluidMediaUpload) {
        fluidMediaUpload.onchange = handleFluidBackgroundUpload;
        console.log('✅ Fluid background media upload initialized');
    } else {
        console.warn('⚠️ Fluid background media upload input not found');
    }
    
    // Set up Choose Media button handler
    if (chooseMediaButton) {
        const handleMediaSelection = () => {
            // Only allow media selection when media mode is active
            if (mediaState.active) {
                selectMediaFile();
            } else {
                console.warn('🎬 Please activate media mode first');
            }
        };
        
        // Tablet-optimized touch handling for input media button
        if (chooseMediaButton) {
            // Handle touch events to eliminate delays
            chooseMediaButton.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                // Trigger the file input immediately
                const fileInput = document.getElementById('mediaFileInput');
                if (fileInput) {
                    fileInput.click();
                }
            }, { passive: false });
            
            // Handle click events as fallback
            chooseMediaButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const fileInput = document.getElementById('mediaFileInput');
                if (fileInput) {
                    fileInput.click();
                }
            });
            
            // Handle keyboard events for accessibility
            chooseMediaButton.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const fileInput = document.getElementById('mediaFileInput');
                    if (fileInput) {
                        fileInput.click();
                    }
                }
            });
        }
        
        // Tablet-optimized touch handling for background media button
        const backgroundMediaButton = document.querySelector('label[for="mediaUpload"]');
        if (backgroundMediaButton) {
            // Handle touch events to eliminate delays
            backgroundMediaButton.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                // Trigger the file input immediately
                const fileInput = document.getElementById('mediaUpload');
                if (fileInput) {
                    fileInput.click();
                }
            }, { passive: false });
            
            // Handle click events as fallback
            backgroundMediaButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const fileInput = document.getElementById('mediaUpload');
                if (fileInput) {
                    fileInput.click();
                }
            });
            
            // Handle keyboard events for accessibility
            backgroundMediaButton.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const fileInput = document.getElementById('mediaUpload');
                    if (fileInput) {
                        fileInput.click();
                    }
                }
            });
        }
    }
    
    // Initialize full-window drag and drop
    initializeFullWindowDragDrop();
    
    // Initialize camera functionality (now handled by input mode system)
    updateBackgroundControls();
}

// Full-window drag and drop system for media files
let dragDropState = {
    dragCounter: 0,
    overlay: null,
    isInitialized: false
};

function initializeFullWindowDragDrop() {
    if (dragDropState.isInitialized) return;
    
    // Create drag overlay element
    createDragOverlay();
    
    // Add global drag and drop event listeners
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.addEventListener(eventName, handleDragEvent, false);
    });
    
    dragDropState.isInitialized = true;
    console.log('✅ Full-window drag and drop initialized');
}

function createDragOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'mediaDragOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: linear-gradient(135deg, 
            rgba(0, 212, 255, 0.1), 
            rgba(0, 150, 255, 0.15), 
            rgba(0, 100, 255, 0.1)
        );
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 3px dashed rgba(0, 212, 255, 0.6);
        box-sizing: border-box;
        display: none;
        z-index: 10000;
        pointer-events: none;
        animation: dragPulse 2s ease-in-out infinite;
    `;
    
    // Create inner content
    const content = document.createElement('div');
    content.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        color: white;
        font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
        pointer-events: none;
    `;
    
    content.innerHTML = `
        <div style="font-size: 64px; margin-bottom: 20px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));">📁</div>
        <div style="font-size: 28px; font-weight: bold; margin-bottom: 10px; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">Drop Media Files Here</div>
        <div style="font-size: 18px; opacity: 0.9; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">Images (PNG, JPG) or Videos (MP4, WebM, MOV)</div>
    `;
    
    overlay.appendChild(content);
    document.body.appendChild(overlay);
    dragDropState.overlay = overlay;
    
    // Add CSS animation
    if (!document.getElementById('dragDropStyles')) {
        const style = document.createElement('style');
        style.id = 'dragDropStyles';
        style.textContent = `
            @keyframes dragPulse {
                0%, 100% { 
                    border-color: rgba(0, 212, 255, 0.6);
                    background: linear-gradient(135deg, 
                        rgba(0, 212, 255, 0.1), 
                        rgba(0, 150, 255, 0.15), 
                        rgba(0, 100, 255, 0.1)
                    );
                }
                50% { 
                    border-color: rgba(0, 212, 255, 0.9);
                    background: linear-gradient(135deg, 
                        rgba(0, 212, 255, 0.15), 
                        rgba(0, 150, 255, 0.2), 
                        rgba(0, 100, 255, 0.15)
                    );
                }
            }
        `;
        document.head.appendChild(style);
    }
}

function handleDragEvent(e) {
    // Only handle drag events when media mode is active
    if (!mediaState.active) return;
    
    // Prevent default browser behavior
    e.preventDefault();
    e.stopPropagation();
    
    switch (e.type) {
        case 'dragenter':
            handleDragEnter(e);
            break;
        case 'dragover':
            handleDragOver(e);
            break;
        case 'dragleave':
            handleDragLeave(e);
            break;
        case 'drop':
            handleDrop(e);
            break;
    }
}

function handleDragEnter(e) {
    dragDropState.dragCounter++;
    
    // Only show overlay on first drag enter
    if (dragDropState.dragCounter === 1) {
        showDragOverlay();
    }
}

function handleDragOver(e) {
    // Required to allow dropping
    e.dataTransfer.dropEffect = 'copy';
}

function handleDragLeave(e) {
    dragDropState.dragCounter--;
    
    // Only hide overlay when leaving the window completely
    if (dragDropState.dragCounter <= 0) {
        dragDropState.dragCounter = 0;
        hideDragOverlay();
    }
}

function handleDrop(e) {
    dragDropState.dragCounter = 0;
    hideDragOverlay();
    
    const files = Array.from(e.dataTransfer.files);
    
    if (files.length === 0) {
        console.log('🎬 No files dropped');
        return;
    }
    
    // Handle the first file (media mode supports single file)
    const file = files[0];
    console.log('🎬 File dropped:', file.name, file.type);
    
    // Create a fake event object to reuse existing file handling logic
    const fakeEvent = {
        target: {
            files: [file]
        }
    };
    
    handleMediaFileSelection(fakeEvent);
}

function showDragOverlay() {
    if (dragDropState.overlay) {
        dragDropState.overlay.style.display = 'block';
        // Trigger animation by forcing reflow
        dragDropState.overlay.offsetHeight;
        console.log('🎬 Drag overlay shown');
    }
}

function hideDragOverlay() {
    if (dragDropState.overlay) {
        dragDropState.overlay.style.display = 'none';
        console.log('🎬 Drag overlay hidden');
    }
}

// Clean up drag and drop when media mode is deactivated
function cleanupFullWindowDragDrop() {
    dragDropState.dragCounter = 0;
    hideDragOverlay();
}

function handleMediaUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const isImage = file.type.match(/^image\/(png|jpeg|jpg)$/);
    const isVideo = file.type.match(/^video\/(mp4|webm|mov|quicktime)$/); // Added quicktime for .mov files
    
    console.log(`📁 File selected: ${file.name}, type: ${file.type}, size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    
    if (!isImage && !isVideo) {
        alert('Please select a PNG, JPG, JPEG image file or MP4, WebM, MOV video file.');
        return;
    }

    // Validate file size (10MB for images, 50MB for videos)
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    const fileType = isVideo ? 'video' : 'image';
    const maxSizeText = isVideo ? '50MB' : '10MB';
    
    if (file.size > maxSize) {
        alert(`${fileType} file is too large. Please select a ${fileType} smaller than ${maxSizeText}.`);
        return;
    }

    if (isVideo) {
        // Handle video file
        const url = URL.createObjectURL(file);
        loadBackgroundVideo(url);
        loadFluidBackgroundVideo(url, file.name);
    } else {
        // Handle image file
        const reader = new FileReader();
        reader.onload = function(e) {
            // Store original data URL for scale changes
            backgroundMedia.originalDataURL = e.target.result;
            loadBackgroundImage(e.target.result);
            loadFluidBackgroundImage(e.target.result, file.name);
        };
        reader.readAsDataURL(file);
    }
}

function loadBackgroundImage(dataURL) {
    const img = new Image();
    img.onload = function() {
        // Create a canvas that matches the WebGL viewport aspect ratio
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { 
            alpha: true, 
            antialias: true,
            premultipliedAlpha: false 
        });
        
        // Get current canvas (WebGL viewport) dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const viewportAspect = viewportWidth / viewportHeight;
        const imageAspect = img.width / img.height;
        
        // Set canvas size to match viewport aspect ratio with high-DPI support
        const devicePixelRatio = window.devicePixelRatio || 1;
        const maxSize = Math.min(2048, Math.max(viewportWidth, viewportHeight) * devicePixelRatio);
        let canvasWidth, canvasHeight;
        
        if (viewportAspect > 1) {
            canvasWidth = Math.min(maxSize, viewportWidth * devicePixelRatio);
            canvasHeight = canvasWidth / viewportAspect;
        } else {
            canvasHeight = Math.min(maxSize, viewportHeight * devicePixelRatio);
            canvasWidth = canvasHeight * viewportAspect;
        }
        
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        
        // Clear canvas with transparent background
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Enable high-quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Additional quality settings
        if (ctx.webkitImageSmoothingEnabled !== undefined) {
            ctx.webkitImageSmoothingEnabled = true;
        }
        if (ctx.mozImageSmoothingEnabled !== undefined) {
            ctx.mozImageSmoothingEnabled = true;
        }
        
        // Calculate how to fit the image in the canvas without stretching
        let drawWidth, drawHeight, drawX, drawY;
        
        if (imageAspect > viewportAspect) {
            // Image is wider than viewport - fit to width
            drawWidth = canvas.width;
            drawHeight = canvas.width / imageAspect;
            drawX = 0;
            drawY = (canvas.height - drawHeight) / 2;
        } else {
            // Image is taller than viewport - fit to height  
            drawHeight = canvas.height;
            drawWidth = canvas.height * imageAspect;
            drawX = (canvas.width - drawWidth) / 2;
            drawY = 0;
        }
        
        // Allow scaling up to canvas size for better quality, but respect original image size
        const maxScale = Math.min(
            canvas.width / img.width, 
            canvas.height / img.height,
            2.0 // Allow up to 2x upscaling for small images
        );
        const baseScale = Math.min(maxScale, Math.min(drawWidth / img.width, drawHeight / img.height));
        
        // Apply user scale setting (stored in config.BACKGROUND_IMAGE_SCALE) - inverted
        const userScale = config.BACKGROUND_IMAGE_SCALE || 1.0;
        const scale = baseScale / userScale;
        drawWidth = img.width * scale;
        drawHeight = img.height * scale;
        drawX = (canvas.width - drawWidth) / 2;
        drawY = (canvas.height - drawHeight) / 2;
        
        // Flip the image vertically to fix upside-down rendering in WebGL
        ctx.save();
        ctx.scale(1, -1); // Flip vertically
        ctx.translate(0, -canvas.height); // Adjust for flip
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        ctx.restore();
        
        // Create WebGL texture
        createBackgroundTexture(canvas);
        
        // Update UI
        updateImagePreview(dataURL);
        showClearButton(true);
        
        backgroundMedia.canvas = canvas;
        backgroundMedia.width = canvas.width;
        backgroundMedia.height = canvas.height;
        backgroundMedia.loaded = true;
        backgroundMedia.type = 'image';
        backgroundMedia.element = img;
    };
    img.src = dataURL;
}

function loadBackgroundVideo(url) {
    // Clear any existing background
    clearBackgroundMedia();
    
    // Create video element
    const video = document.createElement('video');
    video.src = url;
    video.loop = true; // Auto-loop as required
    video.muted = true; // Muted to allow autoplay
    video.crossOrigin = 'anonymous';
    video.preload = 'auto'; // Changed from 'metadata' to 'auto' to ensure video data is loaded
    video.playsInline = true; // Ensure inline playback on mobile
    
    // Wait for video to be ready with data
    video.oncanplaythrough = function() {
        // Store video element and metadata
        backgroundMedia.element = video;
        backgroundMedia.type = 'video';
        backgroundMedia.width = video.videoWidth;
        backgroundMedia.height = video.videoHeight;
        backgroundMedia.loaded = true;
        
        // Create initial texture for the video
        updateBackgroundVideoTexture();
        
        // Start playing the video
        video.play().then(() => {
            console.log(`📹 Background video playing: ${video.videoWidth}x${video.videoHeight}`);
            
            // Update UI
            updateMediaPreview(url, 'video');
            showClearButton(true);
        }).catch(e => {
            console.warn('Video autoplay failed:', e);
            // Even if autoplay fails, the video is loaded and can be used
            updateMediaPreview(url, 'video');
            showClearButton(true);
        });
    };
    
    video.onloadedmetadata = function() {
        console.log(`📹 Video metadata loaded: ${video.videoWidth}x${video.videoHeight}`);
    };
    
    video.onerror = function(e) {
        console.error('Error loading background video:', e);
        alert('Failed to load video. Please try a different video file or ensure it\'s in a supported format (MP4, WebM, MOV).');
        clearBackgroundMedia();
    };
}

function createBackgroundTexture(canvas) {
    // Delete existing texture if it exists
    if (backgroundMedia.texture) {
        gl.deleteTexture(backgroundMedia.texture);
    }
    
    // Create new texture
    backgroundMedia.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, backgroundMedia.texture);
    
    // Set texture parameters for high quality
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    
    // Upload image data to texture
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    
    // Generate mipmaps for better quality at different scales
    gl.generateMipmap(gl.TEXTURE_2D);
    
    gl.bindTexture(gl.TEXTURE_2D, null);
}

function updateBackgroundVideoTexture() {
    if (!backgroundMedia.loaded || backgroundMedia.type !== 'video' || !backgroundMedia.element) return;
    
    const video = backgroundMedia.element;
    
    // Check if video has data to render
    if (video.readyState < video.HAVE_CURRENT_DATA) return;
    
    // Create texture if it doesn't exist
    if (!backgroundMedia.texture) {
        backgroundMedia.texture = gl.createTexture();
    }
    
    gl.bindTexture(gl.TEXTURE_2D, backgroundMedia.texture);
    
    // Set texture parameters for real-time video
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    
    // Upload video frame to texture
    try {
        if (video.videoWidth > 0 && video.videoHeight > 0) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
            backgroundMedia.width = video.videoWidth;
            backgroundMedia.height = video.videoHeight;
        }
    } catch (e) {
        // Video might not be ready yet or have codec issues
        console.warn('Failed to update background video texture:', e);
    }
    
    // Unbind texture
    gl.bindTexture(gl.TEXTURE_2D, null);
}

// updateCameraTexture function removed - using simple canvas instead

function updateImagePreview(dataURL) {
    updateMediaPreview(dataURL, 'image');
}

function updateMediaPreview(url, type) {
    // Preview removed - no longer showing thumbnails in control panel
    console.log(`📁 Media loaded: ${type} - ${url.substring(0, 50)}...`);
}

function showClearButton(show) {
    const clearButton = document.getElementById('clearImageButton');
    if (clearButton) {
        clearButton.style.display = show ? 'inline-block' : 'none';
    }
    
    // Also show/hide the scale slider
    const scaleControl = document.getElementById('backgroundScaleControl');
    if (scaleControl) {
        scaleControl.style.display = show ? 'block' : 'none';
    }
}

function clearBackgroundImage() {
    clearBackgroundMedia();
}

function clearBackgroundMedia() {
    // Clear WebGL texture
    if (backgroundMedia.texture) {
        gl.deleteTexture(backgroundMedia.texture);
        backgroundMedia.texture = null;
    }
    
    // Clean up video element if it exists
    if (backgroundMedia.type === 'video' && backgroundMedia.element) {
        backgroundMedia.element.pause();
        // Remove event listeners before clearing src to prevent error alerts
        backgroundMedia.element.onerror = null;
        backgroundMedia.element.oncanplaythrough = null;
        backgroundMedia.element.onloadedmetadata = null;
        backgroundMedia.element.src = '';
        backgroundMedia.element = null;
    }
    
    // Reset state
    backgroundMedia.loaded = false;
    backgroundMedia.canvas = null;
    backgroundMedia.width = 0;
    backgroundMedia.height = 0;
    backgroundMedia.originalDataURL = null;
    backgroundMedia.type = null;
    backgroundMedia.element = null;
    
    // Clear UI
    const mediaUpload = document.getElementById('mediaUpload');
    if (mediaUpload) mediaUpload.value = '';
    
    updateBackgroundControls();
}

// Camera feed functionality (old implementation removed - using new input mode system)

// Old startCamera function removed - using new camera system with input modes

// Old stopCamera function removed - using new camera system with input modes

// Simple Camera Implementation - No WebGL complexity!

function clearAllBackground() {
    clearBackgroundMedia();
    // Camera stopping is now handled by input mode system
}

function clearFluidBackgroundMedia() {
    // Clear uploaded media
    if (fluidBackgroundMedia.loaded) {
        // Clean up texture
        if (fluidBackgroundMedia.texture) {
            gl.deleteTexture(fluidBackgroundMedia.texture);
            fluidBackgroundMedia.texture = null;
        }
        
        // Clean up media element
        if (fluidBackgroundMedia.element) {
            if (fluidBackgroundMedia.type === 'video') {
                fluidBackgroundMedia.element.pause();
                fluidBackgroundMedia.element.src = '';
            }
            // Revoke object URL to free memory
            if (fluidBackgroundMedia.element.src && fluidBackgroundMedia.element.src.startsWith('blob:')) {
                URL.revokeObjectURL(fluidBackgroundMedia.element.src);
            }
            fluidBackgroundMedia.element = null;
        }
        
        // Reset state
        fluidBackgroundMedia.loaded = false;
        fluidBackgroundMedia.type = null;
        fluidBackgroundMedia.width = 0;
        fluidBackgroundMedia.height = 0;
        fluidBackgroundMedia.scale = 1.0;
        
        // Hide media controls and reset file input
        const mediaScaleControl = document.getElementById('fluidMediaScaleControl');
        const mediaUpload = document.getElementById('mediaUpload');
        if (mediaScaleControl) mediaScaleControl.style.display = 'none';
        if (mediaUpload) mediaUpload.value = '';
        
        console.log('🗑️ Fluid background media cleared');
    }
    
    // Clear camera feed
    if (fluidBackgroundCamera.active) {
        stopFluidBackgroundCamera();
        const button = document.getElementById('fluidCameraButton');
        if (button) {
            button.textContent = '📷 Camera';
            button.classList.remove('active');
        }
    }
    
    // Hide old clear button if nothing is active (legacy support)
    if (!fluidBackgroundMedia.loaded && !fluidBackgroundCamera.active) {
        const clearButton = document.getElementById('clearFluidBackgroundButton');
        if (clearButton) clearButton.style.display = 'none';
    }
}

function clearFluidBackgroundMediaOnly() {
    // Clear only uploaded media, not camera
    if (fluidBackgroundMedia.loaded) {
        // Clean up texture
        if (fluidBackgroundMedia.texture) {
            gl.deleteTexture(fluidBackgroundMedia.texture);
            fluidBackgroundMedia.texture = null;
        }
        
        // Clean up media element
        if (fluidBackgroundMedia.element) {
            if (fluidBackgroundMedia.type === 'video') {
                fluidBackgroundMedia.element.pause();
                fluidBackgroundMedia.element.src = '';
            }
            // Revoke object URL to free memory
            if (fluidBackgroundMedia.element.src && fluidBackgroundMedia.element.src.startsWith('blob:')) {
                URL.revokeObjectURL(fluidBackgroundMedia.element.src);
            }
            fluidBackgroundMedia.element = null;
        }
        
        // Reset media state
        fluidBackgroundMedia.loaded = false;
        fluidBackgroundMedia.type = null;
        fluidBackgroundMedia.width = 0;
        fluidBackgroundMedia.height = 0;
        fluidBackgroundMedia.scale = 1.0;
        
        // Hide media controls and reset file input
        const mediaScaleControl = document.getElementById('fluidMediaScaleControl');
        const clearMediaButton = document.getElementById('clearFluidMediaButton');
        const mediaUpload = document.getElementById('mediaUpload');
        if (mediaScaleControl) mediaScaleControl.style.display = 'none';
        if (clearMediaButton) clearMediaButton.style.display = 'none';
        if (mediaUpload) mediaUpload.value = '';
        
        console.log('🗑️ Fluid background media cleared (camera remains active)');
    }
}

function loadFluidBackgroundFile(file) {
    const url = URL.createObjectURL(file);
    
    if (file.type.startsWith('image/')) {
        loadFluidBackgroundImage(url, file.name);
    } else if (file.type.startsWith('video/')) {
        loadFluidBackgroundVideo(url, file.name);
    }
}

function loadFluidBackgroundImage(dataURL, filename) {
    const img = new Image();
    img.onload = function() {
        // Store the image element
        fluidBackgroundMedia.element = img;
        fluidBackgroundMedia.type = 'image';
        fluidBackgroundMedia.width = img.width;
        fluidBackgroundMedia.height = img.height;
        fluidBackgroundMedia.loaded = true;
        fluidBackgroundMedia.scale = config.FLUID_MEDIA_SCALE || 1.0; // Initialize from config
        
        // Show controls
        const clearMediaButton = document.getElementById('clearFluidMediaButton');
        const mediaScaleControl = document.getElementById('fluidMediaScaleControl');
        if (clearMediaButton) clearMediaButton.style.display = 'inline-block';
        if (mediaScaleControl) mediaScaleControl.style.display = 'block';
        
        console.log(`🖼️ Fluid background image loaded: ${filename} (${img.width}x${img.height})`);
    };
    img.onerror = function() {
        console.error('Failed to load fluid background image');
    };
    img.src = dataURL;
}

function loadFluidBackgroundVideo(url, filename) {
    const video = document.createElement('video');
    video.onloadedmetadata = function() {
        // Store the video element
        fluidBackgroundMedia.element = video;
        fluidBackgroundMedia.type = 'video';
        fluidBackgroundMedia.width = video.videoWidth;
        fluidBackgroundMedia.height = video.videoHeight;
        fluidBackgroundMedia.loaded = true;
        fluidBackgroundMedia.scale = config.FLUID_MEDIA_SCALE || 1.0; // Initialize from config
        
        // Configure video
        video.muted = true;
        video.loop = true;
        video.play();
        
        // Show controls
        const clearMediaButton = document.getElementById('clearFluidMediaButton');
        const mediaScaleControl = document.getElementById('fluidMediaScaleControl');
        if (clearMediaButton) clearMediaButton.style.display = 'inline-block';
        if (mediaScaleControl) mediaScaleControl.style.display = 'block';
        
        console.log(`🎥 Fluid background video loaded: ${filename} (${video.videoWidth}x${video.videoHeight})`);
    };
    video.onerror = function() {
        console.error('Failed to load fluid background video');
    };
    video.src = url;
}

function updateBackgroundControls() {
    const clearButton = document.getElementById('clearBackgroundButton');
    const scaleControl = document.getElementById('backgroundScaleControl');
    
    const hasBackground = backgroundMedia.loaded || cameraState.active;
    
    if (clearButton) {
        clearButton.style.display = hasBackground ? 'inline-block' : 'none';
    }
    
    // Show scale control for both images and videos, not camera
    if (scaleControl) {
        const showScale = backgroundMedia.loaded && (backgroundMedia.type === 'image' || backgroundMedia.type === 'video') && !cameraState.active;
        scaleControl.style.display = showScale ? 'block' : 'none';
    }
}

function showClearButton(show) {
    // Legacy function - now handled by updateBackgroundControls
    updateBackgroundControls();
}

function framebufferToTexture (target) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
    let length = target.width * target.height * 4;
    let texture = new Float32Array(length);
    gl.readPixels(0, 0, target.width, target.height, gl.RGBA, gl.FLOAT, texture);
    return texture;
}

function normalizeTexture (texture, width, height) {
    let result = new Uint8Array(texture.length);
    let id = 0;
    for (let i = height - 1; i >= 0; i--) {
        for (let j = 0; j < width; j++) {
            let nid = i * width * 4 + j * 4;
            result[nid + 0] = clamp01(texture[id + 0]) * 255;
            result[nid + 1] = clamp01(texture[id + 1]) * 255;
            result[nid + 2] = clamp01(texture[id + 2]) * 255;
            result[nid + 3] = clamp01(texture[id + 3]) * 255;
            id += 4;
        }
    }
    return result;
}

function clamp01 (input) {
    return Math.min(Math.max(input, 0), 1);
}

function textureToCanvas (texture, width, height) {
    let captureCanvas = document.createElement('canvas');
    let ctx = captureCanvas.getContext('2d');
    captureCanvas.width = width;
    captureCanvas.height = height;

    let imageData = ctx.createImageData(width, height);
    imageData.data.set(texture);
    ctx.putImageData(imageData, 0, 0);

    return captureCanvas;
}

function downloadURI (filename, uri) {
    let link = document.createElement('a');
    link.download = filename;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

class Material {
    constructor (vertexShader, fragmentShaderSource) {
        this.vertexShader = vertexShader;
        this.fragmentShaderSource = fragmentShaderSource;
        this.programs = [];
        this.activeProgram = null;
        this.uniforms = [];
    }

    setKeywords (keywords) {
        let hash = 0;
        for (let i = 0; i < keywords.length; i++)
            hash += hashCode(keywords[i]);

        let program = this.programs[hash];
        if (program == null)
        {
            let fragmentShader = compileShader(gl.FRAGMENT_SHADER, this.fragmentShaderSource, keywords);
            program = createProgram(this.vertexShader, fragmentShader);
            this.programs[hash] = program;
        }

        if (program == this.activeProgram) return;

        this.uniforms = getUniforms(program);
        this.activeProgram = program;
    }

    bind () {
        gl.useProgram(this.activeProgram);
    }
}

class Program {
    constructor (vertexShader, fragmentShader) {
        this.uniforms = {};
        this.program = createProgram(vertexShader, fragmentShader);
        this.uniforms = getUniforms(this.program);
    }

    bind () {
        gl.useProgram(this.program);
    }
}

function createProgram (vertexShader, fragmentShader) {
    let program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        console.trace(gl.getProgramInfoLog(program));

    return program;
}

function getUniforms (program) {
    let uniforms = [];
    let uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < uniformCount; i++) {
        let uniformName = gl.getActiveUniform(program, i).name;
        uniforms[uniformName] = gl.getUniformLocation(program, uniformName);
    }
    return uniforms;
}

function compileShader (type, source, keywords) {
    source = addKeywords(source, keywords);

    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        console.trace(gl.getShaderInfoLog(shader));

    return shader;
};

function addKeywords (source, keywords) {
    if (keywords == null) return source;
    let keywordsString = '';
    keywords.forEach(keyword => {
        keywordsString += '#define ' + keyword + '\n';
    });
    return keywordsString + source;
}

const baseVertexShader = compileShader(gl.VERTEX_SHADER, `
    precision highp float;

    attribute vec2 aPosition;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform vec2 texelSize;

    void main () {
        vUv = aPosition * 0.5 + 0.5;
        vL = vUv - vec2(texelSize.x, 0.0);
        vR = vUv + vec2(texelSize.x, 0.0);
        vT = vUv + vec2(0.0, texelSize.y);
        vB = vUv - vec2(0.0, texelSize.y);
        gl_Position = vec4(aPosition, 0.0, 1.0);
    }
`);

const blurVertexShader = compileShader(gl.VERTEX_SHADER, `
    precision highp float;

    attribute vec2 aPosition;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    uniform vec2 texelSize;

    void main () {
        vUv = aPosition * 0.5 + 0.5;
        float offset = 1.33333333;
        vL = vUv - texelSize * offset;
        vR = vUv + texelSize * offset;
        gl_Position = vec4(aPosition, 0.0, 1.0);
    }
`);

const blurShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;

    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    uniform sampler2D uTexture;

    void main () {
        vec4 sum = texture2D(uTexture, vUv) * 0.29411764;
        sum += texture2D(uTexture, vL) * 0.35294117;
        sum += texture2D(uTexture, vR) * 0.35294117;
        gl_FragColor = sum;
    }
`);

const copyShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;

    varying highp vec2 vUv;
    uniform sampler2D uTexture;

    void main () {
        gl_FragColor = texture2D(uTexture, vUv);
    }
`);

const clearShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;

    varying highp vec2 vUv;
    uniform sampler2D uTexture;
    uniform float value;

    void main () {
        gl_FragColor = value * texture2D(uTexture, vUv);
    }
`);

const colorShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;

    uniform vec4 color;

    void main () {
        gl_FragColor = color;
    }
`);

const simpleTextureShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    uniform sampler2D uTexture;

    void main () {
        gl_FragColor = texture2D(uTexture, vUv);
    }
`);

const cameraShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    uniform sampler2D uTexture;
    uniform float uCanvasAspect;
    uniform float uVideoAspect;

    void main () {
        // Flip Y coordinate for camera feed
        vec2 flippedUv = vec2(vUv.x, 1.0 - vUv.y);
        
        // Calculate aspect ratio correction for "cover" behavior
        vec2 scale = vec2(1.0);
        vec2 offset = vec2(0.0);
        
        if (uCanvasAspect > uVideoAspect) {
            // Canvas is wider than video - scale video to fit width, crop height
            scale.y = uCanvasAspect / uVideoAspect;
            offset.y = (1.0 - scale.y) * 0.5;
        } else {
            // Canvas is taller than video - scale video to fit height, crop width  
            scale.x = uVideoAspect / uCanvasAspect;
            offset.x = (1.0 - scale.x) * 0.5;
        }
        
        // Apply scaling and centering
        vec2 correctedUv = (flippedUv - offset) / scale;
        
        // Clamp to prevent sampling outside texture bounds
        correctedUv = clamp(correctedUv, 0.0, 1.0);
        
        gl_FragColor = texture2D(uTexture, correctedUv);
    }
`);

const backgroundVideoShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    uniform sampler2D uTexture;
    uniform float uCanvasAspect;
    uniform float uVideoAspect;
    uniform float uScale;

    void main () {
        vec2 uv = vUv;
        
        // Flip vertically
        uv.y = 1.0 - uv.y;
        
        // Simple aspect ratio correction
        float canvasAspect = uCanvasAspect;
        float mediaAspect = uVideoAspect;
        
        if (canvasAspect > mediaAspect) {
            // Canvas wider than media - fit width, crop height
            uv.y = (uv.y - 0.5) * (mediaAspect / canvasAspect) + 0.5;
        } else {
            // Canvas taller than media - fit height, crop width
            uv.x = (uv.x - 0.5) * (canvasAspect / mediaAspect) + 0.5;
        }
        
        // Apply user scale
        uv = (uv - 0.5) / uScale + 0.5;
        
        // Sample texture
        if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
        } else {
            gl_FragColor = texture2D(uTexture, uv);
        }
    }
`);

const checkerboardShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    uniform sampler2D uTexture;
    uniform float aspectRatio;

    #define SCALE 25.0

    void main () {
        vec2 uv = floor(vUv * SCALE * vec2(aspectRatio, 1.0));
        float v = mod(uv.x + uv.y, 2.0);
        v = v * 0.1 + 0.8;
        gl_FragColor = vec4(vec3(v), 1.0);
    }
`);

const displayShaderSource = `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uTexture;
    uniform sampler2D uBloom;
    uniform sampler2D uSunrays;
    uniform sampler2D uDithering;
    uniform vec2 ditherScale;
    uniform vec2 texelSize;

    vec3 linearToGamma (vec3 color) {
        color = max(color, vec3(0));
        return max(1.055 * pow(color, vec3(0.416666667)) - 0.055, vec3(0));
    }

    void main () {
        vec3 c = texture2D(uTexture, vUv).rgb;

    #ifdef SHADING
        vec3 lc = texture2D(uTexture, vL).rgb;
        vec3 rc = texture2D(uTexture, vR).rgb;
        vec3 tc = texture2D(uTexture, vT).rgb;
        vec3 bc = texture2D(uTexture, vB).rgb;

        float dx = length(rc) - length(lc);
        float dy = length(tc) - length(bc);

        vec3 n = normalize(vec3(dx, dy, length(texelSize)));
        vec3 l = vec3(0.0, 0.0, 1.0);

        float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
        c *= diffuse;
    #endif

    #ifdef BLOOM
        vec3 bloom = texture2D(uBloom, vUv).rgb;
    #endif

    #ifdef SUNRAYS
        float sunrays = texture2D(uSunrays, vUv).r;
        c *= sunrays;
    #ifdef BLOOM
        bloom *= sunrays;
    #endif
    #endif

    #ifdef BLOOM
        float noise = texture2D(uDithering, vUv * ditherScale).r;
        noise = noise * 2.0 - 1.0;
        bloom += noise / 255.0;
        bloom = linearToGamma(bloom);
        c += bloom;
    #endif

        float a = max(c.r, max(c.g, c.b));
        gl_FragColor = vec4(c, a);
    }
`;

const bloomPrefilterShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;

    varying vec2 vUv;
    uniform sampler2D uTexture;
    uniform vec3 curve;
    uniform float threshold;

    void main () {
        vec3 c = texture2D(uTexture, vUv).rgb;
        float br = max(c.r, max(c.g, c.b));
        float rq = clamp(br - curve.x, 0.0, curve.y);
        rq = curve.z * rq * rq;
        c *= max(rq, br - threshold) / max(br, 0.0001);
        gl_FragColor = vec4(c, 0.0);
    }
`);

const bloomBlurShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;

    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uTexture;

    void main () {
        vec4 sum = vec4(0.0);
        sum += texture2D(uTexture, vL);
        sum += texture2D(uTexture, vR);
        sum += texture2D(uTexture, vT);
        sum += texture2D(uTexture, vB);
        sum *= 0.25;
        gl_FragColor = sum;
    }
`);

const bloomFinalShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;

    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uTexture;
    uniform float intensity;

    void main () {
        vec4 sum = vec4(0.0);
        sum += texture2D(uTexture, vL);
        sum += texture2D(uTexture, vR);
        sum += texture2D(uTexture, vT);
        sum += texture2D(uTexture, vB);
        sum *= 0.25;
        gl_FragColor = sum * intensity;
    }
`);

const sunraysMaskShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    uniform sampler2D uTexture;

    void main () {
        vec4 c = texture2D(uTexture, vUv);
        float br = max(c.r, max(c.g, c.b));
        c.a = 1.0 - min(max(br * 20.0, 0.0), 0.8);
        gl_FragColor = c;
    }
`);

const sunraysShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    uniform sampler2D uTexture;
    uniform float weight;

    #define ITERATIONS 16

    void main () {
        float Density = 0.3;
        float Decay = 0.95;
        float Exposure = 0.7;

        vec2 coord = vUv;
        vec2 dir = vUv - 0.5;

        dir *= 1.0 / float(ITERATIONS) * Density;
        float illuminationDecay = 1.0;

        float color = texture2D(uTexture, vUv).a;

        for (int i = 0; i < ITERATIONS; i++)
        {
            coord -= dir;
            float col = texture2D(uTexture, coord).a;
            color += col * illuminationDecay * weight;
            illuminationDecay *= Decay;
        }

        gl_FragColor = vec4(color * Exposure, 0.0, 0.0, 1.0);
    }
`);

const splatShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    uniform sampler2D uTarget;
    uniform float aspectRatio;
    uniform vec3 color;
    uniform vec2 point;
    uniform float radius;

    void main () {
        vec2 p = vUv - point.xy;
        p.x *= aspectRatio;
        vec3 splat = exp(-dot(p, p) / radius) * color;
        vec3 base = texture2D(uTarget, vUv).xyz;
        gl_FragColor = vec4(base + splat, 1.0);
    }
`);

const advectionShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    uniform sampler2D uVelocity;
    uniform sampler2D uSource;
    uniform vec2 texelSize;
    uniform vec2 dyeTexelSize;
    uniform float dt;
    uniform float dissipation;

    vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
        vec2 st = uv / tsize - 0.5;

        vec2 iuv = floor(st);
        vec2 fuv = fract(st);

        vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
        vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
        vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
        vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);

        return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
    }

    void main () {
    #ifdef MANUAL_FILTERING
        vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
        vec4 result = bilerp(uSource, coord, dyeTexelSize);
    #else
        vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
        vec4 result = texture2D(uSource, coord);
    #endif
        float decay = 1.0 + dissipation * dt;
        gl_FragColor = result / decay;
    }`,
    ext.supportLinearFiltering ? null : ['MANUAL_FILTERING']
);

const divergenceShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;

    varying highp vec2 vUv;
    varying highp vec2 vL;
    varying highp vec2 vR;
    varying highp vec2 vT;
    varying highp vec2 vB;
    uniform sampler2D uVelocity;

    void main () {
        float L = texture2D(uVelocity, vL).x;
        float R = texture2D(uVelocity, vR).x;
        float T = texture2D(uVelocity, vT).y;
        float B = texture2D(uVelocity, vB).y;

        vec2 C = texture2D(uVelocity, vUv).xy;
        if (vL.x < 0.0) { L = -C.x; }
        if (vR.x > 1.0) { R = -C.x; }
        if (vT.y > 1.0) { T = -C.y; }
        if (vB.y < 0.0) { B = -C.y; }

        float div = 0.5 * (R - L + T - B);
        gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
    }
`);

const curlShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;

    varying highp vec2 vUv;
    varying highp vec2 vL;
    varying highp vec2 vR;
    varying highp vec2 vT;
    varying highp vec2 vB;
    uniform sampler2D uVelocity;

    void main () {
        float L = texture2D(uVelocity, vL).y;
        float R = texture2D(uVelocity, vR).y;
        float T = texture2D(uVelocity, vT).x;
        float B = texture2D(uVelocity, vB).x;
        float vorticity = R - L - T + B;
        gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
    }
`);

const vorticityShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uVelocity;
    uniform sampler2D uCurl;
    uniform float curl;
    uniform float dt;

    void main () {
        float L = texture2D(uCurl, vL).x;
        float R = texture2D(uCurl, vR).x;
        float T = texture2D(uCurl, vT).x;
        float B = texture2D(uCurl, vB).x;
        float C = texture2D(uCurl, vUv).x;

        vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
        force /= length(force) + 0.0001;
        force *= curl * C;
        force.y *= -1.0;

        vec2 velocity = texture2D(uVelocity, vUv).xy;
        velocity += force * dt;
        velocity = min(max(velocity, -1000.0), 1000.0);
        gl_FragColor = vec4(velocity, 0.0, 1.0);
    }
`);

const pressureShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;

    varying highp vec2 vUv;
    varying highp vec2 vL;
    varying highp vec2 vR;
    varying highp vec2 vT;
    varying highp vec2 vB;
    uniform sampler2D uPressure;
    uniform sampler2D uDivergence;

    void main () {
        float L = texture2D(uPressure, vL).x;
        float R = texture2D(uPressure, vR).x;
        float T = texture2D(uPressure, vT).x;
        float B = texture2D(uPressure, vB).x;
        float C = texture2D(uPressure, vUv).x;
        float divergence = texture2D(uDivergence, vUv).x;
        float pressure = (L + R + B + T - divergence) * 0.25;
        gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
    }
`);

const gradientSubtractShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;

    varying highp vec2 vUv;
    varying highp vec2 vL;
    varying highp vec2 vR;
    varying highp vec2 vT;
    varying highp vec2 vB;
    uniform sampler2D uPressure;
    uniform sampler2D uVelocity;

    void main () {
        float L = texture2D(uPressure, vL).x;
        float R = texture2D(uPressure, vR).x;
        float T = texture2D(uPressure, vT).x;
        float B = texture2D(uPressure, vB).x;
        vec2 velocity = texture2D(uVelocity, vUv).xy;
        velocity.xy -= vec2(R - L, T - B);
        gl_FragColor = vec4(velocity, 0.0, 1.0);
    }
`);

const blit = (() => {
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    return (target, clear = false) => {
        if (target == null)
        {
            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }
        else
        {
            gl.viewport(0, 0, target.width, target.height);
            gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
        }
        if (clear)
        {
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
        }
        // CHECK_FRAMEBUFFER_STATUS();
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }
})();

function CHECK_FRAMEBUFFER_STATUS () {
    let status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status != gl.FRAMEBUFFER_COMPLETE)
        console.trace("Framebuffer error: " + status);
}

let dye;
let velocity;
let divergence;
let curl;
let pressure;
let bloom;
let bloomFramebuffers = [];
let sunrays;
let sunraysTemp;

// Create a simple noise texture for dithering instead of loading external file
let ditheringTexture = createNoiseTexture();

const blurProgram            = new Program(blurVertexShader, blurShader);
const copyProgram            = new Program(baseVertexShader, copyShader);
const clearProgram           = new Program(baseVertexShader, clearShader);
const colorProgram           = new Program(baseVertexShader, colorShader);
const simpleTextureProgram   = new Program(baseVertexShader, simpleTextureShader);
const cameraProgram          = new Program(baseVertexShader, cameraShader);
const backgroundVideoProgram = new Program(baseVertexShader, backgroundVideoShader);
const checkerboardProgram    = new Program(baseVertexShader, checkerboardShader);
const bloomPrefilterProgram  = new Program(baseVertexShader, bloomPrefilterShader);
const bloomBlurProgram       = new Program(baseVertexShader, bloomBlurShader);
const bloomFinalProgram      = new Program(baseVertexShader, bloomFinalShader);
const sunraysMaskProgram     = new Program(baseVertexShader, sunraysMaskShader);
const sunraysProgram         = new Program(baseVertexShader, sunraysShader);
const splatProgram           = new Program(baseVertexShader, splatShader);
const advectionProgram       = new Program(baseVertexShader, advectionShader);
const divergenceProgram      = new Program(baseVertexShader, divergenceShader);
const curlProgram            = new Program(baseVertexShader, curlShader);
const vorticityProgram       = new Program(baseVertexShader, vorticityShader);
const pressureProgram        = new Program(baseVertexShader, pressureShader);
const gradienSubtractProgram = new Program(baseVertexShader, gradientSubtractShader);

const displayMaterial = new Material(baseVertexShader, displayShaderSource);

function initFramebuffers () {
    let simRes = getResolution(config.SIM_RESOLUTION);
    let dyeRes = getResolution(config.DYE_RESOLUTION);

    const texType = ext.halfFloatTexType;
    const rgba    = ext.formatRGBA;
    const rg      = ext.formatRG;
    const r       = ext.formatR;
    const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

    gl.disable(gl.BLEND);

    if (dye == null)
        dye = createDoubleFBO(dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);
    else
        dye = resizeDoubleFBO(dye, dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);

    if (velocity == null)
        velocity = createDoubleFBO(simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);
    else
        velocity = resizeDoubleFBO(velocity, simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);

    divergence = createFBO      (simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
    curl       = createFBO      (simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
    pressure   = createDoubleFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);

    initBloomFramebuffers();
    initSunraysFramebuffers();
}

function initBloomFramebuffers () {
    let res = getResolution(config.BLOOM_RESOLUTION);

    const texType = ext.halfFloatTexType;
    const rgba = ext.formatRGBA;
    const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

    bloom = createFBO(res.width, res.height, rgba.internalFormat, rgba.format, texType, filtering);

    bloomFramebuffers.length = 0;
    for (let i = 0; i < config.BLOOM_ITERATIONS; i++)
    {
        let width = res.width >> (i + 1);
        let height = res.height >> (i + 1);

        if (width < 2 || height < 2) break;

        let fbo = createFBO(width, height, rgba.internalFormat, rgba.format, texType, filtering);
        bloomFramebuffers.push(fbo);
    }
}

function initSunraysFramebuffers () {
    let res = getResolution(config.SUNRAYS_RESOLUTION);

    const texType = ext.halfFloatTexType;
    const r = ext.formatR;
    const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

    sunrays     = createFBO(res.width, res.height, r.internalFormat, r.format, texType, filtering);
    sunraysTemp = createFBO(res.width, res.height, r.internalFormat, r.format, texType, filtering);
}

function createFBO (w, h, internalFormat, format, type, param) {
    gl.activeTexture(gl.TEXTURE0);
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

    let fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.viewport(0, 0, w, h);
    gl.clear(gl.COLOR_BUFFER_BIT);

    let texelSizeX = 1.0 / w;
    let texelSizeY = 1.0 / h;

    return {
        texture,
        fbo,
        width: w,
        height: h,
        texelSizeX,
        texelSizeY,
        attach (id) {
            gl.activeTexture(gl.TEXTURE0 + id);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            return id;
        }
    };
}

function createDoubleFBO (w, h, internalFormat, format, type, param) {
    let fbo1 = createFBO(w, h, internalFormat, format, type, param);
    let fbo2 = createFBO(w, h, internalFormat, format, type, param);

    return {
        width: w,
        height: h,
        texelSizeX: fbo1.texelSizeX,
        texelSizeY: fbo1.texelSizeY,
        get read () {
            return fbo1;
        },
        set read (value) {
            fbo1 = value;
        },
        get write () {
            return fbo2;
        },
        set write (value) {
            fbo2 = value;
        },
        swap () {
            let temp = fbo1;
            fbo1 = fbo2;
            fbo2 = temp;
        }
    }
}

function resizeFBO (target, w, h, internalFormat, format, type, param) {
    let newFBO = createFBO(w, h, internalFormat, format, type, param);
    copyProgram.bind();
    gl.uniform1i(copyProgram.uniforms.uTexture, target.attach(0));
    blit(newFBO);
    return newFBO;
}

function resizeDoubleFBO (target, w, h, internalFormat, format, type, param) {
    if (target.width == w && target.height == h)
        return target;
    target.read = resizeFBO(target.read, w, h, internalFormat, format, type, param);
    target.write = createFBO(w, h, internalFormat, format, type, param);
    target.width = w;
    target.height = h;
    target.texelSizeX = 1.0 / w;
    target.texelSizeY = 1.0 / h;
    return target;
}

function createTextureAsync (url) {
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255]));

    let obj = {
        texture,
        width: 1,
        height: 1,
        attach (id) {
            gl.activeTexture(gl.TEXTURE0 + id);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            return id;
        }
    };

    let image = new Image();
    image.onload = () => {
        obj.width = image.width;
        obj.height = image.height;
        gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    };
    image.src = url;

    return obj;
}

function createNoiseTexture() {
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    
    // Create a 256x256 noise texture for dithering (ultra fine)
    const size = 256;
    const data = new Uint8Array(size * size * 3);
    
    for (let i = 0; i < data.length; i += 3) {
        // Generate subtle noise pattern (reduced contrast for less visibility)
        const noise = 128 + (Math.random() - 0.5) * 64; // Range: 96-160 instead of 0-255
        data[i] = noise;     // R
        data[i + 1] = noise; // G
        data[i + 2] = noise; // B
    }
    
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, size, size, 0, gl.RGB, gl.UNSIGNED_BYTE, data);
    
    return {
        texture,
        width: size,
        height: size,
        attach (id) {
            gl.activeTexture(gl.TEXTURE0 + id);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            return id;
        }
    };
}

function updateKeywords () {
    let displayKeywords = [];
    if (config.SHADING) displayKeywords.push("SHADING");
    if (config.BLOOM) displayKeywords.push("BLOOM");
    if (config.SUNRAYS) displayKeywords.push("SUNRAYS");
    displayMaterial.setKeywords(displayKeywords);
}

updateKeywords();
initFramebuffers();
multipleSplats(parseInt(Math.random() * 20) + 5);

let lastUpdateTime = Date.now();
let colorUpdateTimer = 0.0;
let previousColorfulState = config.COLORFUL;
let isFluidVisible = true; // Track fluid visibility for performance optimization
let performanceStats = { skippedFrames: 0, renderedFrames: 0 }; // Performance monitoring
update();

function update () {
    // Skip all fluid operations when not visible for performance
    if (!isFluidVisible) {
        performanceStats.skippedFrames++;
        requestAnimationFrame(update);
        return;
    }
    
    performanceStats.renderedFrames++;
    
    const dt = calcDeltaTime();
    
    // Mobile performance optimization
    if (isMobile()) {
        // Throttle updates on mobile for better performance
        if (dt < 0.016) { // Cap at 60fps
            requestAnimationFrame(update);
            return;
        }
    }
    
    if (resizeCanvas())
        initFramebuffers();
    updateColors(dt);
    applyInputs();
    if (!config.PAUSED)
        step(dt);
    render(null);
    requestAnimationFrame(update);
}

function calcDeltaTime () {
    let now = Date.now();
    let dt = (now - lastUpdateTime) / 1000;
    dt = Math.min(dt, 0.016666);
    lastUpdateTime = now;
    return dt;
}

function resizeCanvas () {
    // Get actual viewport dimensions
    let width, height;
    
    if (isMobile()) {
        // On mobile, use viewport dimensions directly
        width = window.innerWidth;
        height = window.innerHeight;
        
        // Account for landscape mode with control panel
        if (window.innerWidth > window.innerHeight && window.innerWidth <= 768) {
            // Landscape mode - subtract control panel width (320px) + right padding (20px) + left margin (20px)
            width = window.innerWidth - 360;
        }
        
        // Scale by pixel ratio but limit for performance
        width = scaleByPixelRatio(width);
        height = scaleByPixelRatio(height);
        
        // Limit canvas resolution on mobile for better performance
        const maxMobileSize = 1024;
        if (width > maxMobileSize) {
            const ratio = height / width;
            width = maxMobileSize;
            height = maxMobileSize * ratio;
        }
        if (height > maxMobileSize) {
            const ratio = width / height;
            height = maxMobileSize;
            width = maxMobileSize * ratio;
        }
    } else {
        // Desktop - use client dimensions
        width = scaleByPixelRatio(canvas.clientWidth);
        height = scaleByPixelRatio(canvas.clientHeight);
    }
    
    if (canvas.width != width || canvas.height != height) {
        canvas.width = width;
        canvas.height = height;
        return true;
    }
    return false;
}

function updateColors (dt) {
    // Check if colorful mode state has changed
    if (previousColorfulState !== config.COLORFUL) {
        // Colorful mode state changed - update all pointer colors immediately
        pointers.forEach(p => {
            p.color = generateColor();
        });
        
        if (window.oscPointers) {
            Object.values(window.oscPointers).forEach(p => {
                p.color = generateColor();
                if (config.DEBUG_MODE) {
                    console.log(`🎨 OSC Color Updated (mode changed):`, p.color);
                }
            });
        }
        
        previousColorfulState = config.COLORFUL;
        
        if (config.DEBUG_MODE) {
            console.log(`🎨 Colorful mode changed to: ${config.COLORFUL}`);
        }
    }
    
    if (!config.COLORFUL) return;

    colorUpdateTimer += dt * config.COLOR_UPDATE_SPEED;
    if (colorUpdateTimer >= 1) {
        colorUpdateTimer = wrap(colorUpdateTimer, 0, 1);
        pointers.forEach(p => {
            p.color = generateColor();
        });
        
        // Update OSC pointer colors when colorful mode is enabled
        if (window.oscPointers) {
            Object.values(window.oscPointers).forEach(p => {
                p.color = generateColor();
                if (config.DEBUG_MODE) {
                    console.log(`🎨 OSC Color Updated:`, p.color);
                }
            });
        }
    }
}

function applyInputs () {
    if (splatStack.length > 0)
        multipleSplats(splatStack.pop());

    pointers.forEach(p => {
        if (p.moved) {
            p.moved = false;
            splatPointer(p);
        }
    });
}

function step (dt) {
    gl.disable(gl.BLEND);

    curlProgram.bind();
    gl.uniform2f(curlProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(curlProgram.uniforms.uVelocity, velocity.read.attach(0));
    blit(curl);

    vorticityProgram.bind();
    gl.uniform2f(vorticityProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(vorticityProgram.uniforms.uVelocity, velocity.read.attach(0));
    gl.uniform1i(vorticityProgram.uniforms.uCurl, curl.attach(1));
    gl.uniform1f(vorticityProgram.uniforms.curl, config.CURL);
    gl.uniform1f(vorticityProgram.uniforms.dt, dt);
    blit(velocity.write);
    velocity.swap();

    divergenceProgram.bind();
    gl.uniform2f(divergenceProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(divergenceProgram.uniforms.uVelocity, velocity.read.attach(0));
    blit(divergence);

    clearProgram.bind();
    gl.uniform1i(clearProgram.uniforms.uTexture, pressure.read.attach(0));
    gl.uniform1f(clearProgram.uniforms.value, config.PRESSURE);
    blit(pressure.write);
    pressure.swap();

    pressureProgram.bind();
    gl.uniform2f(pressureProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(pressureProgram.uniforms.uDivergence, divergence.attach(0));
    for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
        gl.uniform1i(pressureProgram.uniforms.uPressure, pressure.read.attach(1));
        blit(pressure.write);
        pressure.swap();
    }

    gradienSubtractProgram.bind();
    gl.uniform2f(gradienSubtractProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(gradienSubtractProgram.uniforms.uPressure, pressure.read.attach(0));
    gl.uniform1i(gradienSubtractProgram.uniforms.uVelocity, velocity.read.attach(1));
    blit(velocity.write);
    velocity.swap();

    advectionProgram.bind();
    gl.uniform2f(advectionProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    if (!ext.supportLinearFiltering)
        gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, velocity.texelSizeX, velocity.texelSizeY);
    let velocityId = velocity.read.attach(0);
    gl.uniform1i(advectionProgram.uniforms.uVelocity, velocityId);
    gl.uniform1i(advectionProgram.uniforms.uSource, velocityId);
    gl.uniform1f(advectionProgram.uniforms.dt, dt);
    gl.uniform1f(advectionProgram.uniforms.dissipation, config.VELOCITY_DISSIPATION);
    blit(velocity.write);
    velocity.swap();

    if (!ext.supportLinearFiltering)
        gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, dye.texelSizeX, dye.texelSizeY);
    gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read.attach(0));
    gl.uniform1i(advectionProgram.uniforms.uSource, dye.read.attach(1));
    gl.uniform1f(advectionProgram.uniforms.dissipation, config.DENSITY_DISSIPATION);
    blit(dye.write);
    dye.swap();
}

function render (target) {
    if (config.BLOOM)
        applyBloom(dye.read, bloom);
    if (config.SUNRAYS) {
        applySunrays(dye.read, dye.write, sunrays);
        blur(sunrays, sunraysTemp, 1);
    }

    if (target == null || !config.TRANSPARENT) {
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.BLEND);
    }
    else {
        gl.disable(gl.BLEND);
    }

    if (!config.TRANSPARENT)
        drawColor(target, config.BACK_COLOR);
    if (target == null && config.TRANSPARENT)
        drawCheckerboard(target);
    
    // Draw fluid background camera if active (bottom layer)
    if (fluidBackgroundCamera.active && fluidBackgroundCamera.video) {
        drawFluidBackgroundCamera(target);
    }
    
    // Draw fluid background media if loaded (top layer)
    if (fluidBackgroundMedia.loaded && fluidBackgroundMedia.element) {
        drawFluidBackgroundMedia(target);
    }
    
    // Draw background media if loaded
    if (backgroundMedia.loaded && backgroundMedia.texture) {
        // Update video texture if it's a video
        if (backgroundMedia.type === 'video') {
            updateBackgroundVideoTexture();
        }
        drawBackgroundMedia(target);
    } else if (backgroundMedia.loaded && !backgroundMedia.texture) {
        // Debug: Media loaded but no texture
        console.warn('Background media loaded but texture missing:', backgroundMedia.type);
    }
    
    drawDisplay(target);
}

function drawColor (target, color) {
    colorProgram.bind();
    gl.uniform4f(colorProgram.uniforms.color, color.r, color.g, color.b, 1);
    blit(target);
}

function drawBackgroundImage (target) {
    drawBackgroundMedia(target);
}

function drawBackgroundMedia (target) {
    // Enable blending for the background media with premultiplied alpha
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    
    // Bind the background media texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, backgroundMedia.texture);
    
    if (backgroundMedia.type === 'video') {
        // Use background video program for videos with scaling support
        backgroundVideoProgram.bind();
        gl.uniform1i(backgroundVideoProgram.uniforms.uTexture, 0);
        
        // Calculate aspect ratios for proper video scaling
        const canvasWidth = target == null ? gl.drawingBufferWidth : target.width;
        const canvasHeight = target == null ? gl.drawingBufferHeight : target.height;
        const canvasAspect = canvasWidth / canvasHeight;
        const videoAspect = backgroundMedia.width / backgroundMedia.height;
        
        gl.uniform1f(backgroundVideoProgram.uniforms.uCanvasAspect, canvasAspect);
        gl.uniform1f(backgroundVideoProgram.uniforms.uVideoAspect, videoAspect);
        gl.uniform1f(backgroundVideoProgram.uniforms.uScale, config.BACKGROUND_IMAGE_SCALE || 1.0);
    } else {
        // Use simple texture program for images (already have proper scaling)
        simpleTextureProgram.bind();
        gl.uniform1i(simpleTextureProgram.uniforms.uTexture, 0);
    }
    
    // Draw the background media
    blit(target);
    
    // Restore blending state
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
}

function drawFluidBackgroundMedia(target) {
    // Create texture if not exists
    if (!fluidBackgroundMedia.texture) {
        fluidBackgroundMedia.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, fluidBackgroundMedia.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    
    // Update texture with current media
    gl.bindTexture(gl.TEXTURE_2D, fluidBackgroundMedia.texture);
    try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, fluidBackgroundMedia.element);
    } catch (e) {
        console.warn('Failed to update fluid background texture:', e);
        return;
    }
    
    // Enable blending
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    
    // Use background video program for proper scaling
    backgroundVideoProgram.bind();
    gl.uniform1i(backgroundVideoProgram.uniforms.uTexture, 0);
    
    // Calculate aspect ratios
    const canvasWidth = target == null ? gl.drawingBufferWidth : target.width;
    const canvasHeight = target == null ? gl.drawingBufferHeight : target.height;
    const canvasAspect = canvasWidth / canvasHeight;
    const mediaAspect = fluidBackgroundMedia.width / fluidBackgroundMedia.height;
    
    // Pass uniforms
    gl.uniform1f(backgroundVideoProgram.uniforms.uCanvasAspect, canvasAspect);
    gl.uniform1f(backgroundVideoProgram.uniforms.uVideoAspect, mediaAspect);
    gl.uniform1f(backgroundVideoProgram.uniforms.uScale, fluidBackgroundMedia.scale);
    
    // Draw the media
    blit(target);
    
    // Restore blending state
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
}

function drawFluidBackgroundCamera(target) {
    // Create texture if not exists
    if (!fluidBackgroundCamera.texture) {
        fluidBackgroundCamera.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, fluidBackgroundCamera.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    
    // Update texture with current camera frame
    gl.bindTexture(gl.TEXTURE_2D, fluidBackgroundCamera.texture);
    try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, fluidBackgroundCamera.video);
        
        // Mobile debugging for first few frames
        if (isMobile() && !fluidBackgroundCamera.debugFrameCount) {
            fluidBackgroundCamera.debugFrameCount = 0;
        }
        if (isMobile() && fluidBackgroundCamera.debugFrameCount < 3) {
            fluidBackgroundCamera.debugFrameCount++;
            console.log(`📱 Fluid background camera frame ${fluidBackgroundCamera.debugFrameCount}: texture updated successfully`);
        }
        
    } catch (e) {
        if (isMobile()) {
            console.warn('📱 Mobile fluid background camera texture update failed:', e);
        } else {
            console.warn('Failed to update fluid background camera texture:', e);
        }
        return;
    }
    
    // Enable blending
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    
    // Use background video program for proper scaling
    backgroundVideoProgram.bind();
    gl.uniform1i(backgroundVideoProgram.uniforms.uTexture, 0);
    
    // Calculate aspect ratios
    const canvasWidth = target == null ? gl.drawingBufferWidth : target.width;
    const canvasHeight = target == null ? gl.drawingBufferHeight : target.height;
    const canvasAspect = canvasWidth / canvasHeight;
    const cameraAspect = fluidBackgroundCamera.width / fluidBackgroundCamera.height;
    
    // Pass uniforms
    gl.uniform1f(backgroundVideoProgram.uniforms.uCanvasAspect, canvasAspect);
    gl.uniform1f(backgroundVideoProgram.uniforms.uVideoAspect, cameraAspect);
    gl.uniform1f(backgroundVideoProgram.uniforms.uScale, fluidBackgroundCamera.scale);
    
    // Draw the camera feed
    blit(target);
    
    // Restore blending state
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
}

// drawCameraFeed function removed - using simple canvas overlay instead

function drawCheckerboard (target) {
    checkerboardProgram.bind();
    gl.uniform1f(checkerboardProgram.uniforms.aspectRatio, canvas.width / canvas.height);
    blit(target);
}

function drawDisplay (target) {
    let width = target == null ? gl.drawingBufferWidth : target.width;
    let height = target == null ? gl.drawingBufferHeight : target.height;

    displayMaterial.bind();
    if (config.SHADING)
        gl.uniform2f(displayMaterial.uniforms.texelSize, 1.0 / width, 1.0 / height);
    gl.uniform1i(displayMaterial.uniforms.uTexture, dye.read.attach(0));
    if (config.BLOOM) {
        gl.uniform1i(displayMaterial.uniforms.uBloom, bloom.attach(1));
        gl.uniform1i(displayMaterial.uniforms.uDithering, ditheringTexture.attach(2));
        let scale = getTextureScale(ditheringTexture, width, height);
        gl.uniform2f(displayMaterial.uniforms.ditherScale, scale.x, scale.y);
    }
    if (config.SUNRAYS)
        gl.uniform1i(displayMaterial.uniforms.uSunrays, sunrays.attach(3));
    blit(target);
}

function applyBloom (source, destination) {
    if (bloomFramebuffers.length < 2)
        return;

    let last = destination;

    gl.disable(gl.BLEND);
    bloomPrefilterProgram.bind();
    let knee = config.BLOOM_THRESHOLD * config.BLOOM_SOFT_KNEE + 0.0001;
    let curve0 = config.BLOOM_THRESHOLD - knee;
    let curve1 = knee * 2;
    let curve2 = 0.25 / knee;
    gl.uniform3f(bloomPrefilterProgram.uniforms.curve, curve0, curve1, curve2);
    gl.uniform1f(bloomPrefilterProgram.uniforms.threshold, config.BLOOM_THRESHOLD);
    gl.uniform1i(bloomPrefilterProgram.uniforms.uTexture, source.attach(0));
    blit(last);

    bloomBlurProgram.bind();
    for (let i = 0; i < bloomFramebuffers.length; i++) {
        let dest = bloomFramebuffers[i];
        gl.uniform2f(bloomBlurProgram.uniforms.texelSize, last.texelSizeX, last.texelSizeY);
        gl.uniform1i(bloomBlurProgram.uniforms.uTexture, last.attach(0));
        blit(dest);
        last = dest;
    }

    gl.blendFunc(gl.ONE, gl.ONE);
    gl.enable(gl.BLEND);

    for (let i = bloomFramebuffers.length - 2; i >= 0; i--) {
        let baseTex = bloomFramebuffers[i];
        gl.uniform2f(bloomBlurProgram.uniforms.texelSize, last.texelSizeX, last.texelSizeY);
        gl.uniform1i(bloomBlurProgram.uniforms.uTexture, last.attach(0));
        gl.viewport(0, 0, baseTex.width, baseTex.height);
        blit(baseTex);
        last = baseTex;
    }

    gl.disable(gl.BLEND);
    bloomFinalProgram.bind();
    gl.uniform2f(bloomFinalProgram.uniforms.texelSize, last.texelSizeX, last.texelSizeY);
    gl.uniform1i(bloomFinalProgram.uniforms.uTexture, last.attach(0));
    gl.uniform1f(bloomFinalProgram.uniforms.intensity, config.BLOOM_INTENSITY);
    blit(destination);
}

function applySunrays (source, mask, destination) {
    gl.disable(gl.BLEND);
    sunraysMaskProgram.bind();
    gl.uniform1i(sunraysMaskProgram.uniforms.uTexture, source.attach(0));
    blit(mask);

    sunraysProgram.bind();
    gl.uniform1f(sunraysProgram.uniforms.weight, config.SUNRAYS_WEIGHT);
    gl.uniform1i(sunraysProgram.uniforms.uTexture, mask.attach(0));
    blit(destination);
}

function blur (target, temp, iterations) {
    blurProgram.bind();
    for (let i = 0; i < iterations; i++) {
        gl.uniform2f(blurProgram.uniforms.texelSize, target.texelSizeX, 0.0);
        gl.uniform1i(blurProgram.uniforms.uTexture, target.attach(0));
        blit(temp);

        gl.uniform2f(blurProgram.uniforms.texelSize, 0.0, target.texelSizeY);
        gl.uniform1i(blurProgram.uniforms.uTexture, temp.attach(0));
        blit(target);
    }
}

function splatPointer (pointer) {
    let dx = pointer.deltaX * config.SPLAT_FORCE;
    let dy = pointer.deltaY * config.SPLAT_FORCE;
    
    if (config.VELOCITY_DRAWING) {
        // Calculate velocity magnitude from deltas
        const velocity = Math.sqrt(pointer.deltaX * pointer.deltaX + pointer.deltaY * pointer.deltaY);
        
        // Scale velocity for reasonable multiplier range (0.5x to 3x)
        const velocityMultiplier = Math.min(3.0, 0.5 + velocity * 25.0);
        
        // Apply velocity scaling to force (affects splat size and intensity)
        dx *= velocityMultiplier;
        dy *= velocityMultiplier;
        
        // Create brighter color based on velocity
        const brightColor = {
            r: Math.min(1.0, pointer.color.r * velocityMultiplier),
            g: Math.min(1.0, pointer.color.g * velocityMultiplier), 
            b: Math.min(1.0, pointer.color.b * velocityMultiplier)
        };
        
        splat(pointer.texcoordX, pointer.texcoordY, dx, dy, brightColor);
    } else {
        splat(pointer.texcoordX, pointer.texcoordY, dx, dy, pointer.color);
    }
}

function multipleSplats (amount) {
    for (let i = 0; i < amount; i++) {
        const color = generateColor();
        color.r *= 10.0;
        color.g *= 10.0;
        color.b *= 10.0;
        const x = Math.random();
        const y = Math.random();
        // Increased force for longer movements (from 1000 to 2500)
        const dx = 2500 * (Math.random() - 0.5);
        const dy = 2500 * (Math.random() - 0.5);
        splat(x, y, dx, dy, color);
    }
}

function createVelocityClickEffect(x, y, baseColor) {
    // Randomized parameters for varied effects each time
    const centralForceMultiplier = 1.5 + Math.random() * 1.0; // 1.5x to 2.5x (reduced from 4x)
    const centralBrightness = 1.8 + Math.random() * 0.7; // 1.8x to 2.5x brightness
    
    // Create enhanced central splat with randomized strength
    const centralForce = config.SPLAT_FORCE * centralForceMultiplier;
    const enhancedColor = {
        r: Math.min(1.0, baseColor.r * centralBrightness),
        g: Math.min(1.0, baseColor.g * centralBrightness),
        b: Math.min(1.0, baseColor.b * centralBrightness)
    };
    
    // Central splat with more randomized direction
    const centralDx = centralForce * (Math.random() - 0.5) * (0.2 + Math.random() * 0.3);
    const centralDy = centralForce * (Math.random() - 0.5) * (0.2 + Math.random() * 0.3);
    splat(x, y, centralDx, centralDy, enhancedColor);
    
    // Randomized burst parameters
    const burstCount = 3 + Math.floor(Math.random() * 3); // 3-5 splats
    const burstRadius = 0.003 + Math.random() * 0.005; // 0.003-0.008 base radius (much smaller)
    const burstForceBase = config.SPLAT_FORCE * (0.8 + Math.random() * 0.4); // 0.8x-1.2x force
    
    for (let i = 0; i < burstCount; i++) {
        // Base angle with jitter for irregular pattern
        const baseAngle = (i / burstCount) * Math.PI * 2;
        const angleJitter = (Math.random() - 0.5) * 0.4; // ±0.2 radians jitter
        const angle = baseAngle + angleJitter;
        
        // Randomized radius for each splat
        const splatRadius = burstRadius * (0.3 + Math.random() * 0.5); // 0.3x-0.8x of base radius
        const burstX = x + Math.cos(angle) * splatRadius;
        const burstY = y + Math.sin(angle) * splatRadius;
        
        // Ensure burst splats stay within canvas bounds
        const clampedX = Math.max(0, Math.min(1, burstX));
        const clampedY = Math.max(0, Math.min(1, burstY));
        
        // Randomized outward force for each splat
        const forceVariation = 0.4 + Math.random() * 0.8; // 0.4x-1.2x force variation
        const outwardDx = Math.cos(angle) * burstForceBase * forceVariation;
        const outwardDy = Math.sin(angle) * burstForceBase * forceVariation;
        
        // More varied color for each burst splat
        const colorIntensity = 1.3 + Math.random() * 0.7; // 1.3x-2.0x brightness
        const burstColor = {
            r: Math.min(1.0, baseColor.r * colorIntensity),
            g: Math.min(1.0, baseColor.g * colorIntensity),
            b: Math.min(1.0, baseColor.b * colorIntensity)
        };
        
        splat(clampedX, clampedY, outwardDx, outwardDy, burstColor);
    }
}

function splat (x, y, dx, dy, color) {
    // Debug logging for OSC splats
    if (config.DEBUG_MODE) {
        console.log(`🎨 SPLAT CALLED: pos(${x.toFixed(3)}, ${y.toFixed(3)}) delta(${dx.toFixed(1)}, ${dy.toFixed(1)}) color(${color.r.toFixed(2)}, ${color.g.toFixed(2)}, ${color.b.toFixed(2)})`);
    }
    
    splatProgram.bind();
    gl.uniform1i(splatProgram.uniforms.uTarget, velocity.read.attach(0));
    gl.uniform1f(splatProgram.uniforms.aspectRatio, canvas.width / canvas.height);
    gl.uniform2f(splatProgram.uniforms.point, x, y);
    gl.uniform3f(splatProgram.uniforms.color, dx, dy, 0.0);
    gl.uniform1f(splatProgram.uniforms.radius, correctRadius(config.SPLAT_RADIUS / 100.0));
    blit(velocity.write);
    velocity.swap();

    gl.uniform1i(splatProgram.uniforms.uTarget, dye.read.attach(0));
    gl.uniform3f(splatProgram.uniforms.color, color.r, color.g, color.b);
    blit(dye.write);
    dye.swap();
}

// performSplatAtPosition function REMOVED - replaced by OSC velocity drawing system
// This function created random directional splats (shooting effect) which is unwanted

function correctRadius (radius) {
    let aspectRatio = canvas.width / canvas.height;
    if (aspectRatio > 1)
        radius *= aspectRatio;
    return radius;
}

canvas.addEventListener('mousedown', e => {
    let posX = e.offsetX;
    let posY = e.offsetY;
    let pointer = pointers.find(p => p.id == -1);
    if (pointer == null)
        pointer = new pointerPrototype();
    updatePointerDownData(pointer, -1, posX, posY);
});

canvas.addEventListener('mousemove', e => {
    let pointer = pointers[0];
    
    // Allow movement without clicking when velocity drawing is enabled
    if (!pointer.down && !config.VELOCITY_DRAWING) return;
    
    let posX = e.offsetX;
    let posY = e.offsetY;
    
    // Initialize pointer if velocity drawing is on but pointer isn't down
    if (!pointer.down && config.VELOCITY_DRAWING) {
        // Only initialize if this is truly the first time
        if (pointer.texcoordX === 0 && pointer.texcoordY === 0) {
            pointer.texcoordX = posX / canvas.clientWidth;
            pointer.texcoordY = 1.0 - posY / canvas.clientHeight;
            pointer.prevTexcoordX = pointer.texcoordX;
            pointer.prevTexcoordY = pointer.texcoordY;
            pointer.color = generateColor();
        }
    }
    
    updatePointerMoveData(pointer, posX, posY);
});

window.addEventListener('mouseup', () => {
    updatePointerUpData(pointers[0]);
});

canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const touches = e.targetTouches;
    
    // Enhanced mobile touch handling
    if (isMobile()) {
        // Count touch events for debug overlay
        window.mobileDebugTouchCount = (window.mobileDebugTouchCount || 0) + 1;
        
        console.log('🔍 MOBILE DEBUG: Canvas touchstart with', touches.length, 'touches');
        console.log('🔍 Touch coordinates:', touches[0] ? {x: touches[0].clientX, y: touches[0].clientY} : 'none');
        console.log('🔍 Canvas dimensions:', {width: canvas.clientWidth, height: canvas.clientHeight});
        
        // 2-finger double tap detection for hiding panel and cursor
        if (touches.length === 2) {
            const currentTime = Date.now();
            
            // Check if this is a second tap within 300ms
            if (window.twoFingerFirstTap && (currentTime - window.twoFingerFirstTap) < 300) {
                console.log('🔍 MOBILE DEBUG: 2-finger double tap detected');
                
                // Trigger the same functionality as Ctrl+H
                toggleHideCursor();
                togglePanelVisibility();
                
                // Add haptic feedback for successful double tap
                if (navigator.vibrate) {
                    navigator.vibrate([100, 50, 100]); // Success pattern
                }
                
                // Reset the first tap
                window.twoFingerFirstTap = null;
            } else {
                // Store the first tap time
                window.twoFingerFirstTap = currentTime;
                console.log('🔍 MOBILE DEBUG: 2-finger first tap detected');
                
                // Add haptic feedback for first tap
                if (navigator.vibrate) {
                    navigator.vibrate(50); // Single vibration for first tap
                }
            }
        }
        
        // Add haptic feedback if available (but not for 2-finger tap)
        if (navigator.vibrate && touches.length < 2) {
            navigator.vibrate(10);
        }
        
        // Optimize for mobile performance (allow 2-finger double tap)
        if (touches.length > 2) {
            console.log('🔍 MOBILE DEBUG: Too many touches, limiting to 2');
            // Limit to 2 touches on mobile for better performance
            return;
        }
    }
    
    while (touches.length >= pointers.length)
        pointers.push(new pointerPrototype());
    for (let i = 0; i < touches.length; i++) {
        const rect = canvas.getBoundingClientRect();
        let posX = touches[i].clientX - rect.left;
        let posY = touches[i].clientY - rect.top;
        
        if (isMobile()) {
            console.log('🔍 MOBILE DEBUG: Processing touch', i, 'at position:', {posX, posY});
            console.log('🔍 Canvas rect:', rect);
        }
        
        updatePointerDownData(pointers[i + 1], touches[i].identifier, posX, posY);
    }
}, { passive: false }); // Need preventDefault for fluid interaction

canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    const touches = e.targetTouches;
    
    // Mobile-optimized touch move handling
    if (isMobile()) {
        // Throttle touch events on mobile for better performance
        if (e.timeStamp - (canvas.lastTouchMove || 0) < 16) { // ~60fps
            return;
        }
        canvas.lastTouchMove = e.timeStamp;
        console.log('🔍 MOBILE DEBUG: Canvas touchmove with', touches.length, 'touches');
    }
    
    for (let i = 0; i < touches.length; i++) {
        let pointer = pointers[i + 1];
        
        // Allow touch movement without touching when velocity drawing is enabled
        if (!pointer.down && !config.VELOCITY_DRAWING) continue;
        
        const rect = canvas.getBoundingClientRect();
        let posX = touches[i].clientX - rect.left;
        let posY = touches[i].clientY - rect.top;
        
        // Initialize pointer if velocity drawing is on but pointer isn't down
        if (!pointer.down && config.VELOCITY_DRAWING) {
            // Only initialize if this is truly the first time
            if (pointer.texcoordX === 0 && pointer.texcoordY === 0) {
                pointer.texcoordX = posX / canvas.clientWidth;
                pointer.texcoordY = 1.0 - posY / canvas.clientHeight;
                pointer.prevTexcoordX = pointer.texcoordX;
                pointer.prevTexcoordY = pointer.texcoordY;
                pointer.color = generateColor();
            }
        }
        
        updatePointerMoveData(pointer, posX, posY);
    }
}, { passive: false });

window.addEventListener('touchend', e => {
    const touches = e.changedTouches;
    
    // Handle 2-finger double tap timeout (reset if too much time passes)
    if (isMobile() && window.twoFingerFirstTap) {
        const timeSinceFirstTap = Date.now() - window.twoFingerFirstTap;
        if (timeSinceFirstTap > 300) {
            // Reset if more than 300ms has passed
            window.twoFingerFirstTap = null;
            console.log('🔍 MOBILE DEBUG: 2-finger tap timeout, resetting');
        }
    }
    
    for (let i = 0; i < touches.length; i++)
    {
        let pointer = pointers.find(p => p.id == touches[i].identifier);
        if (pointer == null) continue;
        updatePointerUpData(pointer);
    }
}, { passive: true }); // No preventDefault needed for touchend

window.addEventListener('keydown', e => {
    // Skip shortcuts if user is typing in an input field
    const activeElement = document.activeElement;
    const isTyping = activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.contentEditable === 'true'
    );
    
    if (isTyping) return;
    
    // Require Ctrl modifier for shortcuts to avoid conflicts with text input
    // Use only Ctrl key to avoid interfering with Mac Cmd shortcuts
    if (e.ctrlKey) {
        if (e.code === 'KeyP') {
            e.preventDefault();
            config.PAUSED = !config.PAUSED;
            updateToggle('pausedToggle', config.PAUSED);
            saveConfig();
        }
        if (e.code === 'KeyB') {
            e.preventDefault();
            splatStack.push(parseInt(Math.random() * 20) + 5);
        }
        if (e.code === 'KeyC') {
            e.preventDefault();
            config.COLORFUL = !config.COLORFUL;
            updateToggle('colorfulToggle', config.COLORFUL);
            saveConfig();
        }
        if (e.code === 'KeyD') {
            e.preventDefault();
            toggleDebug();
        }
        if (e.code === 'KeyR') {
            e.preventDefault();
            toggleVideoRecording();
        }
        if (e.code === 'KeyX') {
            e.preventDefault();
            resetValues();
        }
        if (e.code === 'KeyA') {
            e.preventDefault();
            toggleAnimate();
        }
        if (e.code === 'KeyV') {
            e.preventDefault();
            toggleVelocityDrawing();
        }
        if (e.code === 'KeyH') {
            e.preventDefault();
            toggleHideCursor();
            togglePanelVisibility();
        }
        if (e.code === 'Enter') {
            e.preventDefault();
            toggleHideCursor();
            togglePanelVisibility();
        }
        if (e.code === 'KeyO') {
            e.preventDefault();
            togglePanel();
        }
        if (e.code === 'Space') {
            e.preventDefault();
            captureScreenshot();
        }
        
        // Prompt preset shortcuts (Ctrl+1 through Ctrl+6)
        if (e.code === 'Digit1') {
            e.preventDefault();
            setPromptPreset(0); // Blooming flower
        }
        if (e.code === 'Digit2') {
            e.preventDefault();
            setPromptPreset(1); // Jellyfish Ballet
        }
        if (e.code === 'Digit3') {
            e.preventDefault();
            setPromptPreset(2); // Fractal Jellyfish
        }
        if (e.code === 'Digit4') {
            e.preventDefault();
            setPromptPreset(3); // Aurora Mountains
        }
        if (e.code === 'Digit5') {
            e.preventDefault();
            setPromptPreset(4); // Floating Islands
        }
        if (e.code === 'Digit6') {
            e.preventDefault();
            setPromptPreset(5); // Magic Forest
        }
    }
});

function updatePointerDownData (pointer, id, posX, posY) {
    pointer.id = id;
    pointer.down = true;
    pointer.moved = false;
    pointer.texcoordX = posX / canvas.clientWidth;
    pointer.texcoordY = 1.0 - posY / canvas.clientHeight;
    pointer.prevTexcoordX = pointer.texcoordX;
    pointer.prevTexcoordY = pointer.texcoordY;
    pointer.deltaX = 0;
    pointer.deltaY = 0;
    pointer.color = generateColor();
    
    // Create enhanced click effect when force click is enabled AND not in velocity drawing mode
    if (config.FORCE_CLICK && !config.VELOCITY_DRAWING) {
        createVelocityClickEffect(pointer.texcoordX, pointer.texcoordY, pointer.color);
    }
}

function updatePointerMoveData (pointer, posX, posY) {
    pointer.prevTexcoordX = pointer.texcoordX;
    pointer.prevTexcoordY = pointer.texcoordY;
    pointer.texcoordX = posX / canvas.clientWidth;
    pointer.texcoordY = 1.0 - posY / canvas.clientHeight;
    pointer.deltaX = correctDeltaX(pointer.texcoordX - pointer.prevTexcoordX);
    pointer.deltaY = correctDeltaY(pointer.texcoordY - pointer.prevTexcoordY);
    pointer.moved = Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;
}

function updatePointerUpData (pointer) {
    pointer.down = false;
}

function correctDeltaX (delta) {
    let aspectRatio = canvas.width / canvas.height;
    if (aspectRatio < 1) delta *= aspectRatio;
    return delta;
}

function correctDeltaY (delta) {
    let aspectRatio = canvas.width / canvas.height;
    if (aspectRatio > 1) delta /= aspectRatio;
    return delta;
}

function generateColor () {
    if (config.COLORFUL) {
        let c = HSVtoRGB(Math.random(), 1.0, 1.0);
        c.r *= 0.15;
        c.g *= 0.15;
        c.b *= 0.15;
        return c;
    } else {
        // Use static color when Colorful is disabled
        return {
            r: config.STATIC_COLOR.r * 0.15,
            g: config.STATIC_COLOR.g * 0.15,
            b: config.STATIC_COLOR.b * 0.15
        };
    }
}

// Organic Animation Functions
function resetActivityTimer() {
    lastActivityTime = Date.now();
    
    // Only reset animation if Animate toggle is OFF
    if (!config.ANIMATE) {
        if (idleAnimationTimer) {
            clearTimeout(idleAnimationTimer);
            idleAnimationTimer = null;
        }
        scheduleIdleAnimation();
    }
    // When Animate is ON, don't interrupt the continuous animation
}

function scheduleIdleAnimation() {
    if (!idleAnimationEnabled || !config.ANIMATE) return;
    
    idleAnimationTimer = setTimeout(() => {
        if (Date.now() - lastActivityTime >= IDLE_TIMEOUT) {
            startIdleAnimation();
        } else {
            scheduleIdleAnimation();
        }
    }, IDLE_TIMEOUT);
}

function startIdleAnimation() {
    if (!idleAnimationEnabled || config.PAUSED || !config.ANIMATE) return;
    
    // Create organic fluid animation
    createOrganicSplat();
    
    // Use interval and breathing to determine timing
    const interval = config.ANIMATION_INTERVAL; // 0-1 range, flipped logic
    const breathing = config.BREATHING;
    
    // Breathing affects timing variation
    const breathingPhase = Math.sin(Date.now() * 0.003 * (breathing + 0.1)) * 0.5 + 0.5;
    
    // Flipped interval logic: 0 = very slow (3000ms), 1 = fast (358ms)
    // At 10% slider (0.1): default comfortable speed
    const minInterval = 358;   // 0.358 seconds (fast)
    const maxInterval = 3000;  // 3.0 seconds (very slow)
    const baseInterval = maxInterval - (interval * (maxInterval - minInterval)); // Flipped
    
    // Breathing creates natural rhythm variations
    const breathingVariation = 0.8 + (breathing * breathingPhase * 0.4); // 0.8-1.2 variation
    const finalInterval = baseInterval * breathingVariation;
    
    idleAnimationTimer = setTimeout(() => {
        if (config.ANIMATE) {
            // When Animate toggle is ON, continue regardless of user activity
            startIdleAnimation(); // Continue organic animation
        } else if (Date.now() - lastActivityTime >= IDLE_TIMEOUT || liveliness > 0.1) {
            // When Animate toggle is OFF, only animate during idle periods
            startIdleAnimation(); // Continue organic animation
        } else {
            scheduleIdleAnimation(); // User became active, wait again
        }
    }, finalInterval);
}

function createOrganicSplat() {
    // Redesigned animation parameters with intuitive 0-1 ranges and Ctrl+B intensity
    const interval = config.ANIMATION_INTERVAL; // Now controls splat count instead of liveliness
    const chaos = config.CHAOS;
    const breathing = config.BREATHING;
    const colorLife = config.COLOR_LIFE;
    
    // Enhanced breathing effect with more dramatic timing variations
    const time = Date.now() * 0.001;
    const breathingSpeed = 0.5 + (breathing * 1.5); // 0.5-2.0 speed range
    const breathingPhase = Math.sin(time * breathingSpeed) * 0.5 + 0.5;
    
    // INTERVAL: Controls splat count (0 = few splats, 1 = many splats)
    const baseSplatCount = Math.floor(interval * 7 + 1); // Clean 1-8 range
    const breathingPulse = 0.7 + (breathing * breathingPhase * 0.6); // 0.7-1.3 multiplier
    const finalSplatCount = Math.max(1, Math.floor(baseSplatCount * breathingPulse));
    
    // Create organic splats with redesigned logic
    for (let i = 0; i < finalSplatCount; i++) {
        const color = generateOrganicColor(colorLife);
        
        // CHAOS: Intuitive position spreading (0 = tight cluster, 1 = full screen chaos)
        const clusterCenter = chaos < 0.5 ? 0.5 : Math.random(); // Low chaos = center, high chaos = anywhere
        const spreadRadius = chaos * 0.8; // 0-0.8 spread range
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * spreadRadius;
        
        const x = Math.max(0, Math.min(1, clusterCenter + Math.cos(angle) * distance));
        const y = Math.max(0, Math.min(1, clusterCenter + Math.sin(angle) * distance));
        
        // CHAOS: Flow direction (0 = coherent streams, 1 = random directions)
        const coherentFlow = (1 - chaos) * (Math.PI * 0.25 + time * 0.1); // Slow rotating flow
        const randomChaos = chaos * Math.PI * 2 * Math.random();
        const flowWeight = 1 - chaos;
        const finalAngle = coherentFlow * flowWeight + randomChaos * chaos;
        
        // INTERVAL: Force strength (0 = gentle, 1 = powerful like Ctrl+B)
        const baseForce = 3000 + (interval * 15000); // 3k-18k range (matches Ctrl+B intensity)
        const breathingForce = 0.8 + (breathing * breathingPhase * 0.4); // 0.8-1.2 breathing boost
        const forceStrength = baseForce * breathingForce;
        
        const dx = forceStrength * Math.cos(finalAngle);
        const dy = forceStrength * Math.sin(finalAngle);
        
        // BREATHING: Size variation (0 = consistent size, 1 = dramatic pulsing)
        const sizeBase = 1.0 + (breathing * 0.5); // 1.0-1.5 base size
        const sizePulse = 1.0 + (breathing * breathingPhase * 0.8); // 1.0-1.8 pulse range
        const originalRadius = config.SPLAT_RADIUS;
        config.SPLAT_RADIUS *= sizeBase * sizePulse;
        
        splat(x, y, dx, dy, color);
        
        // Restore original radius
        config.SPLAT_RADIUS = originalRadius;
    }
}

function generateOrganicColor(colorLife) {
    const time = Date.now() * 0.001;
    
    // COLOR LIFE: Intuitive 0-1 range (0 = static color, 1 = full rainbow evolution)
    const colorfulOverride = config.COLORFUL;
    const dynamicColorStrength = Math.max(colorLife, colorfulOverride ? 1.0 : 0);
    
    if (dynamicColorStrength > 0.1) {
        // Dynamic rainbow colors - strength based on Color Life value
        const evolutionSpeed = dynamicColorStrength * 0.2; // 0-0.2 evolution speed
        const hueShift = dynamicColorStrength * Math.sin(time * 0.15) * 0.4; // Hue variation
        const baseHue = (time * evolutionSpeed) % 1.0;
        const finalHue = (baseHue + hueShift + 1) % 1.0;
        
        // Color Life affects saturation and brightness variation
        const saturation = 0.7 + (dynamicColorStrength * 0.3); // 0.7-1.0 saturation
        const brightness = 0.8 + Math.sin(time * 0.3) * dynamicColorStrength * 0.2; // Brightness pulse
        
        let c = HSVtoRGB(finalHue, saturation, brightness);
        c.r *= 10.0; // Match Ctrl+B intensity
        c.g *= 10.0;
        c.b *= 10.0;
        return c;
    } else {
        // Static color with subtle Color Life variations
        const pulsation = Math.sin(time * 0.4) * colorLife * 0.3; // Gentle pulsing
        const baseIntensity = 1.0 + pulsation; // 0.7-1.3 intensity range
        const ctrlBMultiplier = 10.0; // Match Ctrl+B intensity
        
        return {
            r: config.STATIC_COLOR.r * baseIntensity * ctrlBMultiplier,
            g: config.STATIC_COLOR.g * baseIntensity * ctrlBMultiplier,
            b: config.STATIC_COLOR.b * baseIntensity * ctrlBMultiplier
        };
    }
}

function initializeIdleAnimation() {
    // Start the idle animation system
    resetActivityTimer();
    
    // Only track canvas interactions to reset idle timer
    // UI interactions (sliders, buttons) won't stop the animation
    canvas.addEventListener('mousedown', resetActivityTimer, { passive: true });
    canvas.addEventListener('mousemove', resetActivityTimer, { passive: true });
    canvas.addEventListener('touchstart', resetActivityTimer, { passive: true });
    canvas.addEventListener('touchmove', resetActivityTimer, { passive: true });
    
    // Start animation immediately if ANIMATE toggle is on
    if (config.ANIMATE) {
        startIdleAnimation();
    } else {
        // Otherwise wait for idle timeout
        scheduleIdleAnimation();
    }
}

function HSVtoRGB (h, s, v) {
    let r, g, b, i, f, p, q, t;
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);

    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }

    return {
        r,
        g,
        b
    };
}

// Color conversion utilities
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
    } : null;
}

function rgbToHex(r, g, b) {
    const toHex = (c) => {
        const hex = Math.round(c * 255).toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    };
    return "#" + toHex(r) + toHex(g) + toHex(b);
}

// Color picker event handlers
function updateStaticColor(hexColor) {
    const rgb = hexToRgb(hexColor);
    if (rgb) {
        config.STATIC_COLOR = rgb;
        saveConfig();
    }
}

function updateBackgroundColor(hexColor) {
    const rgb = hexToRgb(hexColor);
    if (rgb) {
        config.BACK_COLOR = rgb;
        saveConfig();
    }
}

function normalizeColor (input) {
    let output = {
        r: input.r / 255,
        g: input.g / 255,
        b: input.b / 255
    };
    return output;
}

function wrap (value, min, max) {
    let range = max - min;
    if (range == 0) return min;
    return (value - min) % range + min;
}

function getResolution (resolution) {
    let aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
    if (aspectRatio < 1)
        aspectRatio = 1.0 / aspectRatio;

    let min = Math.round(resolution);
    let max = Math.round(resolution * aspectRatio);

    if (gl.drawingBufferWidth > gl.drawingBufferHeight)
        return { width: max, height: min };
    else
        return { width: min, height: max };
}

function getTextureScale (texture, width, height) {
    return {
        x: width / texture.width,
        y: height / texture.height
    };
}

function scaleByPixelRatio (input) {
    let pixelRatio = window.devicePixelRatio || 1;
    return Math.floor(input * pixelRatio);
}

function hashCode (s) {
    if (s.length == 0) return 0;
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
        hash = (hash << 5) - hash + s.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};
