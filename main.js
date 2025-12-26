import { ColorExtractor } from './modules/ColorExtractor.js';
import { QuiltGenerator } from './modules/QuiltGenerator.js';
import { UIController } from './modules/UIController.js';

class QuiltApp {
    constructor() {
        this.colorExtractor = new ColorExtractor();
        this.uiController = new UIController();
        this.quiltGenerator = null;
        this.currentPalette = [];
        this.isInitialized = false;
        
        // History for undo/redo
        this.history = [];
        this.historyIndex = -1;
        this.maxHistorySize = 20;
    }

    init() {
        // Initialize with grayscale palette
        this.currentPalette = this.colorExtractor.generateGrayscalePalette();
        
        // Setup p5.js
        new p5((p) => {
            p.setup = () => {
                const canvas = p.createCanvas(450, 450);
                canvas.parent('canvasContainer');
                p.noLoop();
                
                // Initialize quilt generator with p5 instance
                this.quiltGenerator = new QuiltGenerator(p, this.currentPalette);
                
                // Initial display
                this.uiController.displayPalette(this.currentPalette);
                this.quiltGenerator.generate();
                this.saveToHistory();
                this.isInitialized = true;
            };

            p.draw = () => {
                this.quiltGenerator.draw();
            };
        });

        // Setup all event listeners
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.setupDragAndDrop();
        
        // Display keyboard shortcuts
        this.uiController.showShortcutsHint();
    }

    setupEventListeners() {
        // Image upload
        document.getElementById('imageUpload').addEventListener('change', (e) => {
            this.handleImageUpload(e);
        });

        // Generate button
        document.getElementById('generate').addEventListener('click', () => {
            if (this.isInitialized) {
                this.generateNewPattern();
            }
        });

        // Export PNG button
        document.getElementById('exportPNG').addEventListener('click', () => {
            if (this.isInitialized) {
                this.quiltGenerator.exportPNG();
                this.uiController.showNotification('PNG exported!');
            }
        });

        // Export SVG button
        document.getElementById('exportSVG').addEventListener('click', () => {
            if (this.isInitialized) {
                this.quiltGenerator.exportSVG();
                this.uiController.showNotification('SVG exported!');
            }
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (!this.isInitialized) return;
            
            // Prevent default for our shortcuts
            const shortcuts = ['g', 's', 'p', 'z', 'y', 'r', 'h', '?'];
            if (shortcuts.includes(e.key.toLowerCase()) && (e.metaKey || e.ctrlKey || e.shiftKey)) {
                e.preventDefault();
            }
            
            // Generate new pattern: G or Space
            if (e.key === 'g' || e.key === 'G' || e.key === ' ') {
                if (!e.target.closest('input, button')) {
                    e.preventDefault();
                    this.generateNewPattern();
                }
            }
            
            // Export SVG: Cmd/Ctrl + S
            if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                this.quiltGenerator.exportSVG();
                this.uiController.showNotification('SVG exported!');
            }
            
            // Export PNG: Cmd/Ctrl + P
            if (e.key === 'p' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                this.quiltGenerator.exportPNG();
                this.uiController.showNotification('PNG exported!');
            }
            
            // Undo: Cmd/Ctrl + Z
            if (e.key === 'z' && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
                e.preventDefault();
                this.undo();
            }
            
            // Redo: Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y
            if ((e.key === 'z' && (e.metaKey || e.ctrlKey) && e.shiftKey) || 
                (e.key === 'y' && (e.metaKey || e.ctrlKey))) {
                e.preventDefault();
                this.redo();
            }
            
            // Reset to grayscale: R
            if (e.key === 'r' || e.key === 'R') {
                if (!e.target.closest('input')) {
                    this.resetToGrayscale();
                }
            }
            
            // Show help: H or ?
            if (e.key === 'h' || e.key === 'H' || e.key === '?') {
                this.uiController.toggleShortcutsHelp();
            }
        });
    }

    setupDragAndDrop() {
        const dropZone = document.body;
        let dragCounter = 0;

        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        // Add visual feedback
        dropZone.addEventListener('dragenter', (e) => {
            dragCounter++;
            if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
                const item = e.dataTransfer.items[0];
                if (item.type.match('^image/')) {
                    this.uiController.showDropZone();
                }
            }
        });

        dropZone.addEventListener('dragleave', () => {
            dragCounter--;
            if (dragCounter === 0) {
                this.uiController.hideDropZone();
            }
        });

        // Handle drop
        dropZone.addEventListener('drop', (e) => {
            dragCounter = 0;
            this.uiController.hideDropZone();
            
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type.startsWith('image/')) {
                this.handleImageFile(files[0]);
            } else {
                this.uiController.showNotification('Please drop an image file', 'error');
            }
        });
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            this.handleImageFile(file);
        }
    }

    handleImageFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                // Extract colors from image
                this.currentPalette = this.colorExtractor.extractFromImage(img);
                
                // Update UI
                this.uiController.removeOpacity();
                this.uiController.displayPalette(this.currentPalette);
                
                // Update quilt generator with new palette
                this.quiltGenerator.updatePalette(this.currentPalette);
                this.quiltGenerator.setHighlightColor('#E63946'); // Restore red highlight
                this.generateNewPattern();
                
                this.uiController.showNotification('Image processed successfully!');
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    generateNewPattern() {
        this.quiltGenerator.generate();
        this.saveToHistory();
        this.uiController.showNotification('New pattern generated!', 'success', 1500);
        this.updateUndoRedoButtons();
    }

    saveToHistory() {
        // Remove any states after current index (for new branch after undo)
        this.history = this.history.slice(0, this.historyIndex + 1);
        
        // Add current state
        const state = this.quiltGenerator.getState();
        this.history.push(state);
        
        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }
        
        this.updateUndoRedoButtons();
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            const state = this.history[this.historyIndex];
            this.quiltGenerator.setState(state);
            this.quiltGenerator.redraw();
            this.uiController.showNotification('Undo', 'info', 1000);
            this.updateUndoRedoButtons();
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            const state = this.history[this.historyIndex];
            this.quiltGenerator.setState(state);
            this.quiltGenerator.redraw();
            this.uiController.showNotification('Redo', 'info', 1000);
            this.updateUndoRedoButtons();
        }
    }

    updateUndoRedoButtons() {
        this.uiController.updateUndoRedoButtons(
            this.historyIndex > 0,
            this.historyIndex < this.history.length - 1
        );
    }

    resetToGrayscale() {
        this.currentPalette = this.colorExtractor.generateGrayscalePalette();
        this.uiController.displayPalette(this.currentPalette);
        this.quiltGenerator.updatePalette(this.currentPalette);
        this.quiltGenerator.setHighlightColor('#808080');
        this.generateNewPattern();
        this.uiController.showNotification('Reset to grayscale', 'info');
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new QuiltApp();
    app.init();
});