import { Lock, Plus } from 'lucide-react';
import { router } from '@inertiajs/react';

import AddReceiptDialog from '@/components/add-receipt-dialog';
import DeleteReceiptDialog from '@/components/delete-receipt-dialog';
import EditReceiptDialog from '@/components/edit-receipt-dialog';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { Boat } from '@/types/boat';
import type { Customer } from '@/types/customer';
import type { SessionStatus } from '@/types/daily-session';
import type { Receipt } from '@/types/receipt';
import type { SessionZone } from '@/types/session-zone';
import { show as showReceipt } from '@/routes/receipts';

import {
    SessionEmptyRow,
    SessionTableShell,
    sessionTableHeaderClass,
} from './session-table-shell';

/**
 * Contexte de la journée courante : il alimente le dialogue de création et les
 * actions de ligne (modifier / supprimer). La session, la zone et la date étant
 * déjà connues, seuls le client et le bateau restent à saisir à la création.
 */
export interface SessionReceiptAddContext {
    sessionId: number;
    sessionDate: string;
    sessionStatus: SessionStatus;
    sessionZones: SessionZone[];
    customers: Customer[];
    boats: Boat[];
}

export type SessionReceiptAddContextInput = SessionReceiptAddContext;

export interface SessionReceiptsTableProps {
    receipts: Receipt[];
    formatCurrency: (amount: number) => string;
    emptyMessage: string;
    /**
     * Quand fourni : affiche la barre d'outils (bouton de création) ainsi que
     * les icônes de modification / suppression sur chaque ligne.
     */
    receiptContext?: SessionReceiptAddContext | null;
    title?: string;
}

export function SessionReceiptsTable({
    receipts,
    formatCurrency,
    emptyMessage,
    receiptContext,
    title = 'Bons de réception',
}: SessionReceiptsTableProps) {
    const canAddReceipt = receiptContext?.sessionStatus === 'open';

    // Ouvrir la fiche du bon : c'est là que les articles sont saisis.
    const handleRowClick = (receiptId: number): void => {
        router.visit(
            showReceipt.url(
                receiptId,
                receiptContext
                    ? { query: { from_session: receiptContext.sessionId } }
                    : undefined,
            ),
        );
    };

    return (
        <SessionTableShell
            header={
                receiptContext ? (
                    <>
                        <span className="text-xs font-bold tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
                            {title} ({receipts.length})
                        </span>

                        {canAddReceipt ? (
                            <AddReceiptDialog
                                customers={receiptContext.customers}
                                sessionZones={receiptContext.sessionZones}
                                boats={receiptContext.boats}
                                lockedSessionZoneIds={receiptContext.sessionZones.map(
                                    (sessionZone) => sessionZone.id,
                                )}
                                lockedDate={receiptContext.sessionDate}
                                title="Nouveau Bon de Réception"
                                description="La journée, la zone et la date sont déjà définies : choisissez le client et le bateau."
                                trigger={
                                    <Button size="sm" className="font-bold">
                                        <Plus className="mr-2 h-4 w-4" />{' '}
                                        Nouveau Bon
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
                        <TableHead>Bon N°</TableHead>
                        <TableHead>Bateau / Fournisseur</TableHead>

                        <TableHead className="text-right">
                            Montant total
                        </TableHead>

                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {receipts.length > 0 ? (
                        receipts.map((receipt) => (
                            <TableRow
                                key={receipt.id}
                                className="cursor-pointer"
                                onClick={() => handleRowClick(receipt.id)}
                            >
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

                                <TableCell
                                    className="text-right"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                    }}
                                >
                                    {receiptContext?.sessionStatus ===
                                    'open' ? (
                                        <div className="flex items-center justify-end gap-1">
                                            <EditReceiptDialog
                                                receipt={receipt}
                                                customers={
                                                    receiptContext.customers
                                                }
                                                sessionZones={
                                                    receiptContext.sessionZones
                                                }
                                                boats={receiptContext.boats}
                                                lockedSessionZoneIds={receiptContext.sessionZones.map(
                                                    (sessionZone) =>
                                                        sessionZone.id,
                                                )}
                                                lockedDate={
                                                    receiptContext.sessionDate
                                                }
                                            />

                                            <DeleteReceiptDialog
                                                receiptId={receipt.id}
                                                amount={receipt.total_amount}
                                            />
                                        </div>
                                    ) : null}
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <SessionEmptyRow colSpan={4}>
                            {emptyMessage}
                        </SessionEmptyRow>
                    )}
                </TableBody>
            </Table>
        </SessionTableShell>
    );
}

export default SessionReceiptsTable;
