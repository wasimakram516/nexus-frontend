# Nex, the Nexus guide

Each concern lives in one file, so a change touches one place.

| To change | Edit |
|---|---|
| What Nex says, per screen | `src/content/guide.ts` (wording only, no component code) |
| A pose, or the logo skeleton | `guide-poses.ts` (data). A new pose is one entry in `POSES`. |
| How Nex looks (face, cap, spark) | `NexSkin.tsx`. Keep the `data-*` hooks the engine animates. |
| Nex's colors | `nex-colors.ts`, resolved from the theme. The glow lives in `theme/tokens.ts`. |
| How Nex moves (blink, bob, confetti, trail) | `nex-engine.ts` |
| The speech bubble, tips, dismissal | `NexGuide.tsx` |
| Where Nex appears | the screen that renders `<NexGuide />` |

Rules that keep it correct:

- Rest limbs match the Nexus logo: four exact 45 degree limbs from the center node. `guide-poses.test.ts` fails if that drifts.
- Colors come from the theme, never hard-coded, so Nex follows light and dark mode and any rebrand.
- Tips are written guidance. Never word a tip as if Nex generated or calculated something.
- Motion respects `prefers-reduced-motion`.

Usage:

```tsx
<NexGuide tips={toGuideTips(SETUP_TIPS["Branding"])} storageKey="nexus-guide-setup" />
<NexMascot pose="celebrate" size={64} />
```
