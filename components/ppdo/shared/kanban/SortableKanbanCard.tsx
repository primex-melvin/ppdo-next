"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { KanbanCard, KanbanCardProps } from "./KanbanCard";

interface SortableKanbanCardProps extends KanbanCardProps {
    id: string;
}

export function SortableKanbanCard({ id, ...props }: SortableKanbanCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <KanbanCard
            innerRef={setNodeRef}
            style={style}
            isDragging={isDragging}
            dragHandleProps={{ ...attributes, ...listeners }}
            {...props}
        />
    );
}
