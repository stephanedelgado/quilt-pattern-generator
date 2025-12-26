# Custom Quilt Design Facility

A practical tool to extract color palettes and determine distribution for patchwork artworks.

## Features
- 🎨 Extract 24-color palette from any image
- 🔄 Generate unique quilt patterns
- 💾 Export as PNG or SVG
- ⌨️ Keyboard shortcuts
- 🖱️ Drag & drop support
- ↩️ Undo/Redo functionality

## Usage
1. Upload an image or drag & drop
2. Click Generate or press `G` for new patterns
3. Export using `Cmd/Ctrl + S` (SVG) or `Cmd/Ctrl + P` (PNG)
4. Press `H` for all shortcuts

## Live Demo
[Visit the app](https://YOUR-USERNAME.github.io/quilt-pattern-generator/)

## Technologies
- p5.js for canvas rendering
- Color Thief for palette extraction
- Tailwind CSS for styling
- Vanilla JavaScript ES6 modules

## License
MIT

```mermaid
graph TD
    A[index.html] --> B[main.js]
    B --> C[ColorExtractor]
    B --> D[QuiltGenerator]
    B --> E[UIController]
    
    C --> F[Color Thief Library]
    D --> G[p5.js Library]
    
    C --> H[extractPalette<br/>expandPalette<br/>sortByBrightness]
    D --> I[generatePattern<br/>drawGrid<br/>exportSVG<br/>exportPNG]
    E --> J[setupEventListeners<br/>updatePaletteDisplay<br/>toggleOpacity]
    
    style A fill:#f9f,stroke:#333,stroke-width:2px
    style B fill:#bbf,stroke:#333,stroke-width:2px
    style C fill:#bfb,stroke:#333,stroke-width:2px
    style D fill:#bfb,stroke:#333,stroke-width:2px
    style E fill:#bfb,stroke:#333,stroke-width:2px
```