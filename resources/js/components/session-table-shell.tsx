import type { ReactNode } from 'react';

import { TableCell, TableRow } from '@/components/ui/table';

/*
|--------------------------------------------------------------------------
| Primitives partagées des tableaux de session
|--------------------------------------------------------------------------
*/

export const sessionTableHeaderClass =
    'bg-neutral-50 dark:bg-neutral-950/40 [&_th]:h-11 [&_th]:text-xs [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-neutral-500';

export interface SessionTableShellProps {
    children: ReactNode;
}

export function SessionTableShell({ children }: SessionTableShellProps) {
    return (
        <div className="min-h-72 overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            {children}
        </div>
    );
}

export interface SessionEmptyRowProps {
    colSpan: number;
    children: ReactNode;
}

export function SessionEmptyRow({ colSpan, children }: SessionEmptyRowProps) {
    return (
        <TableRow>
            <TableCell
                colSpan={colSpan}
                className="h-40 text-center text-sm text-neutral-500 dark:text-neutral-400"
            >
                {children}
            </TableCell>
        </TableRow>
    );
}

export default SessionTableShell;
