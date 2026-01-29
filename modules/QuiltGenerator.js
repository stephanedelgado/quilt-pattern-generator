export class QuiltGenerator {
    constructor(p5Instance, initialPalette) {
        this.p = p5Instance;
        this.palette = initialPalette;
        this.highlightColor = '#808080'; // Gray for initial state
        this.gridSize = 6;
        
        // Make responsive - calculate from container
        this.updateCanvasSize();
        
        this.crossRow = 0;
        this.crossCol = 0;
        this.centerHighlights = [];
        this.currentSeed = 0;
    }

    updateCanvasSize() {
        const container = document.getElementById('canvasContainer');
        const containerWidth = container ? container.offsetWidth : 450;
        this.canvasSize = Math.min(containerWidth, 450);
        this.squareSize = this.canvasSize / this.gridSize;
        this.patchSize = this.squareSize / 3;
    }

    updatePalette(newPalette) {
        this.palette = newPalette;
    }

    setHighlightColor(color) {
        this.highlightColor = color;
    }

    generate() {
        this.currentSeed = Date.now();
        this.p.randomSeed(this.currentSeed);
        
        // Randomly position the cross
        this.crossRow = Math.floor(this.p.random(this.gridSize));
        this.crossCol = Math.floor(this.p.random(this.gridSize));
        
        // Generate center highlights (3-7 additional)
        const crossSquareIndex = this.crossRow * this.gridSize + this.crossCol;
        const numCenterHighlights = Math.floor(this.p.random(3, 8));
        
        const availableSquares = [];
        for (let i = 0; i < this.gridSize * this.gridSize; i++) {
            if (i !== crossSquareIndex) {
                availableSquares.push(i);
            }
        }
        
        this.centerHighlights = [];
        for (let i = 0; i < numCenterHighlights && availableSquares.length > 0; i++) {
            const randomIndex = Math.floor(this.p.random(availableSquares.length));
            this.centerHighlights.push(availableSquares[randomIndex]);
            availableSquares.splice(randomIndex, 1);
        }
        
        this.p.redraw();
    }

    // Get current state for history
    getState() {
        return {
            crossRow: this.crossRow,
            crossCol: this.crossCol,
            centerHighlights: [...this.centerHighlights],
            currentSeed: this.currentSeed,
            palette: [...this.palette],
            highlightColor: this.highlightColor
        };
    }

    // Restore state from history
    setState(state) {
        this.crossRow = state.crossRow;
        this.crossCol = state.crossCol;
        this.centerHighlights = [...state.centerHighlights];
        this.currentSeed = state.currentSeed;
        this.palette = [...state.palette];
        this.highlightColor = state.highlightColor;
    }

    redraw() {
        this.p.redraw();
    }

    draw() {
        // Reset random seed for consistent drawing
        this.p.randomSeed(this.currentSeed);
        this.p.background(255);
        
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const x = col * this.squareSize;
                const y = row * this.squareSize;
                this.drawSquare(x, y, row, col);
            }
        }
    }

    drawSquare(startX, startY, gridRow, gridCol) {
        const colorPair = this.getColorPair();
        const startWithLight = this.p.random() > 0.5;
        const hasCross = (gridRow === this.crossRow && gridCol === this.crossCol);
        const squareIndex = gridRow * this.gridSize + gridCol;
        const hasCenterHighlight = this.centerHighlights.includes(squareIndex);
        
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const x = startX + j * this.patchSize;
                const y = startY + i * this.patchSize;
                const position = i * 3 + j + 1;
                const isCrossPosition = [2, 4, 6, 8].includes(position);
                const isCenterSquare = (i === 1 && j === 1);
                
                let fillColor;
                if (hasCross && isCrossPosition) {
                    fillColor = this.highlightColor;
                } else if (isCenterSquare && hasCenterHighlight) {
                    fillColor = this.highlightColor;
                } else {
                    let useFirstColor = (i + j) % 2 === 0;
                    if (startWithLight) useFirstColor = !useFirstColor;
                    fillColor = useFirstColor ? colorPair[0] : colorPair[1];
                }
                
                this.p.fill(fillColor);
                this.p.noStroke();
                this.p.rect(x, y, this.patchSize, this.patchSize);
            }
        }
    }
    
    getColorPair() {
        const contrastType = this.getContrastType();
        
        if (contrastType === 'HIGH') {
            return this.getHighContrastPair();
        } else if (contrastType === 'MEDIUM') {
            return this.getMediumContrastPair();
        } else if (contrastType === 'LOW-MEDIUM') {
            return this.getLowMediumContrastPair();
        } else {
            return this.getLowContrastPair();
        }
    }

    getContrastType() {
        const rand = this.p.random();
        if (rand < 0.4) return 'HIGH';
        else if (rand < 0.75) return 'MEDIUM';
        else if (rand < 0.95) return 'LOW-MEDIUM';
        else return 'LOW';
    }

    getHighContrastPair() {
        const darkIndex = Math.floor(this.p.random(18, Math.min(23, this.palette.length)));
        const lightIndex = Math.floor(this.p.random(0, Math.min(8, this.palette.length)));
        return [this.palette[darkIndex], this.palette[lightIndex]];
    }

    getMediumContrastPair() {
        const index1 = Math.floor(this.p.random(this.palette.length));
        const offset = Math.floor(this.p.random(5, 10));
        const index2 = (index1 + offset) % this.palette.length;
        return [this.palette[index1], this.palette[index2]];
    }

    getLowMediumContrastPair() {
        const index1 = Math.floor(this.p.random(6, Math.min(18, this.palette.length)));
        const offset = Math.floor(this.p.random(3, 5));
        const index2 = this.p.constrain(index1 + offset, 0, this.palette.length - 1);
        return [this.palette[index1], this.palette[index2]];
    }

    getLowContrastPair() {
        const index1 = Math.floor(this.p.random(this.palette.length));
        const index2 = (index1 + Math.floor(this.p.random(1, 3))) % this.palette.length;
        return [this.palette[index1], this.palette[index2]];
    }

    exportPNG() {
        this.p.saveCanvas('quilt-pattern-' + Date.now(), 'png');
    }

    exportSVG() {
        // Always export at 450x450 regardless of current canvas size
        const exportSize = 450;
        const exportSquareSize = exportSize / this.gridSize;
        const exportPatchSize = exportSquareSize / 3;
        
        let svgString = `<svg width="${exportSize}" height="${exportSize}" xmlns="http://www.w3.org/2000/svg">\n`;
        svgString += '  <!-- Quilt pattern generated with p5.js -->\n';
        
        // Recreate pattern with same seed
        this.p.randomSeed(this.currentSeed);
        
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const x = col * exportSquareSize;
                const y = row * exportSquareSize;
                
                const colorPair = this.getColorPair();
                const startWithLight = this.p.random() > 0.5;
                const hasCross = (row === this.crossRow && col === this.crossCol);
                const squareIndex = row * this.gridSize + col;
                const hasCenterHighlight = this.centerHighlights.includes(squareIndex);
                
                for (let i = 0; i < 3; i++) {
                    for (let j = 0; j < 3; j++) {
                        const rectX = x + j * exportPatchSize;
                        const rectY = y + i * exportPatchSize;
                        const position = i * 3 + j + 1;
                        const isCrossPosition = [2, 4, 6, 8].includes(position);
                        const isCenterSquare = (i === 1 && j === 1);
                        
                        let fillColor;
                        if (hasCross && isCrossPosition) {
                            fillColor = this.highlightColor;
                        } else if (isCenterSquare && hasCenterHighlight) {
                            fillColor = this.highlightColor;
                        } else {
                            let useFirstColor = (i + j) % 2 === 0;
                            if (startWithLight) useFirstColor = !useFirstColor;
                            fillColor = useFirstColor ? colorPair[0] : colorPair[1];
                        }
                        
                        svgString += `  <rect x="${rectX}" y="${rectY}" width="${exportPatchSize}" height="${exportPatchSize}" fill="${fillColor}"/>\n`;
                    }
                }
            }
        }
        
        svgString += '</svg>';
        
        // Download SVG
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'quilt-pattern-' + Date.now() + '.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}