export class ColorExtractor {
    constructor() {
        this.colorThief = new ColorThief();
        this.targetColors = 24;
    }

    extractFromImage(img) {
        try {
            let palette = this.colorThief.getPalette(img, this.targetColors, 10);
            
            if (!palette || palette.length < this.targetColors) {
                palette = this.colorThief.getPalette(img, this.targetColors, 5);
            }
            
            let hexColors = palette ? palette.map(rgb => this.rgbToHex(rgb[0], rgb[1], rgb[2])) : [];
            hexColors = [...new Set(hexColors)]; // Remove duplicates
            
            if (hexColors.length < this.targetColors) {
                hexColors = this.expandPalette(hexColors, this.targetColors);
            } else if (hexColors.length > this.targetColors) {
                hexColors = this.selectMostDistinct(hexColors, this.targetColors);
            }
            
            return this.sortByBrightness(hexColors);
        } catch (e) {
            console.error('Color extraction failed:', e);
            return this.generateGrayscalePalette();
        }
    }

    expandPalette(colors, targetCount) {
        let expanded = [...colors];
        
        while (expanded.length < targetCount) {
            const needed = targetCount - expanded.length;
            const sourceColors = [...expanded];
            
            for (let i = 0; i < needed && expanded.length < targetCount; i++) {
                const idx1 = i % sourceColors.length;
                const idx2 = (i + 1) % sourceColors.length;
                
                const color1 = this.hexToRgb(sourceColors[idx1]);
                const color2 = this.hexToRgb(sourceColors[idx2]);
                
                if (color1 && color2) {
                    const ratio = 0.5 + (i % 3) * 0.15;
                    const interpolated = this.interpolateColors(color1, color2, ratio);
                    const hexInterpolated = this.rgbToHex(interpolated.r, interpolated.g, interpolated.b);
                    
                    if (!expanded.includes(hexInterpolated)) {
                        expanded.push(hexInterpolated);
                    }
                }
            }
            
            // Add tonal variations if needed
            if (expanded.length < targetCount && expanded.length === sourceColors.length) {
                for (let color of sourceColors.slice(0, targetCount - expanded.length)) {
                    if (expanded.length >= targetCount) break;
                    
                    const rgb = this.hexToRgb(color);
                    if (rgb) {
                        const variation = expanded.length % 2 === 0 
                            ? this.adjustBrightness(rgb, 1.2)
                            : this.adjustBrightness(rgb, 0.85);
                        
                        const hexVariation = this.rgbToHex(variation.r, variation.g, variation.b);
                        if (!expanded.includes(hexVariation)) {
                            expanded.push(hexVariation);
                        }
                    }
                }
            }
        }
        
        return expanded.slice(0, targetCount);
    }

    selectMostDistinct(colors, targetCount) {
        const selected = [colors[0]];
        const remaining = colors.slice(1);
        
        while (selected.length < targetCount && remaining.length > 0) {
            let maxDistance = -1;
            let mostDistinctIndex = 0;
            
            for (let i = 0; i < remaining.length; i++) {
                const candidate = this.hexToRgb(remaining[i]);
                let minDistanceToSelected = Infinity;
                
                for (let selectedColor of selected) {
                    const selectedRgb = this.hexToRgb(selectedColor);
                    const distance = this.colorDistance(candidate, selectedRgb);
                    minDistanceToSelected = Math.min(minDistanceToSelected, distance);
                }
                
                if (minDistanceToSelected > maxDistance) {
                    maxDistance = minDistanceToSelected;
                    mostDistinctIndex = i;
                }
            }
            
            selected.push(remaining[mostDistinctIndex]);
            remaining.splice(mostDistinctIndex, 1);
        }
        
        return selected;
    }

    generateGrayscalePalette() {
        const palette = [];
        for (let i = 0; i < this.targetColors; i++) {
            const gray = Math.floor(255 - (i * 10));
            palette.push(this.rgbToHex(gray, gray, gray));
        }
        return palette;
    }

    // Utility methods
    rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    interpolateColors(color1, color2, ratio) {
        return {
            r: Math.round(color1.r + (color2.r - color1.r) * ratio),
            g: Math.round(color1.g + (color2.g - color1.g) * ratio),
            b: Math.round(color1.b + (color2.b - color1.b) * ratio)
        };
    }

    adjustBrightness(rgb, factor) {
        return {
            r: Math.min(255, Math.max(0, Math.round(rgb.r * factor))),
            g: Math.min(255, Math.max(0, Math.round(rgb.g * factor))),
            b: Math.min(255, Math.max(0, Math.round(rgb.b * factor)))
        };
    }

    colorDistance(color1, color2) {
        const dr = color1.r - color2.r;
        const dg = color1.g - color2.g;
        const db = color1.b - color2.b;
        return Math.sqrt(dr * dr + dg * dg + db * db);
    }

    getBrightness(hexColor) {
        const hex = hexColor.substring(1);
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return (r * 299 + g * 587 + b * 114) / 1000;
    }

    sortByBrightness(colors) {
        return colors.sort((a, b) => this.getBrightness(b) - this.getBrightness(a));
    }
}