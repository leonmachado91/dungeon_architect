"use client";

import { useState } from "react";
import { useMapStore } from "@/stores";
import { MaterialIcon } from "@/components/icons/MaterialIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { Space, Entity, SpaceType, Lighting } from "@/types";

// === Space Inspector ===

interface SpaceInspectorProps {
    space: Space;
}

function SpaceInspector({ space }: SpaceInspectorProps) {
    const updateSpace = useMapStore((state) => state.updateSpace);
    const removeSpace = useMapStore((state) => state.removeSpace);
    const duplicateSpace = useMapStore((state) => state.duplicateSpace);
    const selectSpace = useMapStore((state) => state.selectSpace);

    // Use space.id as key to reset form state when space changes (React pattern)
    const [name, setName] = useState(space.name);
    const [visualPrompt, setVisualPrompt] = useState(space.visualPrompt);
    const [staticObjects, setStaticObjects] = useState(space.staticObjects || "");
    const [notes, setNotes] = useState(space.notes || "");

    const handleBlur = (field: keyof Space, value: string) => {
        updateSpace(space.id, { [field]: value });
    };

    const handleSelectChange = (field: keyof Space, value: string) => {
        updateSpace(space.id, { [field]: value });
    };

    const handleDelete = () => {
        removeSpace(space.id);
        selectSpace(null);
    };

    const handleDuplicate = () => {
        duplicateSpace(space.id);
    };

    // Calculate approximate dimensions from polygon
    const bounds = space.geometry.points.reduce(
        (acc, p) => ({
            minX: Math.min(acc.minX, p.x),
            maxX: Math.max(acc.maxX, p.x),
            minY: Math.min(acc.minY, p.y),
            maxY: Math.max(acc.maxY, p.y),
        }),
        { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
    );
    const width = Math.round(bounds.maxX - bounds.minX);
    const height = Math.round(bounds.maxY - bounds.minY);

    return (
        <div className="space-y-4">
            {/* Selected Item Card */}
            <div className="rounded-lg border border-[var(--red)]/40 bg-[var(--bg-soft)] p-3">
                <div className="flex items-center gap-2">
                    <MaterialIcon name="meeting_room" className="text-[var(--yellow)]" />
                    <div>
                        <div className="text-xs uppercase tracking-wider text-[var(--fg-alt)]">
                            SELECIONADO
                        </div>
                        <div className="font-[Crimson_Text] text-lg text-[var(--fg)]">
                            {space.name}
                        </div>
                    </div>
                </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-3">
                <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--yellow)]">
                        Nome
                    </label>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={() => handleBlur("name", name)}
                        className="bg-[var(--bg-hard)] border-[var(--gray)]/30 focus:border-[var(--yellow)]"
                    />
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--fg-alt)]">
                            Largura
                        </label>
                        <Input
                            value={width}
                            disabled
                            className="bg-[var(--bg-hard)] border-[var(--gray)]/30 opacity-60"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--fg-alt)]">
                            Altura
                        </label>
                        <Input
                            value={height}
                            disabled
                            className="bg-[var(--bg-hard)] border-[var(--gray)]/30 opacity-60"
                        />
                    </div>
                </div>

                <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--yellow)]">
                        Tipo de Espaço
                    </label>
                    <Select
                        value={space.spaceType}
                        onValueChange={(v) => handleSelectChange("spaceType", v as SpaceType)}
                    >
                        <SelectTrigger className="bg-[var(--bg-hard)] border-[var(--gray)]/30">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="room">Sala</SelectItem>
                            <SelectItem value="corridor">Corredor</SelectItem>
                            <SelectItem value="stairs">Escadas</SelectItem>
                            <SelectItem value="outdoor">Externo</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--yellow)]">
                        Iluminação
                    </label>
                    <Select
                        value={space.lighting}
                        onValueChange={(v) => handleSelectChange("lighting", v as Lighting)}
                    >
                        <SelectTrigger className="bg-[var(--bg-hard)] border-[var(--gray)]/30">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="dark">Escuro</SelectItem>
                            <SelectItem value="dim">Penumbra</SelectItem>
                            <SelectItem value="bright">Iluminado</SelectItem>
                            <SelectItem value="magical">Mágico</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--yellow)]">
                        Tipo de Piso
                    </label>
                    <Select
                        value={space.floorType || "stone"}
                        onValueChange={(v) => handleSelectChange("floorType", v)}
                    >
                        <SelectTrigger className="bg-[var(--bg-hard)] border-[var(--gray)]/30">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="stone">Pedra</SelectItem>
                            <SelectItem value="wood">Madeira</SelectItem>
                            <SelectItem value="dirt">Terra</SelectItem>
                            <SelectItem value="water">Água</SelectItem>
                            <SelectItem value="grass">Grama</SelectItem>
                            <SelectItem value="marble">Mármore</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--yellow)]">
                        Descrição Visual (para render)
                    </label>
                    <textarea
                        value={visualPrompt}
                        onChange={(e) => setVisualPrompt(e.target.value)}
                        onBlur={() => handleBlur("visualPrompt", visualPrompt)}
                        rows={3}
                        className="w-full rounded-md border border-[var(--gray)]/30 bg-[var(--bg-hard)] px-3 py-2 text-sm text-[var(--fg)] focus:border-[var(--yellow)] focus:outline-none"
                        placeholder="Descrição detalhada para a AI renderizar..."
                    />
                </div>

                <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--yellow)]">
                        Objetos Estáticos
                    </label>
                    <Input
                        value={staticObjects}
                        onChange={(e) => setStaticObjects(e.target.value)}
                        onBlur={() => handleBlur("staticObjects", staticObjects)}
                        className="bg-[var(--bg-hard)] border-[var(--gray)]/30 focus:border-[var(--yellow)]"
                        placeholder="Mesa, cadeiras, baú..."
                    />
                </div>

                <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--fg-alt)]">
                        Imagem de Referência (URL)
                    </label>
                    <Input
                        value={space.coverImage || ""}
                        onChange={(e) => updateSpace(space.id, { coverImage: e.target.value })}
                        className="bg-[var(--bg-hard)] border-[var(--gray)]/30 focus:border-[var(--yellow)] text-xs"
                        placeholder="https://..."
                    />
                </div>

                <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--fg-alt)]">
                        Notas do Mestre (não vai pro render)
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        onBlur={() => handleBlur("notes", notes)}
                        rows={2}
                        className="w-full rounded-md border border-[var(--gray)]/30 bg-[var(--bg-hard)] px-3 py-2 text-sm text-[var(--fg)] focus:border-[var(--yellow)] focus:outline-none"
                        placeholder="Anotações pessoais..."
                    />
                </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
                <Button
                    variant="outline"
                    onClick={handleDelete}
                    className="border-[var(--gray)]/30 hover:border-[var(--red)] hover:bg-[var(--red)]/10 hover:text-[var(--red-light)]"
                >
                    <MaterialIcon name="delete" size="sm" />
                    Excluir
                </Button>
                <Button
                    variant="outline"
                    onClick={handleDuplicate}
                    className="border-[var(--gray)]/30 hover:border-[var(--teal)] hover:bg-[var(--teal)]/10 hover:text-[var(--teal-light)]"
                >
                    <MaterialIcon name="content_copy" size="sm" />
                    Duplicar
                </Button>
            </div>
        </div>
    );
}

