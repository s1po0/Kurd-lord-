# ڕۆحی شمشێر · Sword Spirit

A 3D Donghua-inspired action game: fly a sword, collect qi, fight spirits,
progress through realms and face a demon lord.

## Web preview

Requires Node.js. From the repository root:

```sh
PORT=5173 node web/serve.mjs
```

Open the preview on port 5173. Three.js is vendored locally; the game does
not need an internet connection at runtime.

- **Keyboard:** WASD or arrow keys to fly; Shift to sprint; Space to start and
  trigger a burst; R or Space to restart. Sword qi fires automatically.
- **Touch:** use the directional buttons, the sprint button and the action
  button to start, burst or restart.

The web version uses primitive 3D models. The background is a newly generated
replacement, not the original artwork from the other session.

## Estrella and Kiln sources

`sword-spirit/` contains the Estrella scene and TypeScript game source, as well
as procedural Kiln sources (`sword-spirit/kiln-assets/`). See the Kiln README
for export instructions and `art-direction/ART_DIRECTION.md` for the visual
brief. The Estrella project and Kiln export have not been tested in this
workspace.

This project was recovered from a text diff. That diff did not include the
original PNG or GLB binaries, so the original title/boss art and exported models
are not included. The web version supplies its own replacement sky image;
the same replacement is provided for the Estrella scene. The Kiln source files
can be used to attempt to regenerate the models.
