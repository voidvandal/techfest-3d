# TECHFEST '27 — Singularity

A 3D interactive website for a college Techfest. Scrolling flies the camera through one continuous WebGL world, built with **Three.js** and plain HTML, CSS and JavaScript, with no build step.

**Demo video:** [demo.mp4](demo.mp4) (desktop walkthrough followed by the mobile view)

## The journey

| Scroll section | 3D scene | Interaction |
| --- | --- | --- |
| **Hero** | A living energy core: a noise-displaced shader sphere with a wireframe shell, glow and three orbiting moons | Cursor parallax · hover to agitate the core · **click to fire a particle burst** |
| **About** | The camera swings around the core and flies past it | Animated stat counters |
| **Event worlds** (pinned) | Six 3D "worlds" on a ring, one per event (RoboWars, Code Sprint, Neural Nexus, Drone Dash, Hackathon, Pixel Arena) | **Scrolling rotates the ring**, and the info card swaps in sync · hover a world to spin it · **click a world** to open its details |
| **Schedule** (pinned) | A wormhole of neon rings and streaming light trails that the camera flies through | Day 1 → 2 → 3 cards fly in and out in 3D as you travel |
| **Speakers** | Floating crystals | 3D flip cards · click a crystal to spin it |
| **Register** | A swirling shader portal with a particle vortex | Submitting the form triggers a **warp-speed transition**: the field of view stretches, stars stream past, the screen flashes and a success screen appears |

### Also included
- A loader, then a cinematic fly-in intro
- Split-letter 3D title reveal and scroll-triggered 3D text reveals
- The theme colour shifts per section, and the scene background and fog follow the camera
- A live countdown to the fest, a scroll progress bar and section dots
- A custom cursor with labels for 3D objects
- Responsive layout: the camera framing adapts for phones, and particle counts and pixel ratio drop on touch devices
- Supports `prefers-reduced-motion`, keyboard focus states, and closes the popup with Esc

## Run locally

ES modules need a local server (opening the file directly won't work):

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Structure

```
index.html              page structure and content overlay
style.css               layout, glass UI, transitions, responsive rules
main.js                 Three.js scene, shaders, scroll-to-camera keyframes, raycasting, warp
vendor/three.module.min.js   Three.js r160 (vendored, no CDN needed)
demo.mp4                screen recording
```

## How the scroll-driven camera works

Each section defines a camera keyframe (position, look-at target, background colour and accent colour). On every frame, the current scroll position is mapped between the two nearest keyframes, eased, and the camera is smoothly damped toward that point. The Event and Schedule sections are taller sticky sections: their scroll progress drives the ring's rotation and the flight through the wormhole.
