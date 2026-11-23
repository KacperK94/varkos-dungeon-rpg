# VARKOS — 3D Renderer and Physics Architecture

- **Date:** 2026-11-23
- **Status:** Draft — awaiting owner approval
- **Selected architecture:** A — Three.js renderer adapter with legacy Canvas fallback
- **Scope:** Visual migration first; full 3D physics second
- **Platforms:** Modern desktop/mobile browsers and Android web runtime
- **Product constraint:** Preserve all existing gameplay mechanics and save compatibility

## 1. Intent

VARKOS is an existing dark-fantasy dungeon RPG. The goal is to replace its current 2.5D raycasting presentation with a genuine real-time 3D visual layer, then introduce a full 3D physics simulation without changing the rules or outcomes of the game.

This is an evolution of the existing game, not a rewrite. The current game remains authoritative for story progression, turn order, combat resolution, character attributes, inventory, rewards, enemy behavior, and save data. Rendering and physics are subordinate presentation/simulation services.

The visual direction is realistic dark fantasy: readable silhouettes, restrained atmospheric lighting, stone/metal/wood PBR materials, controlled fog, authored or generated dungeon geometry, and effects that remain performant on Android devices.

## 2. Current-state evidence and limits

The repository `KacperK94/varkos-dungeon-rpg` was confirmed to exist, but it was empty at the time this document was prepared: it had no files and no branches. The previous deployed VARKOS build was inspected through its public deployment assets. That inspection indicated:
- the current view is Canvas-based 2.5D raycasting rather than a true 3D scene;
- rendering and gameplay logic are substantially coupled in the deployed `game.js`;
- the game includes solo progression, turn-based combat, four character classes, dungeon floors, inventory, and browser-local persistence;
- multiplayer presentation appeared demonstrative/local rather than a verified authoritative online multiplayer implementation.

These observations are not a substitute for a source-code audit. The original source repository, complete files, tests, and save fixtures have not yet been recovered into this new repository. Therefore, no implementation may assume undocumented function signatures, map coordinate conventions, save schemas, or combat contracts. The first implementation task after this design is approved must be a source-recovery and compatibility audit.

## 3. Goals

1. Deliver a true 3D dungeon renderer using Three.js.
2. Preserve the existing game core and its observable gameplay behavior.
3. Keep the legacy Canvas renderer available as a fallback during migration.
4. Make renderer selection explicit and reversible.
5. Support touch controls, responsive HUD integration, browser keyboard/mouse input, and Android-class mobile GPUs.
6. Establish a clean boundary for a later Rapier 3D physics layer.
7. Ensure physics never decides turn order, hit success, damage, range, status effects, loot, or any other turn-based rule.
8. Add automated tests for adapter contracts, deterministic game behavior, save compatibility, and renderer fallback.
9. Make performance and device capability observable, with graceful fallback when WebGL or GPU resources are unavailable.

## 4. Non-goals

- Rewriting story, quests, dialogue, combat, classes, progression, items, enemy AI, or balance.
- Converting turn-based combat into action combat.
- Introducing online multiplayer, matchmaking, accounts, or server authority as part of this renderer project.
- Migrating local saves to Supabase or introducing a backend without a separately approved requirement.
- Replacing the existing HUD wholesale.
- Requiring high-end desktop hardware or sacrificing mobile usability for visual effects.
- Removing the Canvas renderer before the 3D renderer has passed acceptance tests on supported devices.

## 5. Approaches considered

### A. Three.js adapter with Canvas fallback — selected

Create a renderer interface consumed by the existing game presentation boundary. Implement a Three.js renderer behind that interface while retaining the legacy Canvas renderer. Route game state and presentation events through a normalized, read-only scene snapshot. The adapter translates game coordinates and entities into scene objects without owning game rules.

**Trade-offs:** Requires careful extraction of the current rendering boundary and a compatibility adapter, but supports incremental rollout, A/B comparison, rollback, and lower risk to the existing game.

### B. Replace the renderer in one operation

Remove the Canvas renderer and directly rebuild all rendering in Three.js.

**Trade-offs:** Less transitional code, but couples migration risk to the whole game and makes it harder to isolate visual regressions. Rejected because preserving existing mechanics is the highest-priority constraint.

### C. Use Babylon.js as the new renderer

Build a separate Babylon.js scene and adapter.

**Trade-offs:** A capable engine with integrated tooling, but it changes the selected technology without a demonstrated project-specific advantage. Three.js is selected for its lightweight, flexible rendering layer and broad browser ecosystem.

## 6. Architecture

### 6.1 Existing Game Core — authoritative

The existing core remains the source of truth. It owns:
- game session and state transitions;
- story, quests, dialogue, and dungeon progression;
- turn-based combat and all combat calculations;
- player/enemy stats, equipment, inventory, items, and effects;
- input intent validation and gameplay actions;
- save/load format and migration rules.

The renderer must not mutate core state. It receives immutable snapshots and emits user intents through existing game commands or a narrowly defined adapter. If current code has no clean boundary, introduce one incrementally without changing command semantics.

### 6.2 Renderer contract

