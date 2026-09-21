import { Head } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

import SessionTotalsCard from '@/components/session-totals-card';
import SessionTransactions from '@/components/session-transactions';
import { SessionHeader } from '@/components/sessison-header';
import { formatDateDisplay } from '@/lib/date';
import type { Attendance } from '@/types/attendance';
import type { DailySession, SessionGroupData } from '@/types/daily-session';
import type { SessionSaleData } from '@/types/sale';

interface Props {
    session: DailySession & { zones?: { id: number; name: string }[] };
    purchaseData: SessionGroupData;
    saleData: SessionSaleData;
    attendances: Attendance[];
    totals: {
        buy: number;
        sell: number;
        margin: number;
    };
}

function SessionShow({
    session,
    purchaseData,
    saleData,
    attendances,
    totals,
}: Props) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'MAD',
        }).format(amount || 0);
    };

    return (
        <div className="flex h-full flex-1 flex-col gap-4 bg-neutral-100 p-4 lg:p-8 dark:bg-neutral-950">
            {/* Top Navigation & Header */}
            <button
                type="button"
                onClick={() => window.history.back()}
                className="inline-flex w-fit cursor-pointer items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="h-4 w-4" /> Retour aux journées
            </button>

            <SessionHeader session={session} />

            <SessionTotalsCard
                totals={totals}
                status={session.status}
                formatCurrency={formatCurrency}
            />

            <Head
                title={`Session du ${formatDateDisplay(session.session_date)}`}
            />

            {/* Main Tabs: Achats & Ventes */}
            <SessionTransactions
                purchaseData={purchaseData}
                saleData={saleData}
                attendances={attendances}
                formatCurrency={formatCurrency}
            />
        </div>
    );
}

export default SessionShow;