// === Icon Picker Component ===

const ENTITY_ICONS = [
    "person", "smart_toy", "bug_report", "warning",
    "paid", "inventory_2", "vpn_key", "lock",
    "science", "auto_awesome", "local_fire_department", "water_drop",
    "forest", "castle", "cottage", "church",
    "fort", "temple_buddhist", "bedroom_parent", "chair",
    "table_restaurant", "local_bar", "menu_book", "import_contacts"
];

interface IconPickerProps {
    value: string;
    onChange: (icon: string) => void;
}

function IconPicker({ value, onChange }: IconPickerProps) {
    return (
        <div className="grid grid-cols-6 gap-2 p-2 bg-[var(--bg-hard)] border border-[var(--gray)]/20 rounded max-h-32 overflow-y-auto">
            {ENTITY_ICONS.map((icon) => (
                <button
                    key={icon}
                    onClick={() => onChange(icon)}
                    className={`p-1.5 rounded flex items-center justify-center transition-colors ${value === icon
                        ? "bg-[var(--teal)] text-[var(--bg)]"
                        : "text-[var(--fg-alt)] hover:bg-[var(--bg-soft)] hover:text-[var(--fg)]"
                        }`}
                    title={icon}
                >
                    <MaterialIcon name={icon} size="sm" />
                </button>
            ))}
        </div>
    );
}

// === Entity Inspector ===

interface EntityInspectorProps {
    entity: Entity;
}

