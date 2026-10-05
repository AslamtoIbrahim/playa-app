import { formatDateDisplay } from '@/lib/date';
import { Sale } from '@/types/sale';
import { SessionZone } from '@/types/session-zone';
import { User, Calendar, Factory } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import SessionZoneBadge from './receipt-session-zone-badge';

interface Props {
    sale: Sale;
    /**
     * Zones de journée couvertes par la vente, déduites des factures d'achat
     * d'origine de ses lignes : une vente n'est rattachée qu'à une journée, donc
     * une seule zone est attendue, mais plusieurs restent possibles.
     */
    sessionZones?: SessionZone[];
}

export function SaleHeader({ sale, sessionZones = [] }: Props) {
    return (
        <div className="flex flex-row items-start justify-between border-b border-slate-100 pb-8 dark:border-slate-800">
            {/* Left Side: Client Info */}
            <div className="space-y-3 text-left">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        {sale.type === 'usine' ? (
                            <Factory className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                        ) : (
                            <User className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                        )}

                        <p className="text-lg font-bold text-slate-900 capitalize dark:text-slate-100">
                            {sale.customer?.name || 'Client Inconnu'}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    {sale.session && (
                        <Badge
                            variant="outline"
                            className={cn(
                                'border-slate-200 text-[10px] text-slate-500 uppercase dark:border-slate-700 dark:text-slate-400',
                                // Ila kant open: l'khdar
                                sale.session.status === 'open' &&
                                    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400',
                                // Ila kant closed: l'orange (ola amber)
                                sale.session.status === 'closed' &&
                                    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-400',
                            )}
                        >
                            <div
                                className={cn(
                                    sale.session.status === 'open'
                                        ? 'bg-emerald-500'
                                        : 'bg-amber-500',
                                    'size-1.5 rounded-full transition-colors',
                                )}
                            />
                            Journée:{' '}
                            {sale.session.status === 'open'
                                ? 'Ouverte'
                                : 'Fermée'}
                        </Badge>
                    )}
                </div>
            </div>

            {/* Center Side: Zones & Session Date */}
            <div className="flex flex-row-reverse flex-wrap items-center justify-center gap-3">
                {sessionZones.length > 0 ? (
                    sessionZones.map((sessionZone) => (
                        <SessionZoneBadge
                            key={sessionZone.id}
                            sessionZone={sessionZone}
                        />
                    ))
                ) : (
                    <SessionZoneBadge sessionZone={null} />
                )}
            </div>

            {/* Right Side: Date & ID */}
            <div className="flex flex-col items-end space-y-2">
                <Badge
                    variant="outline"
                    className="gap-2 border-slate-200 bg-slate-50/50 px-3 py-1.5 text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300"
                >
                    <Calendar className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />

                    <span className="text-xs font-bold">
                        {formatDateDisplay(sale.date)}
                    </span>
                </Badge>
                <Badge
                    variant="secondary"
                    className={
                        sale.type === 'usine'
                            ? 'border-purple-100 bg-purple-50 text-[10px] tracking-wider text-purple-700 uppercase dark:border-purple-800 dark:bg-purple-950/50 dark:text-purple-400'
                            : 'border-blue-100 bg-blue-50 text-[10px] tracking-wider text-blue-700 uppercase dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-400'
                    }
                >
                    {sale.type === 'usine' ? 'Vente Usine' : 'Vente Normale'}
                </Badge>
            </div>
        </div>
    );
}
