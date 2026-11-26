# Art Direction — ڕۆحی شمشێر · Sword Spirit (Donghua)

Locked visual target for the 3D Donghua game, built with the
`awesome-gamedev-agent-skills` art-direction method: **describe a system, not a
mood word**. Every axis below is an observable constraint, not "beautiful" or
"cinematic". This brief is the contract; later assets (Kiln models, materials,
UI) are compared against it at native game scale.

## Visual reference (translated to properties)
Source feel: Chinese ink-wash fantasy (仙侠 / xianxia) — jagged ink mountains,
a low red-gold moon, mist, sword-flight, spirit energy. We translate that into:

- **Palette**: indigo/ink blues for sky & distance; crimson-gold for the moon
  and ultimate/qi bursts; jade-cyan for the hero & sword qi; bone-white + violet
  for common spirits; deep red for the demon lord.
- **Mood**: serene but perilous; high contrast between glowing qi and cold mist.

## Axes (the system)

| Axis | Decision |
|------|----------|
| **Shape** | Slender, tapered, calligraphic. Swords = thin blades; robes = flowing tapered cylinders; spirits = wispy teardrop bodies. Chunky/blocky forms are forbidden. |
| **Silhouette** | Hero must read as "figure on a horizontal sword" from any angle. Enemy horns + trailing tail must never merge into the body mass. |
| **Value** | 3 bands: dark ink silhouette (shadow), mid ink-wash (forms), bright qi (glow). Must be readable in grayscale against the misty sky. |
| **Color** | Semantic roles: `hero=#5be0ff` jade, `qi=#ffd24a` gold, `danger=#ff3b3b`, `enemy=#7a1f2b`/`#3a0d18`, `env=#2f6f6b`/indigo, `ui` light parchment. No muddy intermediates. |
| **Edge** | Soft 3D bevels + subtle rim light; ink-line optional on heroes only. No hard pixel clusters, no flat vector outlines. |
| **Material** | Metal (sword) = cool emissive cyan; cloth (robe) = matte jade; skin = warm pale; spirit = translucent ghost; magic = additive glow (bloom). |
| **Light** | Key light low & warm (moon/sunset), cool indigo ambient fill, strong cyan rim on the hero. Soft shadows, high contrast. |
| **Detail** | Concentrated on sword edge, robe sash, spirit eyes. Ground/mountains stay low-detail silhouettes. |
| **Camera** | Perspective, third-person, ~55° fov, camera behind & above the hero, slight downward tilt. Horizon low; moon framed upper-third. |
| **Motion** | Restrained, weighty flight with gentle bob; qi projectiles fast & snappy; spirits drift. Forms deform little. |

## Visual target (approval gate)
1. Capture viewport at 1280×720.
2. Show together: hero on sword, one common spirit, a qi orb, a HUD fragment, and
   the ink-mountain backdrop.
3. Show worst case: hero against the bright moon (must still read via rim light).
4. Palette swatch with the semantic roles above — not a bare color cloud.
5. Do/Don't: acceptable slender silhouette vs forbidden chunky outline drift.
**Approve this target before generating a large catalog.**

## Keep the family coherent
- One approved seed for all "spirit" variants; vary only hue/scale, not shape.
- Stable prompt card: invariant blocks (palette, lighting, silhouette rules)
  separate from asset-specific blocks.
- Generate related assets in small batches so shared scale & lighting hold.
- Carry explicit hex values (above) between sessions; never "a bit more red".
- Deterministic naming/pivots/canvas; reject outputs that are pretty alone but
  belong to a different visual system.

## Evaluate at three distances
1. **Thumbnail / native scale**: hero, enemy, orb, and HUD state read instantly.
2. **Working scale**: seam, rim light, material cue inspectable.
3. **Context**: asset inside a real gameplay frame with fog, bloom, and neighbors.
   An asset that only works zoomed in is not successful game art.

## Common drift signals to reject
- hero height / robe layers change between states
- outline color or width differs between adjacent assets
- highlights imply different light directions
- palette grows with near-duplicate muddy colors
- camera angle/projection changes across the set
- ground-contact / shadow footprint moves unpredictably
- UI mixes filled, outlined, beveled, and painterly treatments

## Asset → tooling map
- **3D models**: authored in **Kiln** (`sword-spirit/kiln-assets/*.kiln.js`) → GLB.
- **Engine**: imported into **Estrella** (`sword-spirit/`), referenced by
  `assets/models/*.esmesh`.
- **Backdrop / sky**: generated Donghua paintings (`assets/textures/donghua_*.png`)
  used as sky dome + title art, matching the palette above.
