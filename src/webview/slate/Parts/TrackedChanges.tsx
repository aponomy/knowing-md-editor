import React from 'react';
import { Descendant } from 'slate';
import { RenderElementProps } from 'slate-react';

export type TrackedChangeElement = {
    type: 'tracked-change';
    changeId: string;
    changeType: 'insertion' | 'deletion';
    userId?: string;
    timestamp?: number;
    children: Descendant[];
};

export const TrackedChangeElementComponent = (props: RenderElementProps & { element: TrackedChangeElement }) => {
    const { attributes, children, element } = props;
    
    const className = element.changeType === 'insertion' 
        ? 'tracked-change-insertion' 
        : 'tracked-change-deletion';
    
    return (
        <span 
            {...attributes} 
            className={className}
            data-change-id={element.changeId}
        >
            {children}
        </span>
    );
};

export function generateChangeId(): string {
    return `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function createTrackedChangeElement(
    changeType: 'insertion' | 'deletion',
    children: Descendant[],
    userId?: string
): TrackedChangeElement {
    return {
        type: 'tracked-change',
        changeId: generateChangeId(),
        changeType,
        userId,
        timestamp: Date.now(),
        children
    };
}

export function isTrackedChangeElement(element: any): element is TrackedChangeElement {
    return element && element.type === 'tracked-change';
}

export function parseTrackedChangeFromMarkdown(markdown: string): TrackedChangeElement | null {
    return null;
}

export function serializeTrackedChange(element: TrackedChangeElement): string {
    const text = element.children.map((child: any) => child.text || '').join('');
    return element.changeType === 'insertion' 
        ? `{++${text}++}` 
        : `{--${text}--}`;
}
