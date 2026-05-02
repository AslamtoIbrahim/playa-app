import { formatDateDisplay } from '@/lib/date';
import { Sale } from '@/types/sale';
import { User, Calendar, Factory, Dot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Props {
    sale: Sale;
}

export function SaleHeader({ sale }: Props) {

    return (
        <div className="flex flex-row items-start justify-between border-b pb-8 border-slate-100">
            {/* Left Side: Client Info */}
            <div className="text-left space-y-3">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        {sale.type === 'usine' ? (
                            <Factory className="h-5 w-5 text-slate-400" />
                        ) : (
                            <User className="h-5 w-5 text-slate-400" />
                        )}

                        <p className="text-lg font-bold text-slate-900 capitalize">
                            {sale.customer?.name || 'Client Inconnu'}
                        </p>
                    </div>

                </div>

                <div className="flex gap-2">
                    {sale.session && (
                        <Badge variant="outline" className={cn("text-[10px] uppercase border-slate-200 text-slate-500",
                            // Ila kant open: l'khdar
                            sale.session.status === 'open' && "bg-emerald-50 text-emerald-700 border-emerald-200",
                            // Ila kant closed: l'orange (ola amber)
                            sale.session.status === 'closed' && "bg-amber-50 text-amber-700 border-amber-200"
                        )}>
                            <div className={cn(sale.session.status === 'open' ? "bg-emerald-500" : "bg-amber-500", "rounded-full size-1.5 transition-colors")} />
                            Journée: {sale.session.status === 'open' ? 'Ouverte' : 'Fermée'}
                        </Badge>
                    )}
                </div>
            </div>

            {/* Right Side: Date & ID */}
            <div className="flex flex-col items-end space-y-2">
                <Badge variant="outline" className="bg-slate-50/50 text-slate-600 border-slate-200 gap-2 px-3 py-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />

                    <span className="text-xs font-bold">
                        {formatDateDisplay(sale.date)}
                    </span>
                </Badge>
                <Badge
                    variant="secondary"
                    className={
                        sale.type === 'usine'
                            ? "bg-purple-50 text-purple-700 border-purple-100 uppercase text-[10px] tracking-wider"
                            : "bg-blue-50 text-blue-700 border-blue-100 uppercase text-[10px] tracking-wider"
                    }
                >
                    {sale.type === 'usine' ? 'Vente Usine' : 'Vente Normale'}
                </Badge>
            </div>
        </div>
    );
}