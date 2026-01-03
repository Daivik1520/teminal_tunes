/**
 * Video Renderer - 4K Canvas-based Video Export
 * Uses MediaRecorder API for WebM video capture
 * FAST rendering with direct canvas stream
 */

class VideoRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.isRendering = false;
        this.isPreviewing = false;
        this.currentFrame = 0;
        this.totalFrames = 0;
        this.fps = 30;
        this.animationFrameId = null;
        this.previewSpeed = 1;

        // Rendering state
        this.lyrics = [];
        this.currentLyricIndex = 0;
        this.charIndex = 0;
        this.frameInLyric = 0;

        // Karaoke mode
        this.karaokeMode = false;
        this.karaokeWordIndex = 0;

        // Style settings
        this.styles = {
            fontFamily: "'Poppins', sans-serif",
            fontSize: 48,
            textColor: '#ffffff',
            glow: 'none',
            shadow: 'none',
            animation: 'typewriter',
            charDelay: 80,
            alignment: 'middle-center', // top/middle/bottom - left/center/right
            position: { x: 50, y: 50 } // percentage 0-100
        };

        // Background settings
        this.background = {
            type: 'solid', // 'image', 'gradient', 'solid'
            image: null,
            gradient: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
            solidColor: '#1a1a2e',
            blur: 0,
            overlay: 40
        };

        // Resolution settings
        this.resolutions = {
            '4k': { width: 3840, height: 2160 },
            '1080p': { width: 1920, height: 1080 },
            '720p': { width: 1280, height: 720 }
        };

        // Aspect ratio settings
        this.aspectRatio = '16:9';
        this.aspectRatios = {
            '16:9': { width: 3840, height: 2160 },
            '9:16': { width: 2160, height: 3840 },
            '1:1': { width: 2160, height: 2160 },
            '4:5': { width: 2160, height: 2700 }
        };

        // Base resolution for scaling calculations
        this.baseWidth = 3840;
        this.baseHeight = 2160;
    }

    /**
     * Set lyrics data
     */
    setLyrics(lyrics) {
        this.lyrics = lyrics.map(l => ({
            text: l.text,
            duration: l.duration || 2,
            charDelay: l.charDelay || this.styles.charDelay
        }));
        this.calculateTotalFrames();
    }

    /**
     * Set text styles
     */
    setStyles(styles) {
        this.styles = { ...this.styles, ...styles };
    }

    /**
     * Set background settings
     */
    setBackground(background) {
        this.background = { ...this.background, ...background };
    }

    /**
     * Set aspect ratio and update canvas dimensions
     */
    setAspectRatio(ratio, dimensions) {
        this.aspectRatio = ratio;
        if (dimensions) {
            this.baseWidth = dimensions.width;
            this.baseHeight = dimensions.height;
        }
    }

    /**
     * Set karaoke mode
     */
    setKaraokeMode(enabled) {
        this.karaokeMode = enabled;
    }

    /**
     * Get text position based on settings
     */
    getTextPosition(textWidth, textHeight) {
        const { width, height } = this.canvas;

        // Use explicit position if available (percentages)
        if (this.styles.position) {
            return {
                x: (this.styles.position.x / 100) * width,
                y: (this.styles.position.y / 100) * height
            };
        }

        // Fallback to legacy alignment
        const padding = Math.min(width, height) * 0.1;
        const alignment = this.styles.alignment || 'middle-center';
        const [vertical, horizontal] = alignment.split('-');

        let x, y;

        // Horizontal position
        switch (horizontal) {
            case 'left':
                x = padding + textWidth / 2;
                break;
            case 'right':
                x = width - padding - textWidth / 2;
                break;
            case 'center':
            default:
                x = width / 2;
        }

        // Vertical position
        switch (vertical) {
            case 'top':
                y = padding + textHeight / 2;
                break;
            case 'bottom':
                y = height - padding - textHeight / 2;
                break;
            case 'middle':
            default:
                y = height / 2;
        }

        return { x, y };
    }

    /**
     * Load background image
     */
    loadBackgroundImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    this.background.image = img;
                    this.background.type = 'image';
                    resolve(img);
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * Calculate total frames based on lyrics
     */
    calculateTotalFrames() {
        let totalDuration = 0;
        this.lyrics.forEach(lyric => {
            totalDuration += lyric.duration;
        });
        this.totalFrames = Math.ceil(totalDuration * this.fps);
        return totalDuration;
    }

    /**
     * Get total duration in seconds
     */
    getTotalDuration() {
        return this.lyrics.reduce((sum, l) => sum + l.duration, 0);
    }

    /**
     * Draw background on canvas
     */
    drawBackground(time = 0) {
        const { width, height } = this.canvas;
        const ctx = this.ctx;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        if (this.background.type === 'image' && this.background.image) {
            // Draw image with cover fit
            const img = this.background.image;
            const scale = Math.max(width / img.width, height / img.height);
            const x = (width - img.width * scale) / 2;
            const y = (height - img.height * scale) / 2;

            // Apply blur if needed (via filter)
            if (this.background.blur > 0) {
                ctx.filter = `blur(${this.background.blur}px)`;
            }

            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
            ctx.filter = 'none';

        } else if (this.background.type === 'gradient') {
            // Parse gradient and draw
            this.drawGradient(this.background.gradient, time);

        } else {
            // Solid color
            ctx.fillStyle = this.background.solidColor;
            ctx.fillRect(0, 0, width, height);
        }

        // Draw overlay
        if (this.background.overlay > 0) {
            ctx.fillStyle = `rgba(0, 0, 0, ${this.background.overlay / 100})`;
            ctx.fillRect(0, 0, width, height);
        }
    }

    /**
     * Draw gradient background
     */
    drawGradient(gradientStr, time = 0) {
        const { width, height } = this.canvas;
        const ctx = this.ctx;

        // Parse colors
        const colorMatch = gradientStr.match(/#[a-fA-F0-9]{6}|rgba?\([^)]+\)/g);

        if (colorMatch && colorMatch.length >= 2) {
            // Calculate angle
            let angle = 135; // Default
            const angleMatch = gradientStr.match(/(\d+)deg/);
            if (angleMatch) {
                angle = parseInt(angleMatch[1]);
            }

            // Apply animation if enabled
            if (this.background.animated) {
                // Rotate angle based on time and speed
                // speed 1 = 30 degrees per second
                const rotationSpeed = (this.background.animationSpeed || 1) * 30;
                angle = (angle + time * rotationSpeed) % 360;
            }

            // Convert angle to coordinates
            const rad = (angle * Math.PI) / 180;
            const length = Math.sqrt(width * width + height * height);

            // Calculate start and end points relative to center
            const cx = width / 2;
            const cy = height / 2;

            const x1 = cx - Math.cos(rad) * length / 2;
            const y1 = cy - Math.sin(rad) * length / 2;
            const x2 = cx + Math.cos(rad) * length / 2;
            const y2 = cy + Math.sin(rad) * length / 2;

            const gradient = ctx.createLinearGradient(x1, y1, x2, y2);

            // Distribute stops evenly
            colorMatch.forEach((color, index) => {
                gradient.addColorStop(index / (colorMatch.length - 1), color);
            });

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
        } else {
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(0, 0, width, height);
        }
    }

    /**
     * Apply text effects with scale factor
     */
    applyTextEffects(scaleFactor = 1) {
        const ctx = this.ctx;
        const color = this.styles.textColor;

        // Reset
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        let glowApplied = false;

        // Apply glow (scaled)
        if (this.styles.glow && this.styles.glow !== 'none') {
            glowApplied = true;
            switch (this.styles.glow) {
                case 'soft':
                    ctx.shadowBlur = 20 * scaleFactor;
                    ctx.shadowColor = color;
                    break;
                case 'intense':
                    ctx.shadowBlur = 40 * scaleFactor;
                    ctx.shadowColor = color;
                    break;
                case 'neon':
                    ctx.shadowBlur = 60 * scaleFactor;
                    ctx.shadowColor = this.styles.textColor;
                    break;
            }
        }

        // Apply shadow (scaled) - only if no glow is applied to avoid conflict
        if (!glowApplied && this.styles.shadow && this.styles.shadow !== 'none') {
            switch (this.styles.shadow) {
                case 'light':
                    ctx.shadowOffsetX = 2 * scaleFactor;
                    ctx.shadowOffsetY = 2 * scaleFactor;
                    ctx.shadowBlur = 4 * scaleFactor;
                    ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
                    break;
                case 'dark':
                    ctx.shadowOffsetX = 4 * scaleFactor;
                    ctx.shadowOffsetY = 4 * scaleFactor;
                    ctx.shadowBlur = 8 * scaleFactor;
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                    break;
                case '3d':
                    ctx.shadowOffsetX = 6 * scaleFactor;
                    ctx.shadowOffsetY = 6 * scaleFactor;
                    ctx.shadowBlur = 0;
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
                    break;
            }
        }
    }

    /**
     * Calculate scaled font size for current canvas
     */
    getScaledFontSize() {
        // Scale font based on canvas width relative to base width
        const scaleFactor = this.canvas.width / this.baseWidth;
        return Math.round(this.styles.fontSize * scaleFactor);
    }

    /**
     * Get scale factor for current canvas
     */
    getScaleFactor() {
        return this.canvas.width / this.baseWidth;
    }

    /**
     * Word wrap text to fit within canvas width
     */
    wrapText(text, maxWidth) {
        const ctx = this.ctx;
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }

        if (currentLine) {
            lines.push(currentLine);
        }

        return lines.length > 0 ? lines : [text];
    }

    /**
     * Draw text with animation - FIXED for proper scaling and alignment
     */
    drawText(text, progress, animationType) {
        const ctx = this.ctx;
        const { width, height } = this.canvas;

        // Calculate scaled font size
        const scaledFontSize = this.getScaledFontSize();
        const scaleFactor = this.getScaleFactor();

        // Set font with scaled size
        ctx.font = `${scaledFontSize}px ${this.styles.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = this.styles.textColor;

        // Apply effects with scale factor
        this.applyTextEffects(scaleFactor);

        // Calculate max width for text (80% of canvas width)
        const maxWidth = width * 0.8;

        // Get text metrics for positioning
        const textWidth = ctx.measureText(text).width;
        const textHeight = scaledFontSize;

        // Get position based on alignment
        const { x: centerX, y: centerY } = this.getTextPosition(Math.min(textWidth, maxWidth), textHeight);

        if (textWidth > maxWidth) {
            // Word wrap and draw multi-line
            this.drawWrappedText(text, progress, animationType, centerX, centerY, maxWidth, scaledFontSize);
        } else {
            // Single line - check karaoke mode
            if (this.karaokeMode && animationType === 'typewriter') {
                this.drawKaraokeText(text, progress, centerX, centerY, scaledFontSize);
            } else {
                switch (animationType) {
                    case 'typewriter':
                        this.drawTypewriter(text, progress, centerX, centerY, scaledFontSize);
                        break;
                    case 'fadeIn':
                        this.drawFadeIn(text, progress, centerX, centerY);
                        break;
                    case 'slideUp':
                        this.drawSlideUp(text, progress, centerX, centerY, scaledFontSize);
                        break;
                    case 'bounce':
                        this.drawBounce(text, progress, centerX, centerY, scaledFontSize);
                        break;
                    case 'glow':
                        this.drawGlowPulse(text, progress, centerX, centerY);
                        break;
                    case 'none':
                    default:
                        ctx.fillText(text, centerX, centerY);
                }
            }
        }
    }

    /**
     * Draw karaoke-style text with word highlighting
     */
    drawKaraokeText(text, progress, x, y, fontSize) {
        const ctx = this.ctx;
        const words = text.split(' ');
        const totalChars = text.length;
        const currentCharIndex = Math.floor(totalChars * progress);

        // Calculate total width to center properly
        const totalWidth = ctx.measureText(text).width;
        let startX = x - totalWidth / 2;

        let charCount = 0;

        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const wordWidth = ctx.measureText(word).width;
            const wordEndChar = charCount + word.length;

            // Check if this word is highlighted (karaoke effect)
            if (currentCharIndex >= charCount && currentCharIndex < wordEndChar) {
                // Highlighted word - use accent color with glow
                ctx.fillStyle = '#8B5CF6';
                ctx.shadowBlur = fontSize * 0.5;
                ctx.shadowColor = '#8B5CF6';
            } else if (currentCharIndex >= wordEndChar) {
                // Already sung - normal color
                ctx.fillStyle = this.styles.textColor;
                ctx.shadowBlur = 0;
            } else {
                // Not yet sung - dimmed
                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.shadowBlur = 0;
            }

            ctx.textAlign = 'left';
            ctx.fillText(word, startX, y);
            startX += wordWidth + ctx.measureText(' ').width;
            charCount += word.length + 1; // +1 for space
        }

        // Reset
        ctx.textAlign = 'center';
        ctx.fillStyle = this.styles.textColor;
    }

    /**
     * Draw wrapped text with animation
     */
    drawWrappedText(text, progress, animationType, centerX, centerY, maxWidth, fontSize) {
        const ctx = this.ctx;
        const lines = this.wrapText(text, maxWidth);
        const lineHeight = fontSize * 1.3;
        const totalHeight = lines.length * lineHeight;
        const startY = centerY - totalHeight / 2 + lineHeight / 2;

        switch (animationType) {
            case 'typewriter':
                // Calculate total characters and current position
                const totalChars = text.length;
                const charsToShow = Math.floor(totalChars * progress);
                let charCount = 0;

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    const lineChars = line.length;
                    const y = startY + i * lineHeight;

                    if (charCount + lineChars <= charsToShow) {
                        // Full line
                        ctx.fillText(line, centerX, y);
                        charCount += lineChars + 1; // +1 for space
                    } else if (charCount < charsToShow) {
                        // Partial line
                        const partialChars = charsToShow - charCount;
                        ctx.fillText(line.substring(0, partialChars), centerX, y);
                        break;
                    }
                }
                break;

            case 'fadeIn':
                const opacity = Math.min(1, progress * 2);
                ctx.globalAlpha = opacity;
                for (let i = 0; i < lines.length; i++) {
                    ctx.fillText(lines[i], centerX, startY + i * lineHeight);
                }
                ctx.globalAlpha = 1;
                break;

            case 'slideUp':
                const offset = (1 - Math.min(1, progress * 3)) * (fontSize * 2);
                const slideOpacity = Math.min(1, progress * 3);
                ctx.globalAlpha = slideOpacity;
                for (let i = 0; i < lines.length; i++) {
                    ctx.fillText(lines[i], centerX, startY + i * lineHeight + offset);
                }
                ctx.globalAlpha = 1;
                break;

            default:
                for (let i = 0; i < lines.length; i++) {
                    ctx.fillText(lines[i], centerX, startY + i * lineHeight);
                }
        }
    }

    /**
     * Typewriter animation
     */
    drawTypewriter(text, progress, x, y, fontSize) {
        const chars = Math.floor(text.length * progress);
        const displayText = text.substring(0, chars);
        this.ctx.fillText(displayText, x, y);

        // Draw cursor
        if (progress < 1) {
            const textWidth = this.ctx.measureText(displayText).width;
            const cursorX = x + textWidth / 2 + 5;
            const cursorWidth = Math.max(3, fontSize * 0.05);
            if (Math.floor(Date.now() / 500) % 2 === 0) {
                this.ctx.fillRect(cursorX, y - fontSize / 2, cursorWidth, fontSize);
            }
        }
    }

    /**
     * Fade in animation
     */
    drawFadeIn(text, progress, x, y) {
        const ctx = this.ctx;
        const opacity = Math.min(1, progress * 2); // Fade in during first half
        ctx.globalAlpha = opacity;
        ctx.fillText(text, x, y);
        ctx.globalAlpha = 1;
    }

    /**
     * Slide up animation
     */
    drawSlideUp(text, progress, x, y, fontSize) {
        const ctx = this.ctx;
        const offset = (1 - Math.min(1, progress * 3)) * (fontSize * 2);
        const opacity = Math.min(1, progress * 3);
        ctx.globalAlpha = opacity;
        ctx.fillText(text, x, y + offset);
        ctx.globalAlpha = 1;
    }

    /**
     * Bounce animation
     */
    drawBounce(text, progress, x, y, fontSize) {
        const ctx = this.ctx;
        let bounce = 0;
        const bounceScale = fontSize * 1.5;

        if (progress < 0.3) {
            // Initial drop
            bounce = -Math.sin(progress / 0.3 * Math.PI) * bounceScale;
        } else if (progress < 0.5) {
            // First bounce
            bounce = Math.sin((progress - 0.3) / 0.2 * Math.PI) * (bounceScale * 0.4);
        } else if (progress < 0.65) {
            // Second bounce
            bounce = -Math.sin((progress - 0.5) / 0.15 * Math.PI) * (bounceScale * 0.2);
        }

        ctx.fillText(text, x, y + bounce);
    }

    /**
     * Glow pulse animation
     */
    drawGlowPulse(text, progress, x, y) {
        const ctx = this.ctx;
        const scaleFactor = this.getScaleFactor();
        const pulse = Math.sin(progress * Math.PI * 4) * 0.5 + 0.5;
        ctx.shadowBlur = (20 + pulse * 40) * scaleFactor;
        ctx.shadowColor = this.styles.textColor;
        ctx.fillText(text, x, y);
    }

    /**
     * Render a single frame at given time
     */
    renderFrame(time) {
        // Draw background
        this.drawBackground();

        // Find which lyric should be displayed at this time
        let accumulatedTime = 0;
        let currentLyric = null;
        let lyricProgress = 0;

        for (let i = 0; i < this.lyrics.length; i++) {
            const lyric = this.lyrics[i];
            const lyricEnd = accumulatedTime + lyric.duration;

            if (time >= accumulatedTime && time < lyricEnd) {
                currentLyric = lyric;
                lyricProgress = (time - accumulatedTime) / lyric.duration;
                this.currentLyricIndex = i;
                break;
            }

            accumulatedTime = lyricEnd;
        }

        // Draw current lyric
        if (currentLyric) {
            this.drawText(currentLyric.text, lyricProgress, this.styles.animation);
        }

        return currentLyric;
    }

    /**
     * Preview animation with speed control
     */
    startPreview(onFrame, onComplete, speed = 1) {
        if (this.isPreviewing) return;

        this.isPreviewing = true;
        this.previewSpeed = speed;
        const totalDuration = this.getTotalDuration();
        const startTime = performance.now();

        const animate = () => {
            if (!this.isPreviewing) return;

            const elapsed = ((performance.now() - startTime) / 1000) * this.previewSpeed;
            const progress = elapsed / totalDuration;

            if (elapsed >= totalDuration) {
                this.isPreviewing = false;
                this.renderFrame(totalDuration);
                if (onComplete) onComplete();
                return;
            }

            const currentLyric = this.renderFrame(elapsed);
            if (onFrame) onFrame(elapsed, totalDuration, currentLyric, this.currentLyricIndex);

            this.animationFrameId = requestAnimationFrame(animate);
        };

        animate();
    }

    /**
     * Stop preview
     */
    stopPreview() {
        this.isPreviewing = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    /**
     * Seek to specific time
     */
    seekTo(time) {
        this.renderFrame(time);
    }

    /**
     * Export video - FAST direct stream approach
     */
    async exportVideo(quality = '4k', fps = 30, onProgress) {
        if (this.isRendering) return null;

        this.isRendering = true;
        this.fps = fps;

        // Base short-edge sizes for qualities
        const qualitySizes = {
            '4k': 2160,
            '1080p': 1080,
            '720p': 720
        };

        const shortEdge = qualitySizes[quality] || 1080;

        // Calculate dimensions based on aspect ratio
        let width, height;
        const [wRatio, hRatio] = this.aspectRatio.split(':').map(Number);
        const ratio = wRatio / hRatio;

        if (ratio >= 1) {
            // Landscape or Square
            height = shortEdge;
            width = Math.round(height * ratio);
        } else {
            // Portrait
            width = shortEdge;
            height = Math.round(width / ratio);
        }

        // Create offscreen canvas at target resolution
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = width;
        offscreenCanvas.height = height;

        // Store original canvas reference
        const originalCanvas = this.canvas;
        const originalCtx = this.ctx;

        // Switch to offscreen canvas
        this.canvas = offscreenCanvas;
        this.ctx = offscreenCanvas.getContext('2d');

        const totalDuration = this.getTotalDuration();

        try {
            // Use direct stream recording (MUCH FASTER)
            const videoBlob = await this.recordCanvasStream(offscreenCanvas, totalDuration, fps, onProgress);

            // Restore original canvas
            this.canvas = originalCanvas;
            this.ctx = originalCtx;

            this.isRendering = false;
            return videoBlob;
        } catch (error) {
            // Restore original canvas on error
            this.canvas = originalCanvas;
            this.ctx = originalCtx;
            this.isRendering = false;
            throw error;
        }
    }

    /**
     * Record canvas stream directly - FAST method
     */
    async recordCanvasStream(canvas, duration, fps, onProgress) {
        return new Promise((resolve, reject) => {
            // Create stream from canvas
            const stream = canvas.captureStream(fps);

            // Setup MediaRecorder with high quality settings
            const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
                ? 'video/webm;codecs=vp9'
                : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
                    ? 'video/webm;codecs=vp8'
                    : 'video/webm';

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType,
                videoBitsPerSecond: 8000000 // Reduced to 8 Mbps for stability (was 50 Mbps)
            });

            const chunks = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                resolve(blob);
            };

            mediaRecorder.onerror = (e) => {
                reject(e);
            };

            // Start recording
            mediaRecorder.start(100); // Collect data every 100ms

            // Animate frames at real speed
            const startTime = performance.now();
            const frameDuration = 1000 / fps;
            let lastFrameTime = startTime;
            let frameCount = 0;
            const totalFrames = Math.ceil(duration * fps);

            const renderLoop = () => {
                const now = performance.now();
                const elapsed = (now - startTime) / 1000;

                // Render current frame
                this.renderFrame(Math.min(elapsed, duration));
                frameCount++;

                // Update progress
                if (onProgress) {
                    const progress = Math.min(100, (elapsed / duration) * 100);
                    onProgress(progress);
                }

                // Check if done
                if (elapsed >= duration) {
                    // Render final frame
                    this.renderFrame(duration);

                    // Stop recording and finish
                    mediaRecorder.stop();
                    // Don't need to resolve here, onstop will resolve
                } else {
                    requestAnimationFrame(renderLoop);
                }
            };

            // Start rendering
            renderLoop();
        });
    }

    /**
     * Download video
     */
    downloadVideo(blob, filename = 'lyrical_video.webm') {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Make available globally
window.VideoRenderer = VideoRenderer;
