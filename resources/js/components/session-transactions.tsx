import { router } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { show as showInvoice } from '@/routes/invoices';
import type { Attendance } from '@/types/attendance';
import type { SessionGroupData } from '@/types/daily-session';
import type { Difference } from '@/types/difference';
import type { Invoice } from '@/types/invoice';
import type { Receipt } from '@/types/receipt';
import type { Sale } from '@/types/sale';

type PurchaseData = SessionGroupData;

type SaleData = SessionGroupData & {
    sales?: Sale[];
};

interface SessionTransactionsProps {
    purchaseData: PurchaseData;
    saleData: SaleData;
    attendances: Attendance[];
    totals: {
        buy: number;
        sell: number;
    };
    formatCurrency: (amount: number) => string;
}

interface EmptyRowProps {
    colSpan: number;
    children: ReactNode;
}

function EmptyRow({ colSpan, children }: EmptyRowProps) {
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

function TableShell({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-72 overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            {children}
        </div>
    );
}

const tableHeaderClass =
    'bg-neutral-50 dark:bg-neutral-950/40 [&_th]:h-11 [&_th]:text-xs [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-neutral-500';

/*
|--------------------------------------------------------------------------
| Tables partagées (Factures / Réceptions / Différences)
|--------------------------------------------------------------------------
*/

function InvoicesTable({
    invoices,
    formatCurrency,
    emptyMessage,
}: {
    invoices: Invoice[];
    formatCurrency: (amount: number) => string;
    emptyMessage: string;
}) {
    const handleRowClick = (invoiceId: number): void => {
        router.visit(showInvoice.url(invoiceId));
    };

    return (
        <TableShell>
            <Table>
                <TableHeader className={tableHeaderClass}>
                    <TableRow>
                        <TableHead>ID / N°</TableHead>
                        <TableHead>Client / Fournisseur</TableHead>
                        <TableHead>Caution</TableHead>

                        <TableHead className="text-center">NC</TableHead>

                        <TableHead className="text-right">Montant</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {invoices.length > 0 ? (
                        invoices.map((invoice) => (
                            <TableRow
                                key={invoice.id}
                                onClick={() => {
                                    handleRowClick(invoice.id);
                                }}
                                className="cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
                            >
                                <TableCell className="font-medium">
                                    {invoice.invoice_number
                                        ? `#${invoice.invoice_number}`
                                        : `#${invoice.id}`}
                                </TableCell>

                                <TableCell className="text-neutral-600 dark:text-neutral-300">
                                    {invoice.billable?.name || '—'}
                                </TableCell>

                                <TableCell>
                                    {invoice.caution ? (
                                        <div className="flex w-fit items-center gap-1.5 rounded-md border border-indigo-100 bg-indigo-50/50 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-400">
                                            <ShieldCheck className="h-3 w-3 text-indigo-500 dark:text-indigo-400" />

                                            <span className="max-w-30 truncate">
                                                {invoice.caution.name}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-neutral-300 dark:text-neutral-600">
                                            Aucune
                                        </span>
                                    )}
                                </TableCell>

                                <TableCell className="text-center font-bold text-neutral-700 dark:text-neutral-300">
                                    {invoice.boxes || 0}
                                </TableCell>

                                <TableCell className="text-right font-mono font-semibold">
                                    {formatCurrency(invoice.amount)}
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <EmptyRow colSpan={5}>{emptyMessage}</EmptyRow>
                    )}
                </TableBody>
            </Table>
        </TableShell>
    );
}

function ReceiptsTable({
    receipts,
    formatCurrency,
    emptyMessage,
}: {
    receipts: Receipt[];
    formatCurrency: (amount: number) => string;
    emptyMessage: string;
}) {
    return (
        <TableShell>
            <Table>
                <TableHeader className={tableHeaderClass}>
                    <TableRow>
                        <TableHead>Bon N°</TableHead>
                        <TableHead>Bateau / Fournisseur</TableHead>

                        <TableHead className="text-right">
                            Montant total
                        </TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {receipts.length > 0 ? (
                        receipts.map((receipt) => (
                            <TableRow key={receipt.id}>
                                <TableCell className="font-medium">
                                    #{receipt.id}
                                </TableCell>

                                <TableCell className="text-neutral-600 dark:text-neutral-300">
                                    {receipt.boat?.name ||
                                        receipt.customer?.name ||
                                        '—'}
                                </TableCell>

                                <TableCell className="text-right font-mono font-semibold">
                                    {formatCurrency(receipt.total_amount)}
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <EmptyRow colSpan={3}>{emptyMessage}</EmptyRow>
                    )}
                </TableBody>
            </Table>
        </TableShell>
    );
}

function DifferencesTable({
    differences,
    formatCurrency,
    emptyMessage,
}: {
    differences: Difference[];
    formatCurrency: (amount: number) => string;
    emptyMessage: string;
}) {
    return (
        <TableShell>
            <Table>
                <TableHeader className={tableHeaderClass}>
                    <TableRow>
                        <TableHead>Facture / Ligne</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Article</TableHead>

                        <TableHead className="text-right">Qté</TableHead>
                        <TableHead className="text-right">Prix réel</TableHead>
                        <TableHead className="text-right">Écart</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {differences.length > 0 ? (
                        differences.map((difference) => (
                            <TableRow key={difference.id}>
                                <TableCell className="font-medium">
                                    {difference.invoice_item?.invoice
                                        ?.invoice_number
                                        ? `#${difference.invoice_item.invoice.invoice_number}`
                                        : `#${difference.invoice_item_id ?? difference.id}`}
                                </TableCell>

                                <TableCell className="text-neutral-600 dark:text-neutral-300">
                                    {difference.customer?.name || '—'}
                                </TableCell>

                                <TableCell className="text-neutral-600 dark:text-neutral-300">
                                    {difference.item?.name || '—'}
                                </TableCell>

                                <TableCell className="text-right font-mono">
                                    {difference.unit_count}
                                </TableCell>

                                <TableCell className="text-right font-mono">
                                    {formatCurrency(difference.real_price)}
                                </TableCell>

                                <TableCell className="text-right font-mono font-semibold">
                                    {formatCurrency(difference.total_diff)}
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <EmptyRow colSpan={6}>{emptyMessage}</EmptyRow>
                    )}
                </TableBody>
            </Table>
        </TableShell>
    );
}

/*
|--------------------------------------------------------------------------
| Achats
|--------------------------------------------------------------------------
*/

interface PurchasesTabsProps {
    purchaseData: PurchaseData;
    attendances: Attendance[];
    formatCurrency: (amount: number) => string;
}

function PurchasesTabs({
    purchaseData,
    attendances,
    formatCurrency,
}: PurchasesTabsProps) {
    const purchaseSubTabClass = cn(
        'h-10 cursor-pointer rounded-lg border border-transparent px-4 text-sm font-medium',
        'bg-transparent text-neutral-500 shadow-none transition-colors',
        'hover:bg-blue-50 hover:text-blue-700',
        'data-[state=active]:border-blue-500',
        'data-[state=active]:bg-blue-50',
        'data-[state=active]:text-blue-700',
        'data-[state=active]:shadow-none',
        'dark:text-neutral-400',
        'dark:hover:bg-blue-500/10',
        'dark:hover:text-blue-400',
        'dark:data-[state=active]:border-blue-500',
        'dark:data-[state=active]:bg-blue-500/10',
        'dark:data-[state=active]:text-blue-400',
    );

    return (
        <Tabs defaultValue="factures" className="flex w-full flex-col gap-6">
            {/* Achats sub-tabs */}
            <div className="mb-5 overflow-x-auto">
                <TabsList className="flex h-auto w-full min-w-max justify-between gap-2 bg-transparent p-0">
                    <TabsTrigger
                        value="factures"
                        className={purchaseSubTabClass}
                    >
                        Factures
                        <span className="ml-2 text-xs opacity-70">
                            {purchaseData.invoices.length}
                        </span>
                    </TabsTrigger>

                    <TabsTrigger
                        value="receipts"
                        className={purchaseSubTabClass}
                    >
                        Réceptions
                        <span className="ml-2 text-xs opacity-70">
                            {purchaseData.receipts.length}
                        </span>
                    </TabsTrigger>

                    <TabsTrigger
                        value="differences"
                        className={purchaseSubTabClass}
                    >
                        Différences
                        <span className="ml-2 text-xs opacity-70">
                            {purchaseData.differences?.length ?? 0}
                        </span>
                    </TabsTrigger>

                    <TabsTrigger
                        value="ouvriers"
                        className={purchaseSubTabClass}
                    >
                        Ouvriers
                        <span className="ml-2 text-xs opacity-70">
                            {attendances.length}
                        </span>
                    </TabsTrigger>

                    <TabsTrigger
                        value="charges"
                        className={purchaseSubTabClass}
                    >
                        Charges
                        <span className="ml-2 text-xs opacity-70">0</span>
                    </TabsTrigger>
                </TabsList>
            </div>

            {/* Factures content */}
            <TabsContent value="factures" className="mt-0">
                <InvoicesTable
                    invoices={purchaseData.invoices}
                    formatCurrency={formatCurrency}
                    emptyMessage="Aucune facture d'achat trouvée pour cette session."
                />
            </TabsContent>

            {/* Réceptions content */}
            <TabsContent value="receipts" className="mt-0">
                <ReceiptsTable
                    receipts={purchaseData.receipts}
                    formatCurrency={formatCurrency}
                    emptyMessage="Aucun bon de réception trouvé pour cette session."
                />
            </TabsContent>

            {/* Différences content */}
            <TabsContent value="differences" className="mt-0">
                <DifferencesTable
                    differences={purchaseData.differences}
                    formatCurrency={formatCurrency}
                    emptyMessage="Aucune différence enregistrée pour cette session."
                />
            </TabsContent>

            {/* Ouvriers content */}
            <TabsContent value="ouvriers" className="mt-0">
                <TableShell>
                    <Table>
                        <TableHeader className={tableHeaderClass}>
                            <TableRow>
                                <TableHead>ID pointage</TableHead>
                                <TableHead>Zone</TableHead>

                                <TableHead className="text-right">
                                    Total ouvriers
                                </TableHead>

                                <TableHead className="text-right">
                                    Masse salariale
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {attendances.length > 0 ? (
                                attendances.map((attendance) => (
                                    <TableRow key={attendance.id}>
                                        <TableCell className="font-medium">
                                            #{attendance.id}
                                        </TableCell>

                                        <TableCell className="text-neutral-600 dark:text-neutral-300">
                                            —
                                        </TableCell>

                                        <TableCell className="text-right font-mono">
                                            {attendance.items?.length || 0}
                                        </TableCell>

                                        <TableCell className="text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                                            {formatCurrency(
                                                attendance.total_wage || 0,
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <EmptyRow colSpan={4}>
                                    Aucun pointage d'ouvriers trouvé pour cette
                                    session.
                                </EmptyRow>
                            )}
                        </TableBody>
                    </Table>
                </TableShell>
            </TabsContent>

            {/* Charges content */}
            <TabsContent value="charges" className="mt-0">
                <TableShell>
                    <div className="flex h-72 items-center justify-center px-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
                        Aucune charge enregistrée pour le moment.
                    </div>
                </TableShell>
            </TabsContent>
        </Tabs>
    );
}

/*
|--------------------------------------------------------------------------
| Ventes
|--------------------------------------------------------------------------
*/

interface SalesTabsProps {
    saleData: SaleData;
    formatCurrency: (amount: number) => string;
}

function SalesTable({
    sales,
    formatCurrency,
    emptyMessage,
}: {
    sales: Sale[];
    formatCurrency: (amount: number) => string;
    emptyMessage: string;
}) {
    return (
        <TableShell>
            <Table>
                <TableHeader className={tableHeaderClass}>
                    <TableRow>
                        <TableHead>ID / N°</TableHead>
                        <TableHead>Client</TableHead>

                        <TableHead className="text-right">Montant</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {sales.length > 0 ? (
                        sales.map((sale) => (
                            <TableRow key={sale.id}>
                                <TableCell className="font-medium">
                                    #{sale.id}
                                </TableCell>

                                <TableCell className="text-neutral-600 dark:text-neutral-300">
                                    —
                                </TableCell>

                                <TableCell className="text-right font-mono font-semibold">
                                    {formatCurrency(sale.amount)}
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <EmptyRow colSpan={3}>{emptyMessage}</EmptyRow>
                    )}
                </TableBody>
            </Table>
        </TableShell>
    );
}

function SalesTabs({ saleData, formatCurrency }: SalesTabsProps) {
    const saleSubTabClass = cn(
        'h-10 cursor-pointer rounded-lg border border-transparent px-5 text-sm font-medium',
        'bg-transparent text-neutral-500 shadow-none transition-colors',
        'hover:bg-orange-50 hover:text-orange-700',
        'data-[state=active]:border-orange-500',
        'data-[state=active]:bg-orange-50',
        'data-[state=active]:text-orange-700',
        'data-[state=active]:shadow-none',
        'dark:text-neutral-400',
        'dark:hover:bg-orange-500/10',
        'dark:hover:text-orange-400',
        'dark:data-[state=active]:border-orange-500',
        'dark:data-[state=active]:bg-orange-500/10',
        'dark:data-[state=active]:text-orange-400',
    );

    return (
        <Tabs
            defaultValue="destination-factures"
            className="flex w-full flex-col"
        >
            {/* Ventes sub-tabs */}
            <div className="mb-5 overflow-x-auto">
                <TabsList className="flex h-auto w-full min-w-max justify-between gap-2 bg-transparent p-0">
                    <TabsTrigger
                        value="destination-factures"
                        className={saleSubTabClass}
                    >
                        Destination factures
                        <span className="ml-2 text-xs opacity-70">
                            {saleData.invoices.length}
                        </span>
                    </TabsTrigger>

                    <TabsTrigger
                        value="destination-receptions"
                        className={saleSubTabClass}
                    >
                        Destination réceptions
                        <span className="ml-2 text-xs opacity-70">
                            {saleData.receipts.length}
                        </span>
                    </TabsTrigger>

                    <TabsTrigger
                        value="differences"
                        className={saleSubTabClass}
                    >
                        Différences
                        <span className="ml-2 text-xs opacity-70">
                            {saleData.differences.length}
                        </span>
                    </TabsTrigger>

                    <TabsTrigger
                        value="ventes-directes"
                        className={saleSubTabClass}
                    >
                        Ventes directes
                        <span className="ml-2 text-xs opacity-70">
                            {saleData.sales?.length ?? 0}
                        </span>
                    </TabsTrigger>
                </TabsList>
            </div>

            {/* Destination factures content */}
            <TabsContent value="destination-factures" className="mt-0">
                <InvoicesTable
                    invoices={saleData.invoices}
                    formatCurrency={formatCurrency}
                    emptyMessage="Aucune vente avec destination facture trouvée."
                />
            </TabsContent>

            {/* Destination réceptions content */}
            <TabsContent value="destination-receptions" className="mt-0">
                <ReceiptsTable
                    receipts={saleData.receipts}
                    formatCurrency={formatCurrency}
                    emptyMessage="Aucune vente avec destination réception trouvée."
                />
            </TabsContent>

            {/* Différences content */}
            <TabsContent value="differences" className="mt-0">
                <DifferencesTable
                    differences={saleData.differences}
                    formatCurrency={formatCurrency}
                    emptyMessage="Aucune différence de vente enregistrée pour cette session."
                />
            </TabsContent>

            {/* Ventes directes content */}
            <TabsContent value="ventes-directes" className="mt-0">
                <SalesTable
                    sales={saleData.sales ?? []}
                    formatCurrency={formatCurrency}
                    emptyMessage="Aucune vente directe enregistrée pour cette session."
                />
            </TabsContent>
        </Tabs>
    );
}

/*
|--------------------------------------------------------------------------
| Main tree: Achats / Ventes → sub-tabs → content
|--------------------------------------------------------------------------
*/
export function SessionTransactions({
    purchaseData,
    saleData,
    attendances,
    formatCurrency,
}: SessionTransactionsProps) {
    const mainTabClass = cn(
        'cursor-pointer rounded-xl border bg-white px-6 py-2 text-base font-semibold shadow-none',
        'transition-colors data-[state=active]:shadow-none',
        'dark:bg-neutral-900',
    );

    return (
        <section className="w-full">
            <Tabs defaultValue="achats" className="flex w-full flex-col gap-2">
                {/* Main tabs: always at the top */}
                <TabsList className="grid h-auto w-full grid-cols-2 gap-3 bg-transparent p-0 sm:gap-5">
                    <TabsTrigger
                        value="achats"
                        className={cn(
                            mainTabClass,
                            'border-neutral-200 text-neutral-500',
                            'hover:border-blue-400 hover:text-blue-700',
                            'data-[state=active]:border-blue-500',
                            'data-[state=active]:bg-blue-50',
                            'data-[state=active]:text-blue-700',
                            'dark:border-neutral-800',
                            'dark:data-[state=active]:border-blue-500',
                            'dark:data-[state=active]:bg-blue-500/10',
                            'dark:data-[state=active]:text-blue-400',
                        )}
                    >
                        Achats
                    </TabsTrigger>

                    <TabsTrigger
                        value="ventes"
                        className={cn(
                            mainTabClass,
                            'border-neutral-200 text-neutral-500',
                            'hover:border-orange-400 hover:text-orange-700',
                            'data-[state=active]:border-orange-500',
                            'data-[state=active]:bg-orange-50',
                            'data-[state=active]:text-orange-700',
                            'dark:border-neutral-800',
                            'dark:data-[state=active]:border-orange-500',
                            'dark:data-[state=active]:bg-orange-500/10',
                            'dark:data-[state=active]:text-orange-400',
                        )}
                    >
                        Ventes
                    </TabsTrigger>
                </TabsList>

                {/* Achats tree */}
                <TabsContent
                    value="achats"
                    className="mt-0 w-full rounded-2xl border border-blue-200 bg-white p-4 sm:p-6 dark:border-blue-500/30 dark:bg-neutral-900"
                >
                    <PurchasesTabs
                        purchaseData={purchaseData}
                        attendances={attendances}
                        formatCurrency={formatCurrency}
                    />
                </TabsContent>

                {/* Ventes tree */}
                <TabsContent
                    value="ventes"
                    className="mt-0 w-full rounded-2xl border border-orange-200 bg-white p-4 sm:p-6 dark:border-orange-500/30 dark:bg-neutral-900"
                >
                    <SalesTabs
                        saleData={saleData}
                        formatCurrency={formatCurrency}
                    />
                </TabsContent>
            </Tabs>
        </section>
    );
}

export default SessionTransactions;
