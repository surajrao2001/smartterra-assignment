import type { Edit } from '../types/edit';

export function getEditTitle(edit: Edit): string {
    if (edit.changes.length === 0) return 'Empty draft';

    const summaries = edit.changes.slice(0, 2).map(c => {
        const el = c.elementId;
        if (c.changeType === 'add') {
            const type = c.after?.type ?? 'element';
            return `Added ${type} ${el}`;
        }
        if (c.changeType === 'delete') return `Removed ${el}`;
        if (c.changeType === 'modify' && c.after) {
            const type = c.after.type ?? 'element';
            if (type === 'valve') return `Valve ${el} setting change`;
            if (type === 'junction') return `${el} elevation correction`;
            if (type === 'reservoir') return `${el} head update`;
            if (type === 'pipe') return `Pipe ${el} update`;
            return `${el} property change`;
        }
        return `${c.changeType} ${el}`;
    });

    return summaries.join(', ');
}
