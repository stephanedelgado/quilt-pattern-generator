export class UIController {
    constructor() {
        this.paletteContainer = document.getElementById('colorPalette');
        this.canvasContainer = document.getElementById('canvasContainer');
        this.paletteWidth = 450;
        this.paletteHeight = 120;
        this.dropZone = null;
        this.shortcutsModal = null;
        this.createDropZone();
        this.createShortcutsModal();
        this.addUndoRedoButtons();
    }

    createDropZone() {
        this.dropZone = document.createElement('div');
        this.dropZone.className = 'fixed inset-0 bg-blue-500 bg-opacity-20 border-4 border-dashed border-blue-500 flex items-center justify-center z-50 hidden';
        this.dropZone.innerHTML = `
            <div class="bg-white p-8 rounded-lg shadow-lg">
                <p class="text-2xl font-bold text-blue-600">Drop image here</p>
            </div>
        `;
        document.body.appendChild(this.dropZone);
    }

    createShortcutsModal() {
        this.shortcutsModal = document.createElement('div');
        this.shortcutsModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden';
        this.shortcutsModal.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow-lg max-w-md">
                <h3 class="text-lg font-bold mb-4">Keyboard Shortcuts</h3>
                <div class="space-y-2 text-sm">
                    <div><kbd class="px-2 py-1 bg-gray-200 rounded">G</kbd> or <kbd class="px-2 py-1 bg-gray-200 rounded">Space</kbd> - Generate new pattern</div>
                    <div><kbd class="px-2 py-1 bg-gray-200 rounded">Cmd/Ctrl + S</kbd> - Export SVG</div>
                    <div><kbd class="px-2 py-1 bg-gray-200 rounded">Cmd/Ctrl + P</kbd> - Export PNG</div>
                    <div><kbd class="px-2 py-1 bg-gray-200 rounded">Cmd/Ctrl + Z</kbd> - Undo</div>
                    <div><kbd class="px-2 py-1 bg-gray-200 rounded">Cmd/Ctrl + Y</kbd> - Redo</div>
                    <div><kbd class="px-2 py-1 bg-gray-200 rounded">R</kbd> - Reset to grayscale</div>
                    <div><kbd class="px-2 py-1 bg-gray-200 rounded">H</kbd> or <kbd class="px-2 py-1 bg-gray-200 rounded">?</kbd> - Toggle this help</div>
                    <div class="mt-4 text-gray-600">You can also drag and drop images!</div>
                </div>
                <button onclick="this.parentElement.parentElement.classList.add('hidden')" 
                        class="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
                    Close
                </button>
            </div>
        `;
        document.body.appendChild(this.shortcutsModal);
    }

    addUndoRedoButtons() {
        const buttonsContainer = document.querySelector('.flex.gap-4');
        
        // Add undo button
        const undoBtn = document.createElement('button');
        undoBtn.id = 'undoBtn';
        undoBtn.className = 'px-6 py-2 border border-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50';
        undoBtn.innerHTML = '↶ Undo';
        undoBtn.disabled = true;
        
        // Add redo button
        const redoBtn = document.createElement('button');
        redoBtn.id = 'redoBtn';
        redoBtn.className = 'px-6 py-2 border border-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50';
        redoBtn.innerHTML = '↷ Redo';
        redoBtn.disabled = true;
        
        // Insert before first button
        buttonsContainer.insertBefore(undoBtn, buttonsContainer.firstChild);
        buttonsContainer.insertBefore(redoBtn, undoBtn.nextSibling);
    }

    showDropZone() {
        this.dropZone.classList.remove('hidden');
    }

    hideDropZone() {
        this.dropZone.classList.add('hidden');
    }

    toggleShortcutsHelp() {
        this.shortcutsModal.classList.toggle('hidden');
    }

    showShortcutsHint() {
        const hint = document.createElement('div');
        hint.className = 'text-center text-sm text-gray-600 mt-2';
        hint.innerHTML = 'Press <kbd class="px-2 py-1 bg-gray-200 rounded">H</kbd> for keyboard shortcuts';
        document.querySelector('main').appendChild(hint);
    }

    updateUndoRedoButtons(canUndo, canRedo) {
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        
        if (undoBtn) undoBtn.disabled = !canUndo;
        if (redoBtn) redoBtn.disabled = !canRedo;
    }

    displayPalette(colors) {
        this.paletteContainer.innerHTML = '';
        const swatchWidth = this.paletteWidth / colors.length;
        
        colors.forEach((color, index) => {
            const swatch = this.createColorSwatch(color, swatchWidth);
            swatch.title = `Color ${index + 1}: ${color}`;
            this.paletteContainer.appendChild(swatch);
        });
    }

    createColorSwatch(color, width) {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch flex items-center justify-center hover:scale-110 transition-transform cursor-pointer';
        swatch.style.backgroundColor = color;
        swatch.style.width = width + 'px';
        swatch.style.height = this.paletteHeight + 'px';
        
        const brightness = this.getBrightness(color);
        const textColor = brightness > 128 ? '#000000' : '#FFFFFF';
        
        const text = document.createElement('span');
        text.textContent = color.toUpperCase();
        text.style.color = textColor;
        text.style.fontSize = '10px';
        text.style.letterSpacing = '1px';
        
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
        const bgColor = {
            'success': 'bg-green-500',
            'error': 'bg-red-500',
            'info': 'bg-blue-500',
            'warning': 'bg-yellow-500'
        }[type] || 'bg-gray-800';
        
        notification.className = `fixed top-4 right-4 ${bgColor} text-white px-4 py-2 rounded shadow-lg transition-opacity z-50`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }
}