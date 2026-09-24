import { Head, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

import { sessions } from '@/routes';

import SessionTotalsCard from '@/components/session-totals-card';
import type { SessionTotals } from '@/components/session-totals-card';
import SessionTransactions from '@/components/session-transactions';
import type { SessionAttendanceAddContextInput } from '@/components/session-attendances-table';
import type { SessionInvoiceAddContextInput } from '@/components/session-invoices-table';
import type { SessionReceiptAddContextInput } from '@/components/session-receipts-table';
import { SessionHeader } from '@/components/sessison-header';
import { formatDateDisplay } from '@/lib/date';
import type { Attendance } from '@/types/attendance';
import type { Boat } from '@/types/boat';
import type { Caution } from '@/types/caution';
import type { Customer } from '@/types/customer';
import type { DailySession, SessionGroupData } from '@/types/daily-session';
import type { Billable } from '@/types/invoice';
import type { OfficeRoom } from '@/types/office-room';
import type { SessionSaleData } from '@/types/sale';
import type { SessionZone } from '@/types/session-zone';

interface Props {
    session: DailySession & { zones?: { id: number; name: string }[] };
    purchaseData: SessionGroupData;
    saleData: SessionSaleData;
    attendances: Attendance[];
    totals: SessionTotals;
    /** Données nécessaires au dialogue de création de facture (compte, bureau, caution). */
    billables: Billable[];
    officeRooms: OfficeRoom[];
    cautions: Caution[];
    sessionZones: SessionZone[];
    /** Données nécessaires au dialogue de création de bon de réception (client, bateau). */
    customers: Customer[];
    boats: Boat[];
}

function SessionShow({
    session,
    purchaseData,
    saleData,
    attendances,
    totals,
    billables,
    officeRooms,
    cautions,
    sessionZones,
    customers,
    boats,
}: Props) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'MAD',
        }).format(amount || 0);
    };

    // La session, la zone et la date sont déjà connues : le dialogue de création
    // se limite donc au compte et au bureau. Le même contexte alimente les
    // actions de ligne (modifier / archiver).
    const invoiceContext: SessionInvoiceAddContextInput = {
        sessionDate: session.session_date,
        sessionStatus: session.status,
        sessionZones,
        billables,
        officeRooms,
        cautions,
    };

    // Contexte des bons de réception : la session, la zone et la date étant
    // déjà connues, seuls le client et le bateau restent à saisir.
    const receiptContext: SessionReceiptAddContextInput = {
        sessionId: session.id,
        sessionDate: session.session_date,
        sessionStatus: session.status,
        sessionZones,
        customers,
        boats,
    };

    // Contexte des feuilles de pointage : la journée et ses zones étant déjà
    // connues, la création ouvre directement la feuille pour pointer.
    const attendanceContext: SessionAttendanceAddContextInput = {
        sessionId: session.id,
        sessionDate: session.session_date,
        sessionStatus: session.status,
        sessionZones,
    };

    return (
        <div className="flex h-full flex-1 flex-col gap-4 bg-neutral-100 p-4 lg:p-8 dark:bg-neutral-950">
            {/* Top Navigation & Header */}
            <button
                type="button"
                onClick={() => router.visit(sessions())}
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
                invoiceContext={invoiceContext}
                receiptContext={receiptContext}
                attendanceContext={attendanceContext}
            />
        </div>
    );
}

export default SessionShow;
