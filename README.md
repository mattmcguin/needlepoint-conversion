<h1>
  <img src="images/needlepoint-bear.jpg" alt="Needlepoint Maker" width="80" style="border-radius: 8px; vertical-align: middle; margin-right: 12px;">
  Needlepoint Maker
</h1>

A web application that transforms any image into a needlepoint canvas pattern, complete with color-coded stitch guides and downloadable outputs. Built with HTML, CSS, and JavaScript because why use many tools when few do trick?

**Live Demo:** [needlepointmaker.com](https://needlepointmaker.com/)

## Why I Built This

My wife enjoys needlepoint as a hobby, but finding patterns for specific images she wanted to stitch was difficult. Commercial pattern generators often produce results with too many colors or awkward dimensions. This tool gives her full control over the conversion process—she can adjust the canvas size, limit the color palette, and export everything needed to start stitching.

## Features

- **Image to Pattern Conversion**: Upload any image and convert it to a grid-based needlepoint pattern
- **Project Size Presets**: Quick selection for common project types (Coaster, Ornament, Pillow, Wall Art) with smart aspect ratio matching—presets that would stretch your image are automatically disabled
- **Canvas Mesh Options**: Choose between 12 mesh (larger stitches) or 18 mesh (finer detail) canvas
- **Flexible Dimensions**: Enter dimensions in inches or stitches, with automatic conversion based on mesh count
- **Aspect Ratio Lock**: Optionally lock aspect ratio to prevent image distortion
- **Color Palette Control**: Limit the number of colors using median cut quantization
- **Interactive Grid**: Zoom in/out, toggle color codes, and show/hide grid lines
- **Color Legend**: View all colors with their codes, hex values, and stitch counts
- **Edit Settings**: Modify dimensions or colors of a converted project without re-uploading
- **Project Management**: Automatically saves projects to browser storage for later access
- **Multiple Export Options**:
  - Grid CSV (stitch-by-stitch color codes)
  - Legend CSV (color reference chart)
  - Preview PNG (quantized image)
  - Grid Image PNG (full pattern with codes)

## Usage

### Running the Application

Open `index.html` in a web browser. No build step or server required.

```bash
# macOS
open index.html

# Linux
xdg-open index.html

# Or simply double-click index.html in your file manager
```

### Converting an Image

1. Click **+ New Project** or drag an image onto the dropzone
2. Select a **Project Size** preset or choose Custom:
   - Coaster (4" × 4")
   - Ornament (3" × 4")
   - Pillow (8" × 8")
   - Wall Art (6" × 8")
   - Presets that don't match your image's aspect ratio are automatically disabled
3. Choose your **Canvas Mesh** (12 or 18 intersections per inch)
4. Adjust **Dimensions** if needed:
   - Toggle between Inches and Stitches units
   - Enable/disable aspect ratio lock
5. Set **Max Colors** for the palette (default auto-detected based on image complexity)
6. Click **Convert**

### Viewing Results

After conversion, you'll see:
- Pattern dimensions and physical size (e.g., "72 rows × 72 columns (4" × 4" at 18 mesh)")
- **Edit Settings** button to go back and adjust dimensions or colors
- Display controls:
  - **Cell Size**: Slider to zoom the grid view
  - **Hide/Show Codes**: Toggle color code labels on each cell
  - **Toggle Grid Lines**: Show or hide the grid borders

### Exporting Patterns

Use the download buttons:

- **Download Grid CSV**: A spreadsheet with color codes for each stitch position
- **Download Legend CSV**: A reference table mapping codes to hex colors and counts
- **Download Preview PNG**: The quantized image at canvas resolution
- **Download Grid Image**: A high-resolution image of the pattern grid with codes

### Managing Projects

- Projects are automatically saved to browser local storage
- Click any project in the sidebar to reload it
- Click **Edit Settings** to modify dimensions or colors of a saved project
- Click the **×** button to delete a project
- Use **Clear All Projects** to remove all saved data

## Technical Details

### Color Quantization

The application uses the **median cut algorithm** to reduce the image's color palette:

1. Collect all pixels from the resized image
2. Recursively split the color space along the axis with the largest range
3. Continue until reaching the target number of color "boxes"
4. Average the colors in each box to produce the final palette
5. Map each original pixel to its nearest palette color

### Mesh Count Conversion

Dimensions can be entered in inches or stitches:
- **18 mesh**: 18 stitches per inch (finer detail, more stitches)
- **12 mesh**: 12 stitches per inch (larger stitches, faster to complete)

Example: A 4" × 4" project equals:
- 72 × 72 stitches at 18 mesh
- 48 × 48 stitches at 12 mesh

### File Structure

```
needlepoint/
├── images/       # Favicon, logo, and OG images
├── index.html    # Application markup
├── styles.css    # UI styling
├── app.js        # Core logic (quantization, rendering, storage)
└── README.md     # This file
```

### Browser Requirements

- Modern browser with ES6 support
- Canvas API for image processing
- LocalStorage for project persistence

## License

MIT
