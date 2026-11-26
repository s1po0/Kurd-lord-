# Kiln assets — ڕۆحی شمشێر · Sword Spirit

Procedural 3D models for the game, authored with **Kiln**
([instruktlabs/kiln](https://github.com/instruktlabs/kiln)). Each `*.kiln.js`
file is a Kiln asset source: it defines `const meta`, `async function build()`
(returning a root from `createRoot`), and an optional `function animate()`. No
imports/exports — `createRoot`, `createPart`, `boxGeo`, `cylinderGeo`,
`gameMaterial`, `THREE`, etc. are sandbox globals.

## Files
- `sword.kiln.js` — the flying sword the cultivator rides.
- `cultivator.kiln.js` — the robed sword-immortal (player).
- `qi-orb.kiln.js` — a collectible spirit-energy pearl (with a spin clip).
- `demon-spirit.kiln.js` — a malevolent wraith (enemy).

## Render to GLB
Install Kiln once, then render each source to a GLB:

```sh
npm install @instruktlabs/kiln
npx kiln render sword.kiln.js        --render cpu --out ../assets/models/sword.glb   --views sheet.png
npx kiln render cultivator.kiln.js   --render cpu --out ../assets/models/cultivator.glb --views sheet.png
npx kiln render qi-orb.kiln.js       --render cpu --out ../assets/models/qi-orb.glb  --views sheet.png
npx kiln render demon-spirit.kiln.js --render cpu --out ../assets/models/demon.glb   --views sheet.png
```

`--render cpu` uses the headless CPU path (no GPU required). Import the resulting
GLBs into the Estrella editor; each becomes `assets/models/*.esmesh` + materials.
Then point the `MeshRenderer` `mesh` fields in `assets/scenes/main.esscene` (and
the spawn helpers in `src/main.ts`) at the imported meshes to replace the
built-in placeholder primitives.

## Notes
- The shipped Estrella scene uses `builtin:*` primitives so it runs before any
  Kiln export exists. Swap in these GLBs for the final look described in
  `../../art-direction/ART_DIRECTION.md`.
- Keep the palette and silhouette rules from the art-direction brief when
  iterating on these sources.
