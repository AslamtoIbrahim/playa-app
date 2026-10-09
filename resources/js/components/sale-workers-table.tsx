import { SellWorkersDialog } from '@/components/sell-workers-dialog';
import { Card, CardContent } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { Customer } from '@/types/customer';
import type { DailySession } from '@/types/daily-session';
import type { Sale } from '@/types/sale';
import type { SaleWorker } from '@/types/sale-worker';
import { Pencil } from 'lucide-react';

interface SaleWorkersTableProps {
    workers: SaleWorker[];
    /** Ventes de la journée : cibles possibles du dialogue d'édition. */
    sales?: Sale[];
    /** Session courante pour créer la vente manquante depuis le dialogue. */
    session?: DailySession | null;
    /** Clients disponibles pour la nouvelle vente. */
    customers?: Customer[];
    className?: string;
}

/**
 * Parts de masse salariale imputées à la vente (SaleWorkers).
 *
 * Compact table without header: attendance number, zone/session info,
 * attendance total_wage and assigned amount. Half-width ready so it sits
 * side by side with the receipt charges table. Each row reuses
 * `SellWorkersDialog` (same dialog as the attendance page) to edit or
 * delete its allocation.
 */
export function SaleWorkersTable({
    workers,
    sales = [],
    session = null,
    customers = [],
    className,
}: SaleWorkersTableProps) {
    if (workers.length === 0) {
        return null;
    }

    return (
        <Card
            className={cn(
                'w-full overflow-hidden border-slate-100 shadow-sm dark:border-neutral-800 dark:bg-neutral-900',
                className,
            )}
        >
            <CardContent className="p-0">
                <Table>
                    <TableHeader className="border-b border-slate-100 bg-slate-50/50 dark:border-neutral-800 dark:bg-neutral-900/50">
                        <TableRow className="h-10 hover:bg-transparent">
                            <TableHead className="w-20 px-4 text-[10px] font-black uppercase">
                                Pointage N°
                            </TableHead>

                            <TableHead className="px-4 text-[10px] font-black uppercase">
                                Ouvriers
                            </TableHead>

                            <TableHead className="w-36 px-4 text-right text-[10px] font-black uppercase">
                                Masse salariale
                            </TableHead>

                            <TableHead className="w-36 px-4 text-right text-[10px] font-black uppercase">
                                Montant imputé
                            </TableHead>

                            <TableHead className="w-16 px-4 text-center text-[10px] font-black uppercase print:hidden">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {workers.map((worker) => {
                            const attendance = worker.attendance;
                            const zone =
                                attendance?.session_zone?.zone?.name ?? null;

                            return (
                                <TableRow key={worker.id} className="h-11">
                                    <TableCell className="px-4 text-sm font-semibold text-slate-900 dark:text-neutral-100">
                                        {`#${worker.attendance_id}`}
                                    </TableCell>

                                    <TableCell className="px-4 text-sm text-slate-600 capitalize dark:text-neutral-300">
                                        {zone || '—'}
                                    </TableCell>

                                    <TableCell className="px-4 text-right text-sm text-slate-600 dark:text-neutral-300">
                                        {`${Number(attendance?.total_wage ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH`}
                                    </TableCell>

                                    <TableCell className="px-4 text-right text-sm font-bold text-slate-900 dark:text-neutral-100">
                                        {`${Number(worker.amount).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH`}
                                    </TableCell>

                                    <TableCell className="px-2 text-center print:hidden">
                                        {attendance ? (
                                            <SellWorkersDialog
                                                attendance={attendance}
                                                sales={sales}
                                                session={session}
                                                customers={customers}
                                                trigger={
                                                    <button
                                                        type="button"
                                                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                                                        title="Modifier / supprimer"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </button>
                                                }
                                            />
                                        ) : null}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

export default SaleWorkersTable;
