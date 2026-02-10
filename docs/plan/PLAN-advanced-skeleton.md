# PLAN-advanced-skeleton.md

## Context
The current render pipeline sends a basic line-drawing skeleton to the AI. The AI sometimes misinterprets lines (e.g., confusing a wall for a floor separation).
To improve "Semantic Rendering", we need to send a **Semantic Skeleton**: a grayscale image where shapes and shades have specific meanings that the AI prompt will reference.

**Reference:** `docs/ROADMAP_POS_MVP.md` (Sections 6.3 & 6.4)

## Goals
1.  **Semantic Icons:** Replace generic dots/boxes with recognizable shapes for Entities (Doors, Stairs, Windows, Furniture).
2.  **Grayscale Coding:** Use specific gray values to denote material/type without contaminating the color palette.
    *   Walls: Dark Gray (#333333)
    *   Floor: White (#FFFFFF)
    *   Doors: Medium Gray (#666666)
    *   Windows: Light Gray (#999999)
3.  **Smart Wall Merging:** Ensure adjacent rooms share walls correctly (no double lines).

## Architecture Changes

### 1. New Constants (`src/lib/skeleton/constants.ts`)
Define the "Semantic Grayscale Palette":
```typescript
export const SKELETON_COLORS = {
  FLOOR: '#FFFFFF',
  WALL: '#333333',
  DOOR: '#666666',
  WINDOW: '#999999',
  STAIRS: '#CCCCCC',
  TEXT: '#000000' // For debug/labels if needed
};
```

### 2. Skeleton Renderer (`src/lib/skeleton/renderer.ts`)
Create a dedicated renderer (decoupled from the main Canvas component) that runs on the server (or client-side invisible canvas) to generate the blob.
*   **Refactor:** Extract drawing logic from `Canvas.tsx` or `generateImage.ts` into a reusable `renderSkeleton(dungeon: DungeonMap): Promise<string>` function.
*   **Features:**
    *   `drawWalls()`: Use `globalCompositeOperation` to merge overlapping room walls.
    *   `drawEntities()`: Switch statement to render specific shapes based on `entity.type` and `entity.subtype`.

### 3. Entity Shape Logic
*   **Doors:** Draw rectangular block intersecting the wall.
*   **Stairs:** Draw "ladder" or "step" pattern with an arrow.
*   **Windows:** Draw thin rectangle on wall edge.

## Task Breakdown

### Phase 1: Foundation
- [ ] Create `src/lib/skeleton/constants.ts` with palette.
- [ ] Create `src/lib/skeleton/renderer.ts` skeleton.
- [ ] Create `src/lib/skeleton/shapes.ts` for entity drawing functions.

### Phase 2: Implementation
- [ ] Implement `drawWalls` with merge logic (using HTML5 Canvas API).
- [ ] Implement `drawDoor`, `drawWindow`, `drawStairs` in `shapes.ts`.
- [ ] Implement `drawFurniture` (simplified shapes).

### Phase 3: Integration
- [ ] Update `generateImage.ts` (Server Action) to use the new `renderSkeleton` (or pass the dataurl from client).
    *   *Note:* Since `canvas` is DOM-based, we might need to generate the skeleton on the Client and pass the Base64 to the Server Action.
- [ ] Update `Toolbar.tsx` to call `renderSkeleton` before `generateImage`.

### Phase 4: Prompt Engineering
- [ ] Update `promptBuilder.ts` to explicitly reference the grayscale meaning.
    *   Example adds: "Dark gray (#333333) indicating structural walls."

## Verification
1.  **Debug View:** Add a temporary "Show Skeleton" toggle in the UI to see what is being sent to the AI.
2.  **Render Test:** Generate a map and verify if the AI respects the new door/stair locations better.
