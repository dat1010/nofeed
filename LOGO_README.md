# NoFeed Logo Generation

This document explains how to generate PNG logo files for the NoFeed app.

## Current Logo Files

- `public/logo.svg` - Main SVG logo (512x512)
- `public/favicon.svg` - SVG favicon (32x32)
- `public/logo-generator.html` - HTML tool to convert SVG to PNG

## Generating PNG Files

### Option 1: Using the HTML Generator

1. Open `public/logo-generator.html` in your web browser
2. Click the download buttons to generate PNG files:
   - "Download 192x192" for `logo192.png`
   - "Download 512x512" for `logo512.png`
3. Move the downloaded files to the `public/` directory

### Option 2: Using Online Tools

1. Open `public/logo.svg` in a web browser
2. Right-click and save the image, or use online SVG to PNG converters
3. Generate the required sizes: 192x192 and 512x512

### Option 3: Using Design Software

1. Open `public/logo.svg` in design software like Figma, Sketch, or Adobe Illustrator
2. Export as PNG at the required sizes
3. Save as `logo192.png` and `logo512.png` in the `public/` directory

## Logo Design

The NoFeed logo represents breaking away from traditional social media feeds:

- **Background**: Dark circle (#1a1a1a) representing the digital space
- **Feed Lines**: Gray horizontal lines representing traditional social media feeds
- **Cross Symbol**: Red X (#ff6b6b) representing breaking away from feeds
- **Person Icon**: Teal circle with arms (#4ecdc4) representing the user
- **Text**: "NF" in white representing "NoFeed"

## File Structure

```
public/
├── favicon.svg          # Browser favicon
├── logo.svg            # Main app logo
├── logo-generator.html # PNG generation tool
├── logo192.png         # 192x192 PNG (generate this)
├── logo512.png         # 512x512 PNG (generate this)
└── manifest.json       # App manifest with icon references
```

## Browser Support

- Modern browsers support SVG favicons
- Fallback to PNG files for older browsers
- The manifest.json includes both SVG and PNG references for maximum compatibility 