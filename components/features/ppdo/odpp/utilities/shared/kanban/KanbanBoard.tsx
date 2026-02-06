"use client";

import React, { useState, useCallback } from "react";
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
    defaultDropAnimationSideEffects,
    DropAnimation,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { KanbanColumn } from "./KanbanColumn";
import { SortableKanbanCard } from "./SortableKanbanCard";
import { KanbanCard, KanbanCardData, KanbanCardProps } from "./KanbanCard";
import { createPortal } from "react-dom";

// Configuration for drop animation
const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: {
                opacity: "0.5",
            },
        },
    }),
};

export interface KanbanBoardColumn {
    id: string;
    title: string;
    color?: string;
}

export interface KanbanBoardProps {
    columns: KanbanBoardColumn[];
    data: Record<string, KanbanCardData[]>;
    onStatusChange: (itemId: string, newStatus: string, newIndex: number) => void;
    renderCardActions?: (item: KanbanCardData) => KanbanCardProps["actions"];
    visibleStatuses?: Set<string>;
}

export function KanbanBoard({
    columns,
    data,
    onStatusChange,
    renderCardActions,
    visibleStatuses,
}: KanbanBoardProps) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeItem, setActiveItem] = useState<KanbanCardData | null>(null);

    // Filter visible columns
    const visibleColumns = React.useMemo(() => {
        if (!visibleStatuses) return columns;
        return columns.filter(col => visibleStatuses.has(col.id));
    }, [columns, visibleStatuses]);

    const visibleColumnIds = React.useMemo(() => visibleColumns.map(c => c.id), [visibleColumns]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Prevent accidental drags
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const findContainer = (id: string): string | undefined => {
        if (id in data) {
            return id;
        }

        return Object.keys(data).find((key) =>
            data[key].find((item) => item.id === id)
        );
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const id = active.id as string;
        setActiveId(id);

        // Find the item object
        const container = findContainer(id);
        if (container) {
            const item = data[container].find(i => i.id === id);
            setActiveItem(item || null);
        }
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        const overId = over?.id;

        if (!overId || active.id === overId) {
            return;
        }

        // Logic handled by onStatusChange (usually updating parent state optimistically) OR 
        // strictly handled in DragEnd for simpler implementation if we don't need live re-sorting feedback.
        // However, dnd-kit usually recommends updating state on drag over for sortable lists.
        // For now, we will rely on onDragEnd to trigger the status change logic to keep it simpler 
        // unless visual glitching occurs.
        // Actually, without onDragOver updates, the item won't "move" to the new column visually until drop.
        // But implementing full local state management here is complex if `data` is passed from parent Props.
        // We will assume the PARENT manages the state and we call `onStatusChange`?
        // NO, React functional component pattern: Props in, Actions out.
        // If we want smooth drag over, we might need a local intermediate state or the parent needs to handle "move" events fast.

        // Strategy: Visuals are handled by `DragOverlay`. Sorting placeholders are handled by dnd-kit `SortableContext`.
        // If we don't update items during drag, the placeholder won't appear in the new column.
        // We will stick to `DragEnd` for the Actual implementation update to avoid thrashing the DB/API.
        // BUT for UI, we might need local state.
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        const activeId = active.id as string;
        const overId = over?.id as string;

        if (!overId) {
            setActiveId(null);
            setActiveItem(null);
            return;
        }

        const activeContainer = findContainer(activeId);
        let overContainer = findContainer(overId);

        if (!overContainer) {
            // It might be a column ID directly if dropping on empty container content
            if (data[overId]) { // It's a column key
                overContainer = overId;
            } else {
                // Should not happen given our setup
                setActiveId(null);
                setActiveItem(null);
                return;
            }
        }

        if (activeContainer && overContainer) {
            // Calculate new index
            const activeIndex = data[activeContainer].findIndex(i => i.id === activeId);
            let overIndex;

            if (overId === overContainer) {
                // Dropped on the column container
                overIndex = data[overContainer].length + 1;
            } else {
                // Dropped on an item
                overIndex = data[overContainer].findIndex(i => i.id === overId);
                // If moving down in same container, adjust
                // But wait, arrayMove handles indices.
                // If moving to different container:
                const isBelowOverItem =
                    over &&
                    active.rect.current.translated &&
                    active.rect.current.translated.top >
                    over.rect.top + over.rect.height;

                const modifier = isBelowOverItem ? 1 : 0;
                overIndex = overIndex >= 0 ? overIndex + modifier : data[overContainer].length + 1;
            }

            // Trigger change
            if (activeContainer !== overContainer || activeIndex !== overIndex) {
                onStatusChange(activeId, overContainer, overIndex);
            }
        }

        setActiveId(null);
        setActiveItem(null);
    };

    const totalItemsCount = React.useMemo(() => {
        return Object.values(data).reduce((acc, items) => acc + items.length, 0);
    }, [data]);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex h-auto max-h-[calc(100vh-220px)] min-h-[300px] gap-4 overflow-x-auto pb-4 px-1 kanban-scroll">
                {visibleColumns.map((col) => (
                    <KanbanColumn
                        key={col.id}
                        id={col.id}
                        title={col.title}
                        count={data[col.id]?.length || 0}
                        totalCount={totalItemsCount}
                        itemIds={data[col.id]?.map(i => i.id) || []}
                        color={col.color}
                    >
                        {data[col.id]?.map((item) => (
                            <SortableKanbanCard
                                key={item.id}
                                id={item.id}
                                data={item}
                                actions={renderCardActions?.(item)}
                            />
                        ))}
                    </KanbanColumn>
                ))}
            </div>

            {/* Portal Drag Overlay for generic usage */}
            {typeof document !== 'undefined' && createPortal(
                <DragOverlay dropAnimation={dropAnimation}>
                    {activeItem ? (
                        <KanbanCard
                            data={activeItem}
                            actions={renderCardActions?.(activeItem)}
                            isOverlay
                        />
                    ) : null}
                </DragOverlay>,
                document.body
            )}
        </DndContext>
    );
}
