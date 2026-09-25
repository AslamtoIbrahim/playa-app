import type { ReactElement } from 'react';

import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

/** Teinte du groupe d'onglets (achat = bleu, vente = orange). */
export type SessionTabHintTone = 'blue' | 'orange';

export interface SessionTabTotalHintProps {
    /** Total de la valeur des éléments de l'onglet. */
    total: number;
    /** Formateur monétaire fourni par la page hôte. */
    formatCurrency: (amount: number) => string;
    /** Teinte du groupe d'onglets. */
    tone?: SessionTabHintTone;
    /** Déclencheur de l'onglet survolé (TabsTrigger). */
    children: ReactElement;
}

const hintToneClass: Record<SessionTabHintTone, string> = {
    blue: 'border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-400',
    orange: 'border-orange-200 text-orange-700 dark:border-orange-800 dark:text-orange-400',
};

const hintArrowClass =
    'bg-white fill-white dark:bg-neutral-900 dark:fill-neutral-900';

/**
 * Petite infobulle claire au survol d'un onglet de session : affiche uniquement
 * le total de la valeur des éléments qu'il contient.
 */
export function SessionTabTotalHint({
    total,
    formatCurrency,
    tone = 'blue',
    children,
}: SessionTabTotalHintProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>{children}</TooltipTrigger>
            <TooltipContent
                side="top"
                className={cn(
                    'border bg-white font-mono text-sm font-bold shadow-lg dark:bg-neutral-900',
                    hintToneClass[tone],
                )}
                arrowClassName={hintArrowClass}
            >
                {formatCurrency(total)}
            </TooltipContent>
        </Tooltip>
    );
}

export default SessionTabTotalHint;
