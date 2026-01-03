/**
 * Lyrical Video Generator - Main Application
 * Enhanced with drag-drop, undo/redo, auto-save, keyboard shortcuts, and more
 */

// ============================================
// Undo/Redo Manager
// ============================================
class UndoRedoManager {
    constructor(maxHistory = 50) {
        this.history = [];
        this.currentIndex = -1;
        this.maxHistory = maxHistory;
    }

    push(state) {
        // Remove any states after current index
        this.history = this.history.slice(0, this.currentIndex + 1);

        // Add new state
        this.history.push(JSON.stringify(state));
        this.currentIndex++;

        // Limit history size
        if (this.history.length > this.maxHistory) {
            this.history.shift();
            this.currentIndex--;
        }
    }

    undo() {
        if (this.canUndo()) {
            this.currentIndex--;
            return JSON.parse(this.history[this.currentIndex]);
        }
        return null;
    }

    redo() {
        if (this.canRedo()) {
            this.currentIndex++;
            return JSON.parse(this.history[this.currentIndex]);
        }
        return null;
    }

    canUndo() {
        return this.currentIndex > 0;
    }

    canRedo() {
        return this.currentIndex < this.history.length - 1;
    }

    clear() {
        this.history = [];
        this.currentIndex = -1;
    }
}

// ============================================
// Template Presets
// ============================================
const TEMPLATES = {
    'neon-glow': {
        fontFamily: "'Bebas Neue', cursive",
        fontSize: 72,
        textColor: '#00ffff',
        glow: 'neon',
        shadow: 'none',
        animation: 'typewriter',
        charDelay: 60
    },
    'clean-minimal': {
        fontFamily: "'Inter', sans-serif",
        fontSize: 48,
        textColor: '#ffffff',
        glow: 'none',
        shadow: 'light',
        animation: 'fadeIn',
        charDelay: 80
    },
    'bold-impact': {
        fontFamily: "'Bebas Neue', cursive",
        fontSize: 96,
        textColor: '#ff4444',
        glow: 'intense',
        shadow: '3d',
        animation: 'bounce',
        charDelay: 50
    },
    'retro-vibes': {
        fontFamily: "'Playfair Display', serif",
        fontSize: 56,
        textColor: '#f59e0b',
        glow: 'soft',
        shadow: 'dark',
        animation: 'slideUp',
        charDelay: 100
    }
};

// ============================================
// Aspect Ratio Configurations
// ============================================
const ASPECT_RATIOS = {
    '16:9': { width: 3840, height: 2160 },
    '9:16': { width: 2160, height: 3840 },
    '1:1': { width: 2160, height: 2160 },
    '4:5': { width: 2160, height: 2700 }
};

// ============================================
// Main Application Class
// ============================================
class LyricalVideoApp {
    constructor() {
        // Initialize elements
        this.initElements();

        // Initialize video renderer
        this.renderer = new VideoRenderer(this.canvas);

        // State
        this.lyrics = [];
        this.isPlaying = false;
        this.currentTime = 0;
        this.currentLineIndex = -1;
        this.previewSpeed = 1;
        this.karaokeMode = false;
        this.karaokeMode = false;
        // Text position state in percentages
        this.textPosition = { x: 50, y: 50 };
        this.aspectRatio = '16:9';

        // Initialize undo/redo manager
        this.undoManager = new UndoRedoManager();

        // Drag state
        this.draggedElement = null;
        this.draggedIndex = null;

        // Audio
        this.audioFile = null;

        // Auto-save timer
        this.autoSaveTimer = null;

        // Initialize
        this.initEventListeners();
        this.initKeyboardShortcuts();
        this.loadFromLocalStorage();
        this.updatePreview();
        this.startAutoSave();
    }

