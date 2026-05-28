# NeyakEditor – AI Gesture Based Photo & Video Editing Platform

## Project Overview

**NeyakEditor** is a futuristic AI-powered editing platform where users can upload photos/videos and edit them using:
- AI tools
- Hand gestures
- Drag-and-drop controls
- Smart automation

The platform combines:
- AI image editing
- Gesture recognition
- AI animation generation
- Fashion transformation
- Video editing
- 3D avatar creation

NeyakEditor is designed for:
- Social media creators
- Photographers
- Fashion creators
- AI influencers
- E-commerce sellers
- Graphic designers
- Students
- Video editors

---

# Core Vision

Create an all-in-one AI creative studio where users can:
- Upload any image/video
- Control editing using hand gestures
- Convert images into animations
- Change clothes with AI
- Merge multiple photos
- Generate cinematic effects
- Create anime versions
- Build AI avatars

---

# Website Name

# **NeyakEditor**

Tagline:
> “Edit Beyond Reality with AI & Gestures”

---

# Main Features

## 1. AI Photo Editing
- AI enhancement
- Auto retouch
- Color correction
- Smart object selection
- AI filters
- AI relighting

---

# 2. Gesture-Based Editing

## Webcam Gesture Tracking
Users can edit media using hand movements.

## Supported Gestures

| Gesture | Action |
|---|---|
| Pinch fingers | Zoom in/out |
| Swipe hand | Move object |
| Two fingers rotate | Rotate image |
| Open palm | Select object |
| Closed fist | Drag layer |
| Double pinch | Duplicate object |

## Technologies
- MediaPipe
- TensorFlow.js
- OpenCV
- Hand Landmark Detection

---

# 3. AI Clothes Changing

Users can:
- Change outfit colors
- Replace clothes
- Try fashion styles
- Generate virtual outfits
- Fashion AI preview

## Use Cases
- E-commerce
- Fashion influencers
- Virtual try-on
- AI fashion shoots

---

# 4. AI Background Removal
- One-click remove background
- Transparent PNG export
- AI scene replacement
- Sky/background generation

---

# 5. AI Image Merge

Merge:
- Multiple faces
- Multiple photos
- Objects
- Cinematic scenes

## Features
- Layer blending
- Smart edge detection
- AI composition matching

---

# 6. AI Animation Generation

## Supported Modes
- Talking face animation
- Cinematic movement
- Anime style animation
- AI motion effects
- Image-to-video conversion

## AI Effects
- Camera movement
- Hair movement
- Eye blinking
- Lip sync
- Emotional expressions

---

# 7. Face Swap System
- AI face replacement
- Multi-face swap
- Realistic blending
- Video face swap

---

# 8. Object Movement

Users can:
- Move people/objects
- Resize objects
- Rotate items
- Reposition elements

AI auto-fills removed areas intelligently.

---

# 9. AI Filters

## Filter Categories
- Anime
- Cinematic
- Vintage
- Cyberpunk
- HDR
- Cartoon
- Dream effect
- Neon
- Futuristic

---

# 10. Professional Editing Workspace

## Modes

### Beginner Mode
- Simple drag & drop
- One-click AI tools

### Pro Mode
- Photoshop-like editor
- Layers
- Timeline
- Masking
- Blend modes
- Advanced controls

---

# Supported Media Types

## Photos
- JPG
- PNG
- WEBP
- HEIC

## Videos
- MP4
- MOV
- WEBM

## 3D Avatars
- GLB
- FBX

---

# User System

## Authentication
- Login/Register
- Google login
- Apple login
- OTP authentication

---

# User Dashboard

Users can:
- Save projects
- View download history
- Manage AI generations
- Store media in cloud
- Access templates

---

# Free Plan Features

## Free Version
- Watermarked exports
- Limited AI credits
- Basic filters
- Standard resolution

## Premium Future Upgrade
- No watermark
- HD exports
- Unlimited AI usage
- Faster rendering

---

# Futuristic UI Design

## Design Style
- Futuristic AI theme
- Glassmorphism
- Dark mode
- Neon highlights
- Smooth animations

---

# Pages Structure

## Public Pages
1. Home
2. Features
3. Pricing
4. AI Showcase
5. Templates
6. About
7. Contact

---

## User Pages
1. Dashboard
2. Editor Workspace
3. Saved Projects
4. Downloads
5. AI History
6. Settings

---

## Admin Panel
1. User Management
2. AI Usage Monitoring
3. Storage Control
4. Analytics Dashboard
5. Moderation System
6. Payment Management

---

# AI Features Architecture

## AI Models

| Feature | Suggested Model |
|---|---|
| Background Removal | U2Net |
| Clothes Change | Stable Diffusion |
| Animation | AnimateDiff |
| Face Swap | InsightFace |
| Gesture Detection | MediaPipe |
| Anime Filter | AnimeGAN |
| Talking Face | SadTalker |

---

# Recommended Tech Stack

## Frontend
- React.js
- Vite
- Tailwind CSS
- Framer Motion
- Three.js

---

## Backend
- Node.js
- Express.js
- Python AI Services

---

## Database
- MongoDB

---

## Cloud Storage
- Cloudinary
- AWS S3

---

# AI Processing Pipeline

## Workflow

1. User uploads image/video
2. AI detects objects/faces
3. Gesture tracking starts
4. User edits with gestures
5. AI processes changes
6. Preview generated
7. Export/download

---

# Folder Structure

```bash
neyakeditor/
│
├── client/
│   ├── src/
│   ├── components/
│   ├── pages/
│   ├── ai-tools/
│   ├── animations/
│   └── gesture-controls/
│
├── server/
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   ├── middleware/
│   └── ai-services/
│
├── python-ai/
│   ├── face-swap/
│   ├── animation/
│   ├── filters/
│   └── gesture-ai/
│
└── README.md
```

---

# Changelog

Per-change docs live under [`docs/`](docs/) — one MD per logical change, each with a back-link to this file.

## 2026-05-28

- [AI styles card (Ghibli / Anime / Cartoon / Sketch)](docs/2026-05-28-ai-styles.md) — feature: one-click AI style buttons in the editor; Replicate-backed when `REPLICATE_STYLE_MODEL` is set, CSS-filter fallback otherwise. Output goes to the merge layer.
- [Per-hand gesture routing](docs/2026-05-28-gesture-handedness.md) — feature: right hand drives the main image, left hand drives the merge layer; two-hand zoom only fires when both hands are at rest. Camera overlay colours skeletons by side and shows L/R badges.
- [Merge-layer second-image now renders](docs/2026-05-28-merge-layer-visibility.md) — fix: restructured the canvas JSX so the second image shares a sized wrapper with the first and gets an explicit `z-10`; previously invisible due to stacking + mismatched bounding boxes.
- [Vercel deployment configuration](docs/2026-05-28-vercel-deployment.md) — infra: added `vercel.json` + root `package.json`, ported all four dev-only `/api/*` middlewares (`remove-bg`, `stylize`, `animegan`, `templates`) to serverless functions under `api/`, so the same client works in production at [vercel.com/mahipal-s-projects1/neyakeditor](https://vercel.com/mahipal-s-projects1/neyakeditor).

<!--
  Convention: after any meaningful code change, add a one-line entry above
  under today's date and create the corresponding `docs/YYYY-MM-DD-slug.md`.
  Each per-change doc ends with a "← Back to project spec" link to this file.
-->