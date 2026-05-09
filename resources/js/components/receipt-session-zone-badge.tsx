import { format } from 'date-fns';
import { Clock, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SessionZone } from '@/types/session-zone';

interface Props {
    sessionZone?: SessionZone | null;
    className?: string;
}

export default function SessionZoneBadge({ sessionZone, className }: Props) {
    if (!sessionZone) {
        return (
            <div className="flex justify-center">
                <span className="text-xs text-slate-400">-</span>
            </div>
        );
    }

    const isOpen = sessionZone.daily_session?.status === 'open';

    return (
        <div className={cn("flex flex-row-reverse items-center justify-center gap-1.5 print:hidden", className)}>
            {/* Badge Date */}
            <Badge
                variant="outline"
                className={cn(
                    'flex items-center gap-1 border px-2 py-0.5 font-bold w-fit ',
                    isOpen
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                )}
            >
                <Clock
                    className={cn(
                        'h-3 w-3 animate-pulse',
                        isOpen ? 'text-emerald-500' : 'text-slate-400'
                    )}
                />
                <span className="text-[10px] tracking-wider uppercase">
                    {sessionZone.daily_session?.session_date
                        ? format(new Date(sessionZone.daily_session.session_date), 'dd/MM/yy')
                        : 'N/A'}
                </span>
            </Badge>

            {/* Badge Zone */}
            <Badge
                variant="outline"
                className="flex items-center gap-1 border border-slate-200 bg-white px-2 py-0.5 font-bold text-slate-600 w-fit shadow-sm"
            >
                <MapPin className="h-3 w-3 text-blue-500 animate-pulse" />
                <span className="text-[10px] tracking-wider uppercase">
                    {sessionZone.zone?.name || 'Inconnue'}
                </span>
            </Badge>
        </div>
    );
}