Define a renderer-neutral contract, with exact types finalized after source audit. Conceptual responsibilities:

- `Renderer.initialize(host, capabilities)`
- `Renderer.resize(viewport)`
- `Renderer.render(snapshot, frameContext)`
- `Renderer.setQuality(profile)`
- `Renderer.dispose()`
- `Renderer.getDiagnostics()`

The normalized snapshot may contain:
- dungeon layout and tile/cell identifiers;
- static geometry descriptors (walls, floors, doors, stairs, props);
- actor presentation descriptors (class/model key, position, facing, animation state);
- visual-only combat cues (telegraph, hit flash, status aura) emitted by authoritative game events;
- lighting/fog/ambient metadata;
- camera target and permitted presentation state.

It must not contain mutable references to authoritative objects. The adapter must map the actual source model to this snapshot after the source audit; it must not guess coordinate orientation, units, or timing.

### 6.3 Three.js renderer

Responsibilities:
- WebGL renderer lifecycle and context-loss handling;
- scene, perspective camera, lighting, shadows, fog, and post-processing;
- dungeon meshes and instancing for repeated geometry;
- glTF/GLB asset loading with validated fallbacks;
- animation mixer for visual-only character and creature animation;
- visual effects (particles, spell effects, dust, fire, impact cues);
- quality profiles and resource disposal.

Recommended initial technical defaults (subject to package/source audit):
- Three.js current stable version compatible with project runtime;
- glTF 2.0 / GLB for authored assets;
- PBR materials with compressed textures where supported;
- instancing and shared materials for repeated dungeon pieces;
- no expensive post-processing by default on low-tier Android devices.

The renderer must be deterministic with respect to the supplied snapshot: identical snapshots and renderer configuration must not change game outcomes.

### 6.4 Legacy Canvas renderer

Keep the existing renderer operational behind the same renderer contract for the full migration period. It is the fallback when WebGL initialization fails, context is lost, the device is below minimum capability, or a diagnostic override selects Canvas.

Do not delete or substantially refactor the legacy renderer until:
- all required visual scenes have a 3D equivalent;
- save/load and gameplay regression tests pass;
- mobile and desktop acceptance tests pass;
- rollback has been verified.

### 6.5 World and asset layer

Separate logical dungeon data from render meshes. The world adapter maps existing grid/cell data to visual geometry. Geometry generation must preserve walkability, walls, doors, stairs, interaction targets, line-of-sight rules, and map progression as defined by the core.

Assets must have:
- stable identifiers;
- declared scale/origin conventions;
- fallback material or primitive;
- documented texture and memory budgets;
- licenses and provenance recorded in an asset manifest.

No asset may silently change collision, interaction, or combat rules.

### 6.6 Input and camera

Existing game actions remain authoritative. Camera orbit, pan, zoom, and touch gestures are presentation controls only and may not issue movement or combat commands unless explicitly mapped through existing controls. Preserve the current mobile HUD and its touch targets. Camera framing must keep the player, nearby interactables, and relevant combat feedback readable on narrow screens.

### 6.7 Physics — phase 2 only

Use Rapier 3D (JavaScript/WASM) behind a dedicated physics adapter after the renderer milestone is accepted.

Physics may govern:
- rigid-body motion of decorative debris and non-authoritative props;
- gravity and collision response for visual/environmental objects;
- physical presentation of doors, falling objects, particles, and ragdolls where appropriate;
- non-gameplay environmental interactions.

Physics must not govern:
- whether an attack hits;
- damage, armor, resistance, critical chance, or status application;
- turn order, action points, cooldowns, or enemy decision outcomes;
- item pickup eligibility, interaction range, or pathfinding rules;
- dungeon progression, quest conditions, or save-state authority.

Where the game needs deterministic movement or collision for gameplay, the existing logical grid/rules remain authoritative. The physics world is a presentation/simulation layer and can be reset/rebuilt from the game snapshot.

Physics tick:
- fixed-step simulation with bounded accumulator;
- independent from render frame rate;
- explicit pause/resume and visibility handling;
- deterministic seed where randomized visual effects are used;
- physics events filtered before they can become visual cues;
- no direct writes into Game Core.

### 6.8 Platform and performance

Target modern browsers with WebGL support and Android browsers/WebView where supported by the eventual packaging approach. Feature-detect WebGL, device limits, and context loss. Do not infer performance solely from user-agent strings.

Quality profiles:
- Low: reduced resolution scale, no real-time shadows or expensive post-processing, limited particles;
- Medium: selective shadows, moderate effects, capped texture sizes;
- High: higher shadow quality and effects where supported.

Use adaptive resolution or quality reduction only with stable thresholds and hysteresis to avoid oscillation. Provide a clear fallback message only when needed; the game remains playable through Canvas if 3D cannot start.

## 7. Data, saves, and compatibility

- Do not change the save schema as part of renderer migration.
- Do not persist Three.js object IDs, mesh references, physics handles, or transient animation state.
- Persist only existing gameplay data through the current save path.
- If a future save migration becomes unavoidable, add explicit versioning, backward-compatible migration, and fixture-based tests; seek separate approval before changing the format.
- Verify loading old saves in both renderer modes.
- Renderer failure must not corrupt, clear, or overwrite save data.

