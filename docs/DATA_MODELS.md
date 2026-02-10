# Dungeon Architect — Modelos de Dados

> Schemas TypeScript para o sistema de mapas.

---

## Tipos Base

```typescript
interface Point {
  x: number;  // Grid units
  y: number;
}

interface Polygon {
  points: Point[];    // Vértices externos do polígono
  holes?: Point[][];  // Buracos internos (opcional)
}

type Resolution = "512x512" | "1024x1024" | "2048x2048";
```

---

## Schema Principal

```typescript
interface DungeonMap {
  meta: MapMeta;
  floors: Floor[];
  connections: Connection[];
  entities: Entity[];
}

interface MapMeta {
  id: string;
  name: string;
  theme: string;          // "medieval", "scifi", "horror", etc.
  atmosphere: string;     // "dark and damp", "cozy tavern"
  resolution: Resolution;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Floors (Andares)

```typescript
interface Floor {
  id: string;
  level: number;          // 0 = térreo, -1 = porão, 1 = 1º andar
  name: string;
  spaces: Space[];
  rendered: boolean;
  renderUrl?: string;     // Data URL ou blob URL da imagem
}
```

---

## Spaces (Espaços)

```typescript
type SpaceType = "room" | "corridor" | "stairs" | "outdoor";
type Lighting = "dark" | "dim" | "bright" | "magical";

interface Space {
  id: string;
  floorId: string;
  name: string;
  description: string;      // Lore para o mestre
  visualPrompt: string;     // Instrução pro render
  geometry: Polygon;        // Polígono arbitrário (pode ter buracos)
  zones: Zone[];            // Sub-áreas semânticas
  lighting: Lighting;
  spaceType: SpaceType;
  floorType?: string;       // Tipo de piso opcional
}

interface Zone {
  id: string;
  name: string;             // "área do balcão", "lareira"
  description: string;      // Contexto pro Gemini
  visualPrompt: string;     // "balcão de madeira rústica..."
  area: Polygon;
}
```

---

## Connections (Conexões)

```typescript
type ConnectionType = 
  | "door" 
  | "archway" 
  | "secret" 
  | "window" 
  | "stairs" 
  | "ladder" 
  | "rope" 
  | "portal";

interface Connection {
  id: string;
  type: ConnectionType;
  from: { 
    spaceId: string; 
    position: Point; 
  };
  to: { 
    spaceId: string; 
    position: Point; 
  };
  state?: "open" | "closed" | "locked" | "hidden";
  material?: string;
}
```

---

## Entities (Entidades)

```typescript
type EntityType = 
  | "npc" 
  | "monster" 
  | "treasure" 
  | "hazard" 
  | "interactive"
  | "door"          // Porta física
  | "window"        // Janela
  | "stairs"        // Escada visual
  | "furniture"     // Mobília
  | "wall_feature"; // Elemento de parede (tocha, quadro, etc.)

interface Entity {
  id: string;
  dungeonId: string;          // ID do dungeon pai
  floorId: string;
  type: EntityType;
  name: string;
  description: string;
  position: Point;
  icon: string;               // Token/ícone (não renderizado pela IA)
  interactionScript?: string;
  // Campos opcionais do Inspector
  coverImage?: string;
  properties?: Record<string, string>;
  linkedFloorId?: string;     // Para escadas entre andares
  rotation?: number;
  subtype?: string;
}
```

---

## Validações

### Conexões Verticais

Escadas entre andares devem ter posição espacialmente consistente:

```typescript
function validateVerticalConnection(conn: Connection, map: DungeonMap): boolean {
  if (!["stairs", "ladder", "rope", "portal"].includes(conn.type)) {
    return true; // Não é conexão vertical
  }
  
  // Posições devem coincidir (mesma coordenada no grid)
  return conn.from.position.x === conn.to.position.x &&
         conn.from.position.y === conn.to.position.y;
}
```

### Polígonos

```typescript
function isValidPolygon(poly: Polygon): boolean {
  return poly.points.length >= 3; // Mínimo triângulo
}
```

---

## Exemplo Completo

```json
{
  "meta": {
    "id": "tavern-001",
    "name": "The Rusty Dragon",
    "theme": "medieval",
    "atmosphere": "cozy and bustling",
    "resolution": "1024x1024",
    "createdAt": "2026-01-30T15:00:00Z"
  },
  "floors": [
    {
      "id": "floor-0",
      "level": 0,
      "name": "Térreo",
      "spaces": [
        {
          "id": "main-hall",
          "floorId": "floor-0",
          "name": "Salão Principal",
          "description": "O coração da taverna, sempre cheio de viajantes.",
          "visualPrompt": "Medieval tavern main hall with wooden tables, stone fireplace, warm lighting",
          "geometry": { "points": [{"x":0,"y":0},{"x":10,"y":0},{"x":10,"y":8},{"x":0,"y":8}] },
          "zones": [
            {
              "id": "bar-area",
              "name": "Balcão",
              "description": "Onde o taverneiro serve drinks.",
              "visualPrompt": "Rustic wooden bar counter with bottles and mugs",
              "area": { "points": [{"x":8,"y":0},{"x":10,"y":0},{"x":10,"y":3},{"x":8,"y":3}] }
            }
          ],
          "lighting": "bright"
        }
      ],
      "rendered": false
    }
  ],
  "connections": [
    {
      "id": "front-door",
      "type": "door",
      "from": { "spaceId": "main-hall", "position": {"x":5,"y":0} },
      "to": { "spaceId": "exterior", "position": {"x":5,"y":0} },
      "state": "closed",
      "material": "oak"
    }
  ],
  "entities": []
}
```
