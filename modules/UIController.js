export class UIController {
    constructor() {
        this.paletteContainer = document.getElementById('colorPalette');
        this.canvasContainer = document.getElementById('canvasContainer');
        this.shortcutsModal = null;
        this.createShortcutsModal();
    }

    createShortcutsModal() {
        this.shortcutsModal = document.createElement('div');
        this.shortcutsModal.className = 'shortcuts-modal hidden';
        this.shortcutsModal.innerHTML = `
            <div class="shortcuts-content">
                <h3>Keyboard Shortcuts</h3>
                <div class="shortcuts-list">
                    <div><kbd>G</kbd> or <kbd>Space</kbd> - Generate new pattern</div>
                    <div><kbd>Cmd/Ctrl + S</kbd> - Export SVG</div>
                    <div><kbd>Cmd/Ctrl + P</kbd> - Export PNG</div>
                    <div><kbd>Cmd/Ctrl + Z</kbd> - Undo</div>
                    <div><kbd>Cmd/Ctrl + Y</kbd> - Redo</div>
                    <div><kbd>R</kbd> - Reset to grayscale</div>
                    <div><kbd>H</kbd> or <kbd>?</kbd> - Toggle this help</div>
                    <div><kbd>ESC</kbd> - Close this help</div>
                    <div class="shortcuts-footer">You can also drag and drop images!</div>
                </div>
                <button class="close-button">Close</button>
            </div>
        `;
        
        // Add close button functionality
        this.shortcutsModal.querySelector('.close-button').addEventListener('click', () => {
            this.hideShortcutsHelp();
        });
        
        // Close on backdrop click
        this.shortcutsModal.addEventListener('click', (e) => {
            if (e.target === this.shortcutsModal) {
                this.hideShortcutsHelp();
            }
        });
        
        document.body.appendChild(this.shortcutsModal);
    }

    toggleShortcutsHelp() {
        this.shortcutsModal.classList.toggle('hidden');
    }

    hideShortcutsHelp() {
        this.shortcutsModal.classList.add('hidden');
    }

    showShortcutsHint() {
        const hint = document.createElement('div');
        hint.className = 'keyboard-hint';
        hint.innerHTML = 'Press <kbd>H</kbd> for keyboard shortcuts';
        document.querySelector('.main-content').appendChild(hint);
    }

    displayPalette(colors) {
        this.paletteContainer.innerHTML = '';
        
        // Responsive palette width
        const container = this.paletteContainer.parentElement || this.paletteContainer;
        const containerWidth = Math.min(container.offsetWidth || 450, 450);
        const swatchWidth = containerWidth / colors.length;
        
        colors.forEach((color, index) => {
            const swatch = this.createColorSwatch(color, swatchWidth);
            swatch.title = `Color ${index + 1}: ${color}`;
            this.paletteContainer.appendChild(swatch);
        });
    }

    createColorSwatch(color, width) {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = color;
        swatch.style.minWidth = Math.max(width, 15) + 'px';
        swatch.style.flex = '1 0 auto';
        
        const brightness = this.getBrightness(color);
        const textColor = brightness > 128 ? '#000000' : '#FFFFFF';
        
        const text = document.createElement('span');
        text.textContent = color.toUpperCase();
        text.style.color = textColor;
        
        swatch.appendChild(text);
        
        // Add click to copy
        swatch.addEventListener('click', () => {
            navigator.clipboard.writeText(color).then(() => {
                this.showNotification(`Copied ${color}`, 'success', 1000);
            });
        });
        
        return swatch;
    }

    removeOpacity() {
        this.paletteContainer.classList.remove('initial-opacity');
        this.canvasContainer.classList.remove('initial-opacity');
    }

    getBrightness(hexColor) {
        const hex = hexColor.substring(1);
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return (r * 299 + g * 587 + b * 114) / 1000;
    }

    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }
}