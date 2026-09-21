import { router } from '@inertiajs/react';
import { Lock, Plus, ShieldCheck } from 'lucide-react';

import AddInvoiceDialog from '@/components/add-invoice-dialog';
import DeleteInvoiceDialog from '@/components/delete-invoice-dialog';
import EditInvoiceDialog from '@/components/edit-invoice-dialog';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { show as showInvoice } from '@/routes/invoices';
import type { Caution } from '@/types/caution';
import type { SessionStatus } from '@/types/daily-session';
import type { Billable, Invoice } from '@/types/invoice';
import type { OfficeRoom } from '@/types/office-room';
import type { SessionZone } from '@/types/session-zone';

import {
    SessionEmptyRow,
    SessionTableShell,
    sessionTableHeaderClass,
} from './session-table-shell';

/**
 * Contexte de la journée courante : il alimente le dialogue de création et les
 * actions de ligne (modifier / archiver).
 * La session, la zone et la date étant déjà connues, seuls le compte et le
 * bureau restent à saisir à la création.
 */
export interface SessionInvoiceAddContext {
    type: 'sale' | 'purchase';
    sessionDate: string;
    sessionStatus: SessionStatus;
    sessionZones: SessionZone[];
    billables: Billable[];
    officeRooms: OfficeRoom[];
    cautions: Caution[];
}

export type SessionInvoiceAddContextInput = Omit<
    SessionInvoiceAddContext,
    'type'
>;

export interface SessionInvoicesTableProps {
    invoices: Invoice[];
    formatCurrency: (amount: number) => string;
    emptyMessage: string;
    /**
     * Quand fourni : affiche la barre d'outils (bouton de création) ainsi que
     * les icônes de modification / archivage sur chaque ligne.
     */
    invoiceContext?: SessionInvoiceAddContext | null;
    title?: string;
}

export function SessionInvoicesTable({
    invoices,
    formatCurrency,
    emptyMessage,
    invoiceContext,
    title = 'Factures',
}: SessionInvoicesTableProps) {
    const handleRowClick = (invoiceId: number): void => {
        router.visit(showInvoice.url(invoiceId));
    };

    const canAddInvoice = invoiceContext?.sessionStatus === 'open';

    return (
        <SessionTableShell
            header={
                invoiceContext ? (
                    <>
                        <span className="text-xs font-bold tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
                            {title} ({invoices.length})
                        </span>

                        {canAddInvoice ? (
                            <AddInvoiceDialog
                                billables={invoiceContext.billables}
                                officeRooms={invoiceContext.officeRooms}
                                cautions={invoiceContext.cautions}
                                sessionZones={invoiceContext.sessionZones}
                                lockedSessionZoneIds={invoiceContext.sessionZones.map(
                                    (sessionZone) => sessionZone.id,
                                )}
                                lockedDate={invoiceContext.sessionDate}
                                lockedType={invoiceContext.type}
                                redirectTo="session"
                                title={
                                    invoiceContext.type === 'purchase'
                                        ? "Nouvelle Facture d'Achat"
                                        : 'Nouvelle Facture de Vente'
                                }
                                description="La journée, la zone et la date sont déjà définies : choisissez le compte et le bureau."
                                trigger={
                                    <Button size="sm" className="font-bold">
                                        <Plus className="mr-2 h-4 w-4" />{' '}
                                        Ajouter une Facture
                                    </Button>
                                }
                            />
                        ) : (
                            <Button
                                size="sm"
                                variant="outline"
                                disabled
                                className="font-bold dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400"
                            >
                                <Lock className="mr-2 h-4 w-4" /> Journée
                                clôturée
                            </Button>
                        )}
                    </>
                ) : null
            }
        >
            <Table>
                <TableHeader className={sessionTableHeaderClass}>
                    <TableRow>
                        <TableHead>ID / N°</TableHead>
                        <TableHead>Client / Fournisseur</TableHead>
                        <TableHead>Caution</TableHead>

                        <TableHead className="text-center">NC</TableHead>

                        <TableHead className="text-center">Poids Kg</TableHead>

                        <TableHead className="text-right">Montant</TableHead>

                        <TableHead className="text-right">Actions</TableHead>
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

                                <TableCell className="text-center font-bold text-neutral-700 dark:text-neutral-300">
                                    {invoice.weight || 0}{' '}
                                </TableCell>

                                <TableCell className="text-right font-mono font-semibold">
                                    {formatCurrency(invoice.amount)}
                                </TableCell>

                                <TableCell
                                    className="text-right"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                    }}
                                >
                                    {invoiceContext ? (
                                        <div className="flex items-center justify-end gap-1">
                                            <EditInvoiceDialog
                                                invoice={invoice}
                                                billables={
                                                    invoiceContext.billables
                                                }
                                                sessionZones={
                                                    invoiceContext.sessionZones
                                                }
                                                cautions={
                                                    invoiceContext.cautions
                                                }
                                                officeRooms={
                                                    invoiceContext.officeRooms
                                                }
                                            />

                                            <DeleteInvoiceDialog
                                                invoiceId={invoice.id}
                                                invoiceNumber={
                                                    invoice.invoice_number
                                                }
                                                amount={invoice.amount}
                                            />
                                        </div>
                                    ) : null}
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <SessionEmptyRow colSpan={7}>
                            {emptyMessage}
                        </SessionEmptyRow>
                    )}
                </TableBody>
            </Table>
        </SessionTableShell>
    );
}

export default SessionInvoicesTable;
