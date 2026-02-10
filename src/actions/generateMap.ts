"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { DungeonMapSchema } from "@/schemas/dungeon";
import { MODEL_IDS } from "@/lib/models";

const SYSTEM_PROMPT = `Você é um mestre arquiteto de dungeons para RPG de mesa.
Sua especialidade é criar estruturas detalhadas de mapas de masmorra.

Regras:
1. Cada floor (andar) deve ter múltiplos spaces (espaços)
2. Cada space precisa de um polygon com pelo menos 4 pontos formando um retângulo ou forma fechada
3. Os pontos do polygon devem formar uma área que faça sentido espacialmente
4. Corredores conectam salas - devem ser mais estreitos (largura ~40-60 unidades)
5. Salas variam de tamanho (100-300 unidades)
6. IDs devem ser únicos no formato: floor-0-room-1, floor-0-corridor-1, etc.
7. O tema influencia a atmosfera e descrições
8. Posicione os spaces de forma que não se sobreponham
9. Connections ligam spaces adjacentes com portas, arcos, escadas, etc.
10. Entities são NPCs, monstros, tesouros ou perigos posicionados nos andares`;

interface GenerateMapOptions {
    prompt: string;
    resolution?: "512x512" | "1024x1024" | "2048x2048";
}

export async function generateMap({ prompt, resolution = "1024x1024" }: GenerateMapOptions) {
    try {
        const result = await generateObject({
            model: google(MODEL_IDS.GEMINI_2_0_FLASH),
            schema: DungeonMapSchema,
            system: SYSTEM_PROMPT,
            prompt: `Crie uma estrutura de dungeon baseada na seguinte descrição:

${prompt}

Resolução alvo: ${resolution}
Escala: 1 unidade = 1 pixel no canvas

Gere uma estrutura JSON completa com floors, spaces, connections e entities.`,
        });

        return {
            success: true,
            data: result.object,
        };
    } catch (error) {
        console.error("[generateMap] Error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erro desconhecido ao gerar mapa",
        };
    }
}