    // ============================================
    // Initialize DOM elements
    // ============================================
    initElements() {
        // Theme
        this.themeToggle = document.getElementById('themeToggle');

        // Undo/Redo
        this.undoBtn = document.getElementById('undoBtn');
        this.redoBtn = document.getElementById('redoBtn');

        // Project Import/Export
        this.importProjectBtn = document.getElementById('importProjectBtn');
        this.exportProjectBtn = document.getElementById('exportProjectBtn');
        this.projectFileInput = document.getElementById('projectFileInput');
        this.helpBtn = document.getElementById('helpBtn');

        // Lyrics
        this.lyricsContainer = document.getElementById('lyricsContainer');
        this.addLineBtn = document.getElementById('addLineBtn');
        this.pasteBtn = document.getElementById('pasteBtn');
        this.clearAllBtn = document.getElementById('clearAllBtn');
        this.bulkImportBtn = document.getElementById('bulkImportBtn');
        this.bulkImportModal = document.getElementById('bulkImportModal');
        this.closeBulkImport = document.getElementById('closeBulkImport');
        this.bulkLyricsInput = document.getElementById('bulkLyricsInput');
        this.defaultDelay = document.getElementById('defaultDelay');
        this.importLyricsBtn = document.getElementById('importLyricsBtn');

        // Text styling
        this.fontFamily = document.getElementById('fontFamily');
        this.fontSize = document.getElementById('fontSize');
        this.fontSizeValue = document.getElementById('fontSizeValue');
        this.textColor = document.getElementById('textColor');
        this.textGlow = document.getElementById('textGlow');
        this.textShadow = document.getElementById('textShadow');
        this.textAnimation = document.getElementById('textAnimation');
        this.charDelay = document.getElementById('charDelay');
        this.charDelayValue = document.getElementById('charDelayValue');

        this.textPositionX = document.getElementById('textPositionX');
        this.textPositionXValue = document.getElementById('textPositionXValue');
        this.textPositionY = document.getElementById('textPositionY');
        this.textPositionYValue = document.getElementById('textPositionYValue');

        // Background
        this.bgTypeImage = document.getElementById('bgTypeImage');
        this.bgTypeGradient = document.getElementById('bgTypeGradient');
        this.bgTypeSolid = document.getElementById('bgTypeSolid');
        this.imageUploadSection = document.getElementById('imageUploadSection');
        this.gradientSection = document.getElementById('gradientSection');
        this.solidColorSection = document.getElementById('solidColorSection');
        this.bgImageInput = document.getElementById('bgImageInput');
        this.fileName = document.getElementById('fileName');
        this.bgSolidColor = document.getElementById('bgSolidColor');
        this.bgBlur = document.getElementById('bgBlur');
        this.bgBlurValue = document.getElementById('bgBlurValue');
        this.bgOverlay = document.getElementById('bgOverlay');
        this.bgOverlayValue = document.getElementById('bgOverlayValue');

        // Gradient Animation
        this.gradientAnimation = document.getElementById('gradientAnimation');
        this.gradientSpeedControl = document.getElementById('gradientSpeedControl');
        this.gradientSpeed = document.getElementById('gradientSpeed');

        // Preview
        this.canvas = document.getElementById('previewCanvas');
        this.canvasWrapper = document.getElementById('canvasWrapper');
        this.canvasOverlay = document.getElementById('canvasOverlay');
        this.playBtn = document.getElementById('playBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.timeline = document.getElementById('timeline');
        this.currentTimeDisplay = document.getElementById('currentTime');
        this.totalTimeDisplay = document.getElementById('totalTime');
        this.currentLyricText = document.getElementById('currentLyricText');

        // Preview options
        this.aspectRatioSelect = document.getElementById('aspectRatio');
        this.resolutionDisplay = document.getElementById('resolutionDisplay');
        this.previewSpeedSelect = document.getElementById('previewSpeed');
        this.karaokeToggle = document.getElementById('karaokeToggle');



        // Export
        this.exportQuality = document.getElementById('exportQuality');
        this.exportFps = document.getElementById('exportFps');
        this.exportBtn = document.getElementById('exportBtn');
        this.exportProgress = document.getElementById('exportProgress');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');

        // Modals
        this.confirmModal = document.getElementById('confirmModal');
        this.confirmMessage = document.getElementById('confirmMessage');
        this.confirmOk = document.getElementById('confirmOk');
        this.confirmCancel = document.getElementById('confirmCancel');
        this.closeConfirmModal = document.getElementById('closeConfirmModal');
        this.helpModal = document.getElementById('helpModal');
        this.closeHelpModal = document.getElementById('closeHelpModal');

        // Auto-save indicator
        this.autoSaveIndicator = document.getElementById('autoSaveIndicator');
    }

    // ============================================
    // Initialize event listeners
    // ============================================
    initEventListeners() {
        // Theme toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());

        // Undo/Redo
        this.undoBtn.addEventListener('click', () => this.undo());
        this.redoBtn.addEventListener('click', () => this.redo());

        // Project Import/Export
        this.importProjectBtn.addEventListener('click', () => this.projectFileInput.click());
        this.projectFileInput.addEventListener('change', (e) => this.importProject(e));
        this.exportProjectBtn.addEventListener('click', () => this.exportProject());
        this.helpBtn.addEventListener('click', () => this.showHelpModal());

        // Lyrics management
        this.addLineBtn.addEventListener('click', () => this.addLyricLine());
        this.pasteBtn.addEventListener('click', () => this.pasteFromClipboard());
        this.clearAllBtn.addEventListener('click', () => this.confirmClearAll());
        this.bulkImportBtn.addEventListener('click', () => this.showBulkImport());
        this.closeBulkImport.addEventListener('click', () => this.hideBulkImport());
        this.importLyricsBtn.addEventListener('click', () => this.importBulkLyrics());

        // Close modal on outside click
        this.bulkImportModal.addEventListener('click', (e) => {
            if (e.target === this.bulkImportModal) this.hideBulkImport();
        });

        // Text styling
        this.fontFamily.addEventListener('change', () => this.updateStyles());
        this.fontSize.addEventListener('input', () => {
            this.fontSizeValue.textContent = this.fontSize.value;
            this.updateStyles();
        });
        this.textColor.addEventListener('input', () => this.updateStyles());
        this.textGlow.addEventListener('change', () => this.updateStyles());
        this.textShadow.addEventListener('change', () => this.updateStyles());
        this.textAnimation.addEventListener('change', () => this.updateStyles());
        this.charDelay.addEventListener('input', () => {
            this.charDelayValue.textContent = this.charDelay.value;
            this.updateStyles();
        });

        // Color presets
        document.querySelectorAll('.color-preset').forEach(btn => {
            btn.addEventListener('click', () => {
                this.textColor.value = btn.dataset.color;
                this.updateStyles();
            });
        });

        // Text Position Sliders
        this.textPositionX.addEventListener('input', () => {
            this.textPosition.x = parseInt(this.textPositionX.value);
            this.textPositionXValue.textContent = this.textPosition.x;
            this.renderer.setStyles({ position: this.textPosition });
            this.updatePreview();
        });

        this.textPositionX.addEventListener('change', () => this.saveState());

        this.textPositionY.addEventListener('input', () => {
            this.textPosition.y = parseInt(this.textPositionY.value);
            this.textPositionYValue.textContent = this.textPosition.y;
            this.renderer.setStyles({ position: this.textPosition });
            this.updatePreview();
        });

        this.textPositionY.addEventListener('change', () => this.saveState());

        // Position Preset Buttons
        document.querySelectorAll('.position-preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.textPosition.x = parseInt(btn.dataset.x);
                this.textPosition.y = parseInt(btn.dataset.y);

                // Update UI
                this.textPositionX.value = this.textPosition.x;
                this.textPositionXValue.textContent = this.textPosition.x;
                this.textPositionY.value = this.textPosition.y;
                this.textPositionYValue.textContent = this.textPosition.y;

                // Update Renderer
                this.renderer.setStyles({ position: this.textPosition });
                this.updatePreview();
                this.saveState();
            });
        });

        // Template buttons
        document.querySelectorAll('.template-btn').forEach(btn => {
            btn.addEventListener('click', () => this.applyTemplate(btn.dataset.template));
        });

        // Background type
        this.bgTypeImage.addEventListener('click', () => this.setBgType('image'));
        this.bgTypeGradient.addEventListener('click', () => this.setBgType('gradient'));
        this.bgTypeSolid.addEventListener('click', () => this.setBgType('solid'));

        // Background image
        this.bgImageInput.addEventListener('change', (e) => this.handleImageUpload(e));

        // Gradient presets
        document.querySelectorAll('.gradient-preset').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.gradient-preset').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.renderer.setBackground({ gradient: btn.dataset.gradient });
                this.updatePreview();
                this.saveState();
            });
        });

        // Solid color
        this.bgSolidColor.addEventListener('input', () => {
            this.renderer.setBackground({ solidColor: this.bgSolidColor.value });
            this.updatePreview();
            this.saveState();
        });

        // Blur and overlay
        this.bgBlur.addEventListener('input', () => {
            this.bgBlurValue.textContent = this.bgBlur.value;
            this.renderer.setBackground({ blur: parseInt(this.bgBlur.value) });
            this.updatePreview();
        });

        this.bgOverlay.addEventListener('input', () => {
            this.bgOverlayValue.textContent = this.bgOverlay.value;
            this.renderer.setBackground({ overlay: parseInt(this.bgOverlay.value) });
            this.updatePreview();
        });

        // Gradient Animation
        this.gradientAnimation.addEventListener('change', () => {
            const isAnimated = this.gradientAnimation.checked;
            this.renderer.setBackground({ animated: isAnimated });

            // Toggle visibility of speed control
            if (isAnimated) {
                this.gradientSpeedControl.classList.remove('hidden');
            } else {
                this.gradientSpeedControl.classList.add('hidden');
            }

            this.updatePreview();
            this.saveState();
        });

        this.gradientSpeed.addEventListener('input', () => {
            this.renderer.setBackground({ animationSpeed: parseFloat(this.gradientSpeed.value) });
            // For immediate feedback, we might want to trigger a frame, but animation only happens on play
            // unless we add an idle loop.
            this.saveState();
        });

        // Aspect ratio
        this.aspectRatioSelect.addEventListener('change', () => this.changeAspectRatio());

        // Preview speed
        this.previewSpeedSelect.addEventListener('change', () => {
            this.previewSpeed = parseFloat(this.previewSpeedSelect.value);
        });

        // Karaoke toggle
        this.karaokeToggle.addEventListener('click', () => this.toggleKaraokeMode());



        // Preview controls
        this.playBtn.addEventListener('click', () => this.togglePlay());
        this.stopBtn.addEventListener('click', () => this.stop());
        this.timeline.addEventListener('input', () => this.seekTo(this.timeline.value));

        // Export
        this.exportBtn.addEventListener('click', () => this.exportVideo());

        // Confirmation modal
        this.closeConfirmModal.addEventListener('click', () => this.hideConfirmModal());
        this.confirmCancel.addEventListener('click', () => this.hideConfirmModal());
        this.confirmModal.addEventListener('click', (e) => {
            if (e.target === this.confirmModal) this.hideConfirmModal();
        });

        // Help modal
        this.closeHelpModal.addEventListener('click', () => this.hideHelpModal());
        this.helpModal.addEventListener('click', (e) => {
            if (e.target === this.helpModal) this.hideHelpModal();
        });

        // Tab switching for tools panel
        document.querySelectorAll('.tool-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active from all tabs and panes
                document.querySelectorAll('.tool-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tool-pane').forEach(p => p.classList.remove('active'));

                // Add active to clicked tab and corresponding pane
                tab.classList.add('active');
                const paneId = `${tab.dataset.tab}-pane`;
                const pane = document.getElementById(paneId);
                if (pane) pane.classList.add('active');
            });
        });
    }

    // ============================================
    // Keyboard Shortcuts
    // ============================================
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Don't trigger shortcuts when typing in inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

            // Space - Play/Pause
            if (e.code === 'Space') {
                e.preventDefault();
                this.togglePlay();
            }
            // Escape - Stop
            else if (e.code === 'Escape') {
                this.stop();
                this.hideAllModals();
            }
            // Ctrl+Z - Undo
            else if (ctrlKey && !e.shiftKey && e.code === 'KeyZ') {
                e.preventDefault();
                this.undo();
            }
            // Ctrl+Y or Ctrl+Shift+Z - Redo
            else if ((ctrlKey && e.code === 'KeyY') || (ctrlKey && e.shiftKey && e.code === 'KeyZ')) {
                e.preventDefault();
                this.redo();
            }
            // Ctrl+S - Save
            else if (ctrlKey && !e.shiftKey && e.code === 'KeyS') {
                e.preventDefault();
                this.saveToLocalStorage();
                this.showAutoSaveIndicator();
            }
            // Ctrl+Shift+S - Export Project
            else if (ctrlKey && e.shiftKey && e.code === 'KeyS') {
                e.preventDefault();
                this.exportProject();
            }
            // Ctrl+O - Import Project
            else if (ctrlKey && e.code === 'KeyO') {
                e.preventDefault();
                this.projectFileInput.click();
            }
            // Ctrl+N - New Line
            else if (ctrlKey && e.code === 'KeyN') {
                e.preventDefault();
                this.addLyricLine();
            }
            // ? - Show Help
            else if (e.code === 'Slash' && e.shiftKey) {
                e.preventDefault();
                this.showHelpModal();
            }
        });
    }

    // ============================================
    // Theme
    // ============================================
    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('lyrical-theme', next);
    }

    // ============================================
    // Undo/Redo
    // ============================================
    saveState() {
        const state = this.getProjectState();
        this.undoManager.push(state);
        this.updateUndoRedoButtons();
    }

    undo() {
        const state = this.undoManager.undo();
        if (state) {
            this.applyProjectState(state, false);
            this.updateUndoRedoButtons();
        }
    }

    redo() {
        const state = this.undoManager.redo();
        if (state) {
            this.applyProjectState(state, false);
            this.updateUndoRedoButtons();
        }
    }

    updateUndoRedoButtons() {
        this.undoBtn.disabled = !this.undoManager.canUndo();
        this.redoBtn.disabled = !this.undoManager.canRedo();
    }

    // ============================================
    // Project State Management
    // ============================================
    getProjectState() {
        return {
            lyrics: this.lyrics,
            styles: {
                fontFamily: this.fontFamily.value,
                fontSize: parseInt(this.fontSize.value),
                textColor: this.textColor.value,
                glow: this.textGlow.value,
                shadow: this.textShadow.value,
                animation: this.textAnimation.value,
                charDelay: parseInt(this.charDelay.value),
                charDelay: parseInt(this.charDelay.value),
                position: this.textPosition
            },
            background: {
                type: this.bgTypeImage.classList.contains('active') ? 'image' :
                    this.bgTypeGradient.classList.contains('active') ? 'gradient' : 'solid',
                solidColor: this.bgSolidColor.value,
                blur: parseInt(this.bgBlur.value),
                overlay: parseInt(this.bgOverlay.value),
                animated: this.gradientAnimation.checked,
                animationSpeed: parseFloat(this.gradientSpeed.value)
            },
            aspectRatio: this.aspectRatio
        };
    }

    applyProjectState(state, saveHistory = true) {
        // Apply lyrics
        this.lyrics = state.lyrics || [];
        this.renderLyricsList();
        this.syncLyricsToRenderer();

        // Apply styles
        if (state.styles) {
            this.fontFamily.value = state.styles.fontFamily || "'Poppins', sans-serif";
            this.fontSize.value = state.styles.fontSize || 48;
            this.fontSizeValue.textContent = this.fontSize.value;
            this.textColor.value = state.styles.textColor || '#ffffff';
            this.textGlow.value = state.styles.glow || 'none';
            this.textShadow.value = state.styles.shadow || 'none';
            this.textAnimation.value = state.styles.animation || 'typewriter';
            this.charDelay.value = state.styles.charDelay || 80;
            this.charDelayValue.textContent = this.charDelay.value;
            this.textAnimation.value = state.styles.animation || 'typewriter';
            this.charDelay.value = state.styles.charDelay || 80;
            this.charDelayValue.textContent = this.charDelay.value;

            // Handle legacy alignment or new position
            if (state.styles.position) {
                this.textPosition = state.styles.position;
            } else if (state.styles.alignment) {
                // Convert legacy alignment to position
                this.textPosition = this.convertAlignmentToPosition(state.styles.alignment);
            } else {
                this.textPosition = { x: 50, y: 50 };
            }

            // Update position sliders
            this.textPositionX.value = this.textPosition.x;
            this.textPositionXValue.textContent = this.textPosition.x;
            this.textPositionY.value = this.textPosition.y;
            this.textPositionYValue.textContent = this.textPosition.y;
        }

        // Apply background
        if (state.background) {
            this.setBgType(state.background.type || 'image');
            this.bgSolidColor.value = state.background.solidColor || '#1a1a2e';
            this.bgBlur.value = state.background.blur || 0;
            this.bgBlurValue.textContent = this.bgBlur.value;
            this.bgOverlay.value = state.background.overlay || 40;
            this.bgOverlayValue.textContent = this.bgOverlay.value;

            // Gradient animation
            this.gradientAnimation.checked = state.background.animated || false;
            this.gradientSpeed.value = state.background.animationSpeed || 0.5;

            if (this.gradientAnimation.checked) {
                this.gradientSpeedControl.classList.remove('hidden');
                this.renderer.setBackground({
                    animated: true,
                    animationSpeed: state.background.animationSpeed || 0.5
                });
            } else {
                this.gradientSpeedControl.classList.add('hidden');
                this.renderer.setBackground({ animated: false });
            }
        }

        // Apply aspect ratio
        if (state.aspectRatio) {
            this.aspectRatioSelect.value = state.aspectRatio;
            this.changeAspectRatio();
        }

        this.updateStyles();
        this.updatePreview();

        if (saveHistory) {
            this.saveState();
        }
    }

    // ============================================
    // Auto-save
    // ============================================
    startAutoSave() {
        this.autoSaveTimer = setInterval(() => {
            this.saveToLocalStorage();
        }, 5000); // Auto-save every 5 seconds
    }

    saveToLocalStorage() {
        try {
            const state = this.getProjectState();
            localStorage.setItem('lyrical-project', JSON.stringify(state));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
        }
    }

    loadFromLocalStorage() {
        try {
            // Load theme
            const theme = localStorage.getItem('lyrical-theme');
            if (theme) {
                document.documentElement.setAttribute('data-theme', theme);
            }

            // Load project
            const savedProject = localStorage.getItem('lyrical-project');
            if (savedProject) {
                const state = JSON.parse(savedProject);
                this.applyProjectState(state, true);
            } else {
                this.loadDefaultLyrics();
            }
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
            this.loadDefaultLyrics();
        }
    }

    showAutoSaveIndicator() {
        this.autoSaveIndicator.classList.remove('hidden');
        setTimeout(() => {
            this.autoSaveIndicator.classList.add('hidden');
        }, 2000);
    }

    // ============================================
    // Import/Export Project
    // ============================================
    exportProject() {
        const state = this.getProjectState();
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lyrical_project_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    importProject(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const state = JSON.parse(event.target.result);
                this.applyProjectState(state);
                this.showAutoSaveIndicator();
            } catch (error) {
                console.error('Failed to import project:', error);
                alert('Failed to import project. Invalid file format.');
            }
        };
        reader.readAsText(file);
        e.target.value = ''; // Reset input
    }

    // ============================================
    // Lyrics Management
    // ============================================
    loadDefaultLyrics() {
        const defaultLyrics = [
            { text: "Jana Mere Sawalon Ka Manzar Tu", duration: 2.5 },
            { text: "Haan Main Sukha Sa Sara Samandar Tu", duration: 2.5 },
            { text: "Haan Gulabi Si Surkhi Jo Dikhti Thi", duration: 2.5 },
            { text: "Fir Se Dikh Jaye Toh", duration: 1.5 },
            { text: "Jee Bhar Ke Saah Bhar Lu", duration: 1.5 }
        ];

        this.lyrics = defaultLyrics;
        this.renderLyricsList();
        this.syncLyricsToRenderer();
        this.saveState();
    }

    renderLyricsList() {
        this.lyricsContainer.innerHTML = '';

        this.lyrics.forEach((lyric, index) => {
            const lineEl = this.createLyricLineElement(lyric, index);
            this.lyricsContainer.appendChild(lineEl);
        });
    }

    createLyricLineElement(lyric, index) {
        const div = document.createElement('div');
        div.className = 'lyric-line';
        div.dataset.index = index;
        div.draggable = true;

        div.innerHTML = `
            <span class="drag-handle" title="Drag to reorder">⋮⋮</span>
            <span class="line-number">${index + 1}</span>
            <input type="text" value="${lyric.text}" placeholder="Enter lyrics..." class="lyric-text-input" tabindex="${index + 1}">
            <input type="number" value="${lyric.duration}" min="0.5" max="30" step="0.5" class="lyric-duration" title="Duration (seconds)">
            <span class="unit-label">s</span>
            <button class="delete-btn" title="Delete line">×</button>
        `;

        // Event listeners
        const textInput = div.querySelector('.lyric-text-input');
        const durationInput = div.querySelector('.lyric-duration');
        const deleteBtn = div.querySelector('.delete-btn');

        textInput.addEventListener('input', () => {
            this.lyrics[index].text = textInput.value;
            this.syncLyricsToRenderer();
            this.updatePreview();
        });

        textInput.addEventListener('blur', () => this.saveState());

        durationInput.addEventListener('input', () => {
            this.lyrics[index].duration = parseFloat(durationInput.value) || 2;
            this.syncLyricsToRenderer();
            this.updateTotalTime();
        });

        durationInput.addEventListener('blur', () => this.saveState());

        deleteBtn.addEventListener('click', () => {
            this.lyrics.splice(index, 1);
            this.renderLyricsList();
            this.syncLyricsToRenderer();
            this.updatePreview();
            this.saveState();
        });

        // Drag and drop events
        div.addEventListener('dragstart', (e) => this.handleDragStart(e, index));
        div.addEventListener('dragend', () => this.handleDragEnd());
        div.addEventListener('dragover', (e) => this.handleDragOver(e));
        div.addEventListener('dragenter', (e) => this.handleDragEnter(e, div));
        div.addEventListener('dragleave', (e) => this.handleDragLeave(e, div));
        div.addEventListener('drop', (e) => this.handleDrop(e, index));

        return div;
    }

    // ============================================
    // Drag and Drop
    // ============================================
    handleDragStart(e, index) {
        this.draggedIndex = index;
        e.currentTarget.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index);
    }

    handleDragEnd() {
        this.draggedIndex = null;
        document.querySelectorAll('.lyric-line').forEach(el => {
            el.classList.remove('dragging', 'drag-over');
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    handleDragEnter(e, element) {
        e.preventDefault();
        element.classList.add('drag-over');
    }

    handleDragLeave(e, element) {
        element.classList.remove('drag-over');
    }

    handleDrop(e, targetIndex) {
        e.preventDefault();

        if (this.draggedIndex === null || this.draggedIndex === targetIndex) return;

        // Reorder lyrics
        const [removed] = this.lyrics.splice(this.draggedIndex, 1);
        this.lyrics.splice(targetIndex, 0, removed);

        this.renderLyricsList();
        this.syncLyricsToRenderer();
        this.updatePreview();
        this.saveState();
    }

    addLyricLine(text = '', duration = 2) {
        this.lyrics.push({ text, duration });
        this.renderLyricsList();
        this.syncLyricsToRenderer();
        this.saveState();

        // Focus the new input
        const inputs = this.lyricsContainer.querySelectorAll('.lyric-text-input');
        if (inputs.length > 0) {
            inputs[inputs.length - 1].focus();
        }
    }

    // ============================================
    // Helpers
    // ============================================
    convertAlignmentToPosition(alignment) {
        const map = {
            'top-left': { x: 20, y: 20 },
            'top-center': { x: 50, y: 20 },
            'top-right': { x: 80, y: 20 },
            'middle-left': { x: 20, y: 50 },
            'middle-center': { x: 50, y: 50 },
            'middle-right': { x: 80, y: 50 },
            'bottom-left': { x: 20, y: 80 },
            'bottom-center': { x: 50, y: 80 },
            'bottom-right': { x: 80, y: 80 }
        };
        return map[alignment] || { x: 50, y: 50 };
    }

    // ============================================
    // Paste from Clipboard
    // ============================================
    async pasteFromClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            if (text.trim()) {
                const lines = text.split('\n').filter(l => l.trim());
                const delay = parseFloat(this.defaultDelay?.value) || 2;

                lines.forEach(line => {
                    this.lyrics.push({ text: line.trim(), duration: delay });
                });

                this.renderLyricsList();
                this.syncLyricsToRenderer();
                this.updatePreview();
                this.saveState();
            }
        } catch (error) {
            console.error('Failed to read clipboard:', error);
            alert('Unable to access clipboard. Please use Bulk Import instead.');
        }
    }

    // ============================================
    // Clear All with Confirmation
    // ============================================
    confirmClearAll() {
        this.showConfirmModal('Are you sure you want to clear all lyrics? This action cannot be undone.', () => {
            this.lyrics = [];
            this.renderLyricsList();
            this.syncLyricsToRenderer();
            this.updatePreview();
            this.saveState();
        });
    }

    // ============================================
    // Bulk Import Modal
    // ============================================
    showBulkImport() {
        this.bulkImportModal.classList.remove('hidden');
        this.bulkLyricsInput.focus();
    }

    hideBulkImport() {
        this.bulkImportModal.classList.add('hidden');
        this.bulkLyricsInput.value = '';
    }

    importBulkLyrics() {
        const text = this.bulkLyricsInput.value.trim();
        if (!text) return;

        const delay = parseFloat(this.defaultDelay.value) || 2;
        const lines = text.split('\n').filter(l => l.trim());

        this.lyrics = lines.map(line => ({
            text: line.trim(),
            duration: delay
        }));

        this.renderLyricsList();
        this.syncLyricsToRenderer();
        this.updatePreview();
        this.hideBulkImport();
        this.saveState();
    }

    syncLyricsToRenderer() {
        this.renderer.setLyrics(this.lyrics);
        this.updateTotalTime();
    }

    // ============================================
    // Templates
    // ============================================
    applyTemplate(templateName) {
        const template = TEMPLATES[templateName];
        if (!template) return;

        this.fontFamily.value = template.fontFamily;
        this.fontSize.value = template.fontSize;
        this.fontSizeValue.textContent = template.fontSize;
        this.textColor.value = template.textColor;
        this.textGlow.value = template.glow;
        this.textShadow.value = template.shadow;
        this.textAnimation.value = template.animation;
        this.charDelay.value = template.charDelay;
        this.charDelayValue.textContent = template.charDelay;

        this.updateStyles();
        this.saveState();
    }

    // ============================================
    // Styles
    // ============================================
    updateStyles() {
        this.renderer.setStyles({
            fontFamily: this.fontFamily.value,
            fontSize: parseInt(this.fontSize.value),
            textColor: this.textColor.value,
            glow: this.textGlow.value,
            shadow: this.textShadow.value,
            animation: this.textAnimation.value,
            charDelay: parseInt(this.charDelay.value),
            alignment: this.textAlignment
        });

        this.updatePreview();
    }

    // ============================================
    // Background
    // ============================================
    setBgType(type) {
        // Update buttons
        this.bgTypeImage.classList.toggle('active', type === 'image');
        this.bgTypeGradient.classList.toggle('active', type === 'gradient');
        this.bgTypeSolid.classList.toggle('active', type === 'solid');

        // Show/hide sections
        this.imageUploadSection.classList.toggle('hidden', type !== 'image');
        this.gradientSection.classList.toggle('hidden', type !== 'gradient');
        this.solidColorSection.classList.toggle('hidden', type !== 'solid');

        // Update renderer
        this.renderer.setBackground({ type });
        this.updatePreview();
    }

    async handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        this.fileName.textContent = file.name;

        try {
            await this.renderer.loadBackgroundImage(file);
            this.updatePreview();
            this.saveState();
        } catch (error) {
            console.error('Failed to load image:', error);
            this.fileName.textContent = 'Error loading image';
        }
    }

    // ============================================
    // Aspect Ratio
    // ============================================
    changeAspectRatio() {
        this.aspectRatio = this.aspectRatioSelect.value;
        const dimensions = ASPECT_RATIOS[this.aspectRatio];

        this.canvas.width = dimensions.width;
        this.canvas.height = dimensions.height;
        this.canvasWrapper.setAttribute('data-aspect', this.aspectRatio);
        this.resolutionDisplay.textContent = `${dimensions.width}×${dimensions.height}`;

        // Update renderer
        this.renderer.setAspectRatio(this.aspectRatio, dimensions);
        this.updatePreview();
    }



    // ============================================
    // Karaoke Mode
    // ============================================
    toggleKaraokeMode() {
        this.karaokeMode = !this.karaokeMode;
        this.karaokeToggle.classList.toggle('active', this.karaokeMode);
        this.renderer.setKaraokeMode(this.karaokeMode);
    }

    // ============================================
    // Preview
    // ============================================
    updatePreview() {
        if (this.isPlaying) return;

        if (this.lyrics.length > 0) {
            this.renderer.renderFrame(this.currentTime);
        } else {
            this.renderer.drawBackground();
        }
    }

    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    play() {
        if (this.lyrics.length === 0) return;

        this.isPlaying = true;
        this.playBtn.querySelector('.play-icon').classList.add('hidden');
        this.playBtn.querySelector('.pause-icon').classList.remove('hidden');

        this.renderer.startPreview(
            (elapsed, total, currentLyric, lineIndex) => {
                this.currentTime = elapsed;
                this.updateTimeDisplay(elapsed, total);
                this.timeline.value = (elapsed / total) * 100;

                if (currentLyric) {
                    this.currentLyricText.textContent = currentLyric.text;
                }

                // Highlight current line
                this.highlightCurrentLine(lineIndex);
            },
            () => {
                this.isPlaying = false;
                this.playBtn.querySelector('.play-icon').classList.remove('hidden');
                this.playBtn.querySelector('.pause-icon').classList.add('hidden');
                this.currentTime = 0;
                this.timeline.value = 0;
                this.highlightCurrentLine(-1);
                this.updatePreview();
            },
            this.previewSpeed
        );
    }

    pause() {
        this.isPlaying = false;
        this.renderer.stopPreview();
        this.playBtn.querySelector('.play-icon').classList.remove('hidden');
        this.playBtn.querySelector('.pause-icon').classList.add('hidden');
    }

    stop() {
        this.pause();
        this.currentTime = 0;
        this.timeline.value = 0;
        this.currentLyricText.textContent = '--';
        this.updateTimeDisplay(0, this.renderer.getTotalDuration());
        this.highlightCurrentLine(-1);
        this.updatePreview();

        if (this.audioPlayer.src) {
            this.audioPlayer.currentTime = 0;
        }
    }

    seekTo(percent) {
        const total = this.renderer.getTotalDuration();
        this.currentTime = (percent / 100) * total;
        this.renderer.seekTo(this.currentTime);
        this.updateTimeDisplay(this.currentTime, total);
    }

    highlightCurrentLine(index) {
        document.querySelectorAll('.lyric-line').forEach((el, i) => {
            el.classList.toggle('playing', i === index);
        });
        this.currentLineIndex = index;
    }

    updateTimeDisplay(current, total) {
        this.currentTimeDisplay.textContent = this.formatTime(current);
        this.totalTimeDisplay.textContent = this.formatTime(total);
    }

    updateTotalTime() {
        const total = this.renderer.getTotalDuration();
        this.totalTimeDisplay.textContent = this.formatTime(total);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // ============================================
    // Modals
    // ============================================
    showConfirmModal(message, onConfirm) {
        this.confirmMessage.textContent = message;
        this.confirmModal.classList.remove('hidden');

        // Remove previous listener and add new one
        const newConfirmOk = this.confirmOk.cloneNode(true);
        this.confirmOk.parentNode.replaceChild(newConfirmOk, this.confirmOk);
        this.confirmOk = newConfirmOk;

        this.confirmOk.addEventListener('click', () => {
            onConfirm();
            this.hideConfirmModal();
        });
    }

    hideConfirmModal() {
        this.confirmModal.classList.add('hidden');
    }

    showHelpModal() {
        this.helpModal.classList.remove('hidden');
    }

    hideHelpModal() {
        this.helpModal.classList.add('hidden');
    }

    hideAllModals() {
        this.hideConfirmModal();
        this.hideHelpModal();
        this.hideBulkImport();
    }

    // ============================================
    // Export Video
    // ============================================
    async exportVideo() {
        if (this.lyrics.length === 0) {
            alert('Please add some lyrics first!');
            return;
        }

        // Show progress
        this.exportProgress.classList.remove('hidden');
        this.exportBtn.disabled = true;
        this.canvasOverlay.classList.remove('hidden');

        const quality = this.exportQuality.value;
        const fps = parseInt(this.exportFps.value);

        try {
            const videoBlob = await this.renderer.exportVideo(
                quality,
                fps,
                (progress) => {
                    this.progressFill.style.width = `${progress}%`;
                    this.progressText.textContent = `Rendering: ${Math.round(progress)}%`;
                }
            );

            if (videoBlob) {
                const filename = `lyrical_video_${this.aspectRatio.replace(':', 'x')}_${quality}_${new Date().getTime()}.webm`;
                this.renderer.downloadVideo(videoBlob, filename);
                this.progressText.textContent = 'Complete! Video downloaded.';
            }
        } catch (error) {
            console.error('Export failed:', error);
            this.progressText.textContent = 'Export failed. Please try again.';
        } finally {
            this.exportBtn.disabled = false;
            this.canvasOverlay.classList.add('hidden');

            setTimeout(() => {
                this.exportProgress.classList.add('hidden');
                this.progressFill.style.width = '0%';
            }, 3000);
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new LyricalVideoApp();
});