function EntityInspector({ entity }: EntityInspectorProps) {
    const updateEntity = useMapStore((state) => state.updateEntity);
    const removeEntity = useMapStore((state) => state.removeEntity);
    const duplicateEntity = useMapStore((state) => state.duplicateEntity);
    const selectEntity = useMapStore((state) => state.selectEntity);
    const dungeon = useMapStore((state) => state.dungeon);

    const [name, setName] = useState(entity.name);
    const [description, setDescription] = useState(entity.description);
    const [coverImage, setCoverImage] = useState(entity.coverImage || "");
    const [newPropKey, setNewPropKey] = useState("");
    const [newPropValue, setNewPropValue] = useState("");

    const handleBlur = (field: keyof Entity, value: string) => {
        updateEntity(entity.id, { [field]: value });
    };

    const handleSelectChange = (field: keyof Entity, value: string) => {
        updateEntity(entity.id, { [field]: value } as Partial<Entity>);
    };

    const handleDelete = () => {
        removeEntity(entity.id);
        selectEntity(null);
    };

    const handleDuplicate = () => {
        duplicateEntity(entity.id);
    };

    // Properties Management
    const handleAddProperty = () => {
        if (!newPropKey.trim()) return;
        const currentProps = entity.properties || {};
        updateEntity(entity.id, {
            properties: {
                ...currentProps,
                [newPropKey.trim()]: newPropValue
            }
        });
        setNewPropKey("");
        setNewPropValue("");
    };

    const handleRemoveProperty = (key: string) => {
        if (!entity.properties) return;
        const newProps = { ...entity.properties };
        delete newProps[key];
        updateEntity(entity.id, { properties: newProps });
    };

    return (
        <div className="space-y-4">
            {/* Selected Item Card */}
            <div className="rounded-lg border border-[var(--red)]/40 bg-[var(--bg-soft)] p-3">
                <div className="flex items-center gap-2">
                    <MaterialIcon name={entity.icon || "token"} className="text-[var(--teal)]" />
                    <div className="flex-1 min-w-0">
                        <div className="text-xs uppercase tracking-wider text-[var(--fg-alt)]">
                            ENTIDADE
                        </div>
                        <div className="font-[Crimson_Text] text-lg text-[var(--fg)] truncate">
                            {entity.name}
                        </div>
                    </div>
                </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-3">
                {/* Basic Info */}
                <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--yellow)]">
                        Nome
                    </label>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={() => handleBlur("name", name)}
                        className="bg-[var(--bg-hard)] border-[var(--gray)]/30 focus:border-[var(--yellow)]"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--yellow)]">
                        Tipo
                    </label>
                    <Select
                        value={entity.type}
                        onValueChange={(v) => handleSelectChange("type", v)}
                    >
                        <SelectTrigger className="bg-[var(--bg-hard)] border-[var(--gray)]/30">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="npc">NPC</SelectItem>
                            <SelectItem value="monster">Monstro</SelectItem>
                            <SelectItem value="treasure">Tesouro</SelectItem>
                            <SelectItem value="hazard">Perigo</SelectItem>
                            <SelectItem value="interactive">Interativo / Mecanismo</SelectItem>
                            <SelectItem value="furniture">Mobília / Props</SelectItem>
                            <SelectItem value="door">Porta</SelectItem>
                            <SelectItem value="window">Janela</SelectItem>
                            <SelectItem value="stairs">Escada</SelectItem>
                            <SelectItem value="wall_feature">Detalhe de Parede</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Icon Selector */}
                <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--yellow)]">
                        Ícone
                    </label>
                    <IconPicker
                        value={entity.icon || "token"}
                        onChange={(icon) => updateEntity(entity.id, { icon })}
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--yellow)]">
                        Descrição Visual
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        onBlur={() => handleBlur("description", description)}
                        rows={3}
                        className="w-full rounded-md border border-[var(--gray)]/30 bg-[var(--bg-hard)] px-3 py-2 text-sm text-[var(--fg)] focus:border-[var(--yellow)] focus:outline-none"
                        placeholder="Descrição da entidade para o render..."
                    />
                </div>

                {/* Cover Image */}
                <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--fg-alt)]">
                        Imagem de Referência (URL)
                    </label>
                    <Input
                        value={coverImage}
                        onChange={(e) => setCoverImage(e.target.value)}
                        onBlur={() => handleBlur("coverImage", coverImage)}
                        className="bg-[var(--bg-hard)] border-[var(--gray)]/30 focus:border-[var(--yellow)] text-xs"
                        placeholder="https://..."
                    />
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--fg-alt)]">
                            Posição X
                        </label>
                        <Input
                            value={Math.round(entity.position.x)}
                            disabled
                            className="bg-[var(--bg-hard)] border-[var(--gray)]/30 opacity-60"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--fg-alt)]">
                            Posição Y
                        </label>
                        <Input
                            value={Math.round(entity.position.y)}
                            disabled
                            className="bg-[var(--bg-hard)] border-[var(--gray)]/30 opacity-60"
                        />
                    </div>
                </div>

                {/* Linked Floor for stairs/interactive */}
                {(entity.type === "interactive" || entity.type === "hazard") && dungeon && (
                    <div className="pt-2 border-t border-[var(--gray)]/10">
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--teal)]">
                            Conexão entre Andares
                        </label>
                        <Select
                            value={entity.linkedFloorId || "__none__"}
                            onValueChange={(v) => handleSelectChange("linkedFloorId", v === "__none__" ? "" : v)}
                        >
                            <SelectTrigger className="bg-[var(--bg-hard)] border-[var(--gray)]/30">
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__none__">Nenhum</SelectItem>
                                {dungeon.floors
                                    .filter((f) => f.id !== entity.floorId)
                                    .map((floor) => (
                                        <SelectItem key={floor.id} value={floor.id}>
                                            {floor.name} (Nível {floor.level})
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Custom Properties */}
                <div className="pt-2 border-t border-[var(--gray)]/10">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--teal)]">
                        Propriedades Customizadas
                    </label>

                    <div className="space-y-2 mb-2">
                        {Object.entries(entity.properties || {}).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-1 bg-[var(--bg-hard)] p-1.5 rounded border border-[var(--gray)]/20">
                                <div className="flex-1 min-w-0">
                                    <div className="text-[10px] uppercase text-[var(--fg-alt)]">{key}</div>
                                    <div className="text-xs text-[var(--fg)] truncate" title={value}>{value}</div>
                                </div>
                                <button
                                    onClick={() => handleRemoveProperty(key)}
                                    className="p-1 text-[var(--red)] hover:bg-[var(--red)]/10 rounded"
                                >
                                    <MaterialIcon name="close" size="sm" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-[1fr,1fr,auto] gap-1">
                        <Input
                            value={newPropKey}
                            onChange={(e) => setNewPropKey(e.target.value)}
                            placeholder="Chave"
                            className="h-8 text-xs bg-[var(--bg-hard)]"
                        />
                        <Input
                            value={newPropValue}
                            onChange={(e) => setNewPropValue(e.target.value)}
                            placeholder="Valor"
                            className="h-8 text-xs bg-[var(--bg-hard)]"
                        />
                        <Button
                            onClick={handleAddProperty}
                            disabled={!newPropKey.trim()}
                            size="sm"
                            className="h-8 w-8 p-0 bg-[var(--teal)] hover:bg-[var(--teal)]/80 text-[var(--bg)]"
                        >
                            <MaterialIcon name="add" size="sm" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--gray)]/10">
                <Button
                    variant="outline"
                    onClick={handleDelete}
                    className="border-[var(--gray)]/30 hover:border-[var(--red)] hover:bg-[var(--red)]/10 hover:text-[var(--red-light)] text-xs h-9"
                >
                    <MaterialIcon name="delete" size="sm" className="mr-1" />
                    Excluir
                </Button>
                <Button
                    variant="outline"
                    onClick={handleDuplicate}
                    className="border-[var(--gray)]/30 hover:border-[var(--teal)] hover:bg-[var(--teal)]/10 hover:text-[var(--teal-light)] text-xs h-9"
                >
                    <MaterialIcon name="content_copy" size="sm" className="mr-1" />
                    Duplicar
                </Button>
            </div>
        </div>
    );
}