## 8. Rollout plan and gates

### Phase 0 — source recovery and audit
- Recover original source into this repository without overwriting the production deployment.
- Record exact commit/source provenance and current deployment version.
- Inspect all gameplay/render coupling, save schema, map representation, tests, and build scripts.
- Create characterization tests for core behavior before refactoring.
- Produce a verified list of renderer touchpoints and contracts.

**Gate:** no renderer implementation until source and regression baseline are understood.

### Phase 1 — renderer boundary
- Define renderer interface and normalized immutable snapshot.
- Wrap current Canvas renderer without changing gameplay behavior.
- Add contract and snapshot mapping tests.
- Add renderer selection and fallback diagnostics.

**Gate:** Canvas mode behaves identically to baseline; gameplay/save tests pass.

### Phase 2 — Three.js vertical slice
- Implement one representative dungeon room, player actor, camera, lighting, and one enemy.
- Load a small glTF asset set and fallback primitives.
- Connect visual-only events from game core.
- Validate touch/mobile layout and fallback.

**Gate:** no gameplay regression; visual slice passes browser and Android-device testing.

### Phase 3 — full visual coverage
- Port all dungeon tiles, doors, stairs, props, actors, classes, enemies, combat cues, and required UI-adjacent effects.
- Add asset manifest, quality profiles, context recovery, and diagnostics.
- Run full scene coverage and performance tests.

**Gate:** visual parity of gameplay information and approved 3D art direction; no missing gameplay affordances.

### Phase 4 — physics design and integration
- Reassess actual gameplay/world requirements after 3D visual milestone.
- Define allowed physical bodies and event boundaries.
- Add Rapier adapter and fixed-step simulation.
- Keep all gameplay decisions in Game Core.

**Gate:** physics tests prove it cannot alter combat, progression, inventory, or save outcomes.

### Phase 5 — release hardening
- Cross-browser, Android viewport, low-memory, context-loss, pause/resume, and save-compatibility tests.
- Verify Canvas fallback and rollback.
- Measure startup time, frame time, memory, draw calls, and asset loading.
- Only then consider switching the default renderer.

## 9. Testing and acceptance criteria

### Core preservation
- Existing story and dungeon progression fixtures produce the same state transitions.
- Combat fixtures produce identical hit/miss, damage, status, turn-order, and reward results.
- Inventory and all existing item behaviors remain unchanged.
- Existing saves load without data loss or schema rewrite.
- Rendering mode does not affect any authoritative game result.

### Renderer
- Canvas and Three.js consume the same normalized snapshot.
- Missing or invalid assets produce safe fallbacks, not crashes.
- WebGL initialization failure and context loss return to a playable fallback.
- Renderer disposal releases GPU resources and event listeners.
- No renderer-owned mutable object leaks into Game Core.

### Physics
- Fixed-step behavior is stable across render frame rates.
- Physics cannot mutate authoritative combat or progression fields.
- Resetting physics from the same snapshot does not change game state.
- Decorative collisions and motion remain isolated from interaction and combat rules.

### Platform/performance
- Test at narrow Android portrait and landscape sizes plus desktop.
- Touch HUD remains usable and does not overlap essential scene information.
- Low quality profile remains playable on minimum supported Android-class hardware (to be defined from device testing).
- Record startup, frame-time, memory, and asset-size baselines; set numeric budgets after measuring representative devices rather than inventing unsupported targets.

## 10. Security, reliability, and operations

- Do not commit credentials, tokens, private deployment configuration, or personal data.
- Do not add Supabase, authentication, analytics, or remote services as part of this scope.
- Pin dependency versions and use a lockfile.
- Validate external asset paths and fail closed on malformed asset metadata.
- Handle WebGL context loss, asset load failures, and tab visibility changes.
- Keep production deployment isolated until a reviewed build is explicitly promoted.

## 11. Decisions and open implementation details

**Decided**
- Architecture A: Three.js renderer adapter with Canvas fallback.
- Visual migration precedes physics.
- Rapier 3D is the intended physics technology for phase 2.
- Existing game mechanics and save compatibility are invariant.
- Android and browser support are required.
- HUD is preserved; visual rendering must adapt around it.

**Left to the builder after source audit**
- Exact Three.js and Rapier versions compatible with the recovered toolchain.
- Module boundaries and concrete renderer interface types.
- Coordinate conversion, scene units, camera defaults, and asset scale conventions based on actual map data.
- Build/test tooling and browser automation compatible with the repository.
- Numeric performance budgets based on measured target devices.
- Which physical objects add value without changing gameplay rules.

**Blocking dependency**
The source repository is currently empty. Recovering the original source and establishing a passing baseline is mandatory before a reliable implementation plan can be written.

## 12. Approval requested

This document is a design proposal, not authorization to implement. Approval confirms the architecture and constraints above. After approval, the next step is a detailed implementation plan based on the recovered source and its verified contracts. No product code, dependencies, or production deployment should be changed before that plan is reviewed.
