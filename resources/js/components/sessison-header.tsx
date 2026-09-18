import { Building2, Calendar, Lock, Unlock } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { formatDateDisplay } from '@/lib/date';
import type { DailySession } from '@/types/daily-session';

interface SessionHeaderProps {
    session: DailySession & { zones?: { id: number; name: string }[] };
    zoneName?: string;
}

export function SessionHeader({
    session,
    zoneName: customZoneName,
}: SessionHeaderProps) {
    const zoneName =
        customZoneName || session.zones?.[0]?.name || 'Zone principale';

    return (
        <div className="flex flex-col gap-4 border-b border-neutral-200 pb-3 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
            {/* Left side: Title & Zone info */}
            <div className="space-y-1">
                <h1 className="font-black tracking-tight text-neutral-900 uppercase  dark:text-neutral-100">
                    La Journée
                </h1>

                <p className="flex items-center gap-1.5  font-medium text-neutral-500 dark:text-neutral-400">
                    <Building2 className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500" />
                    <span>Zone:</span>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200 capitalize">
                        {zoneName}
                    </span>
                </p>
            </div>

            {/* Right side: Date badge stacked above status badge */}
            <div className="flex flex-col items-start gap-2 sm:items-end">
                <Badge
                    variant="outline"
                    className="gap-2 border-neutral-200 bg-white px-3 py-1 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900"
                >
                    <Calendar className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500" />
                    <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                        {formatDateDisplay(session.session_date)}
                    </span>
                </Badge>

                {session.status === 'open' ? (
                    <Badge
                        variant="outline"
                        className="gap-1.5 border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700 dark:border-green-800 dark:bg-green-950/50 dark:text-green-400"
                    >
                        <Unlock className="h-3 w-3" /> Ouverte
                    </Badge>
                ) : (
                    <Badge
                        variant="secondary"
                        className="gap-1.5 bg-neutral-200 px-2.5 py-0.5 text-xs font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                    >
                        <Lock className="h-3 w-3" /> Clôturée
                    </Badge>
                )}
            </div>
        </div>
    );
}