// === Main Inspector Panel ===

export function InspectorPanel() {
    const selectedSpaceId = useMapStore((state) => state.selectedSpaceId);
    const selectedEntityId = useMapStore((state) => state.selectedEntityId);
    const dungeon = useMapStore((state) => state.dungeon);

    // Find selected space
    const selectedSpace = dungeon?.floors
        .flatMap((f) => f.spaces)
        .find((s) => s.id === selectedSpaceId);

    // Find selected entity
    const selectedEntity = dungeon?.entities.find((e) => e.id === selectedEntityId);

    // Nothing selected
    if (!selectedSpace && !selectedEntity) {
        return (
            <div className="flex h-full flex-col items-center justify-center p-4 text-center">
                <MaterialIcon
                    name="touch_app"
                    size="lg"
                    className="mb-2 text-[var(--gray)]/40"
                />
                <p className="font-[Crimson_Text] italic text-[var(--gray)]">
                    Selecione um elemento no canvas para editar...
                </p>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto p-4">
            <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--yellow)]">
                <MaterialIcon name="manage_search" size="sm" />
                INSPETOR
            </h2>

            {/* Use key to reset form state when selection changes */}
            {selectedSpace && <SpaceInspector key={selectedSpace.id} space={selectedSpace} />}
            {selectedEntity && <EntityInspector key={selectedEntity.id} entity={selectedEntity} />}
        </div>
    );
}
