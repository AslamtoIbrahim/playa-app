import ReceptionRecordRow from '@/components/reception-record-row';
import {
    ReceptionRecordColumnFilter,
    ReceptionRecordGlobalSearch,
} from '@/components/reception-record-filters';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useReceptionRecordFilters } from '@/hooks/use-reception-record-filters';
import type { ReceptionRecordData } from '@/hooks/use-reception-record';
import { usines as usinesIndex } from '@/routes';
import type { ReceptionRecord } from '@/types/reception-record';
import type { Usine } from '@/types/usine';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Building2, Package } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { UsineSelectionStatistics } from '@/components/usine-selection-statistics';
import { useUsineCellSelection } from '@/hooks/use-usine-cell-selection';

interface Props {
    usine: Usine;
    receptionRecords: ReceptionRecord[];
}

const columns: {
    heading: string;
    filterColumn:
        | 'date'
        | 'weight'
        | 'designation'
        | 'origin'
        | 'ttc'
        | 'averagePrice'
        | 'amount'
        | 'margin'
        | 'sale'
        | 'invoiced'
        | 'reference';
    optionColumn?: 'date' | 'designation' | 'origin' | 'invoiced';
}[] = [
    { heading: 'DATE', filterColumn: 'date', optionColumn: 'date' },
    { heading: 'RECEP', filterColumn: 'weight' },
    {
        heading: 'DESIGNATION',
        filterColumn: 'designation',
        optionColumn: 'designation',
    },
    { heading: 'ORIGINE', filterColumn: 'origin', optionColumn: 'origin' },
    { heading: 'TTC', filterColumn: 'ttc' },
    { heading: 'PRIX MOY', filterColumn: 'averagePrice' },
    { heading: 'ACHAT', filterColumn: 'amount' },
    { heading: '%', filterColumn: 'margin' },
    { heading: 'VENTE', filterColumn: 'sale' },
    { heading: 'FACT', filterColumn: 'invoiced', optionColumn: 'invoiced' },
    { heading: 'RÉF', filterColumn: 'reference' },
];

const formatTotal = (value: number): string =>
    value.toLocaleString('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

export default function UsineShowPage({ usine, receptionRecords }: Props) {
    const [localRecords, setLocalRecords] = useState(receptionRecords);
    const [showColumnFilters, setShowColumnFilters] = useState(false);
    const {
        filters,
        setFilters,
        filteredRecords,
        optionsByColumn,
        totals,
        activeFilterCount,
        hasActiveFilters,
    } = useReceptionRecordFilters(localRecords);
    const {
        selection: cellSelection,
        setSelection: setCellSelection,
        selectCell,
        extendSelection,
        getSelectedCellRange,
        statistics: selectionStatistics,
        rowIds,
    } = useUsineCellSelection(filteredRecords);
    const cellSelectDrag = useRef<{
        rowId: number;
        field: (typeof columns)[number]['filterColumn'];
    } | null>(null);

    useEffect(() => {
        setLocalRecords(receptionRecords);
    }, [receptionRecords]);

    useEffect(() => {
        const clearCellSelectionOutsideTable = (event: PointerEvent) => {
            const target = event.target;

            if (
                target instanceof Element &&
                !target.closest(
                    '[data-usine-cell], [data-usine-selection-statistics]',
                )
            ) {
                setCellSelection(null);
            }
        };

        document.addEventListener(
            'pointerdown',
            clearCellSelectionOutsideTable,
        );

        return () => {
            document.removeEventListener(
                'pointerdown',
                clearCellSelectionOutsideTable,
            );
        };
    }, [setCellSelection]);

    useEffect(() => {
        const handlePointerMove = (event: PointerEvent) => {
            const drag = cellSelectDrag.current;
            const target = document
                .elementFromPoint(event.clientX, event.clientY)
                ?.closest<HTMLElement>('[data-usine-cell][data-usine-row]');

            if (
                drag &&
                target?.dataset.usineCell === drag.field &&
                target.dataset.usineRow
            ) {
                extendSelection(Number(target.dataset.usineRow), drag.field);
            }
        };

        const handlePointerUp = () => {
            cellSelectDrag.current = null;
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerUp);

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointercancel', handlePointerUp);
        };
    }, [extendSelection]);

    useEffect(() => {
        const extendSelectionWithShiftArrow = (event: KeyboardEvent) => {
            if (
                !event.shiftKey ||
                (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') ||
                !cellSelection
            ) {
                return;
            }

            const currentIndex = rowIds.indexOf(cellSelection.rowId);
            const targetRowId =
                rowIds[currentIndex + (event.key === 'ArrowDown' ? 1 : -1)];

            if (targetRowId === undefined) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            extendSelection(targetRowId, cellSelection.field);
        };

        window.addEventListener('keydown', extendSelectionWithShiftArrow, true);

        return () => {
            window.removeEventListener(
                'keydown',
                extendSelectionWithShiftArrow,
                true,
            );
        };
    }, [cellSelection, extendSelection, rowIds]);

    const handleCellSelect = (
        rowId: number,
        field: (typeof columns)[number]['filterColumn'],
        shift: boolean,
    ) => {
        selectCell(rowId, field, shift);
        cellSelectDrag.current = shift ? null : { rowId, field };
    };

    const handleRecordDataChange = (
        recordId: number,
        data: ReceptionRecordData,
    ) => {
        setLocalRecords((current) =>
            current.map((record) =>
                record.id === recordId
                    ? {
                          ...record,
                          weight: data.weight,
                          ttc: data.ttc,
                          amount: data.amount,
                          margin_percentage: data.margin_percentage,
                          is_invoiced: data.is_invoiced,
                          invoice_reference:
                              data.invoice_reference.trim() === ''
                                  ? null
                                  : Number(data.invoice_reference),
                      }
                    : record,
            ),
        );
    };

    const totalValues = [
        'Totaux',
        formatTotal(totals.weight),
        '',
        '',
        formatTotal(totals.ttc),
        formatTotal(totals.averagePrice),
        formatTotal(totals.amount),
        formatTotal(totals.margin),
        formatTotal(totals.sale),
        '',
        '',
    ];

    return (
        <>
            <Head title={`Réceptions - ${usine.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 lg:p-8">
                <button
                    type="button"
                    onClick={() => router.visit(usinesIndex().url)}
                    className="inline-flex w-fit cursor-pointer items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Retour aux usines
                </button>

                <div className="px-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        {usine.name}
                    </div>
                    <h1 className="mt-1 text-2xl font-black tracking-tight text-neutral-900 uppercase dark:text-neutral-100">
                        Réceptions
                    </h1>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <ReceptionRecordGlobalSearch
                        value={filters.search}
                        onChange={(search) =>
                            setFilters((current) => ({ ...current, search }))
                        }
                        showColumnFilters={showColumnFilters}
                        activeFilterCount={activeFilterCount}
                        onToggleColumnFilters={() =>
                            setShowColumnFilters((visible) => !visible)
                        }
                    />
                    <div className="ml-auto flex items-center gap-2">
                        <UsineSelectionStatistics
                            statistics={selectionStatistics}
                        />
                    </div>
                </div>

                <div className="min-w-0 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/90">
                    <Table>
                        <TableHeader className="bg-neutral-50/50 dark:bg-neutral-800/50">
                            {hasActiveFilters && (
                                <TableRow
                                    aria-label="Totaux des réceptions filtrées"
                                    className="h-11 border-b border-neutral-200 bg-neutral-100/70 hover:bg-neutral-100/70 dark:border-neutral-800 dark:bg-neutral-800/70 dark:hover:bg-neutral-800/70"
                                >
                                    {totalValues.map((value, index) => (
                                        <TableHead
                                            key={columns[index].heading}
                                            className={`text-center ${
                                                value
                                                    ? 'font-bold text-foreground tabular-nums'
                                                    : ''
                                            }`}
                                        >
                                            {value}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            )}
                            <TableRow className="border-b border-neutral-200 text-sm hover:bg-transparent dark:border-neutral-800">
                                {columns.map((column) => (
                                    <TableHead
                                        key={column.heading}
                                        className={`text-center leading-tight font-bold text-neutral-800 dark:text-neutral-200 ${
                                            column.heading === 'PRIX MOY' ||
                                            column.heading === 'VENTE'
                                                ? 'whitespace-nowrap'
                                                : 'whitespace-normal'
                                        }`}
                                    >
                                        <span className="inline-flex items-center justify-center">
                                            {column.heading}
                                            {showColumnFilters && (
                                                <ReceptionRecordColumnFilter
                                                    column={column.filterColumn}
                                                    title={column.heading}
                                                    options={
                                                        column.optionColumn
                                                            ? optionsByColumn[
                                                                  column
                                                                      .optionColumn
                                                              ]
                                                            : undefined
                                                    }
                                                    filters={filters}
                                                    setFilters={setFilters}
                                                />
                                            )}
                                        </span>
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {filteredRecords.map((record, index) => (
                                <ReceptionRecordRow
                                    key={`${record.id}-${record.designation}-${index}`}
                                    usineId={usine.id}
                                    record={record}
                                    onCellSelect={handleCellSelect}
                                    selectedCell={getSelectedCellRange(
                                        record.id,
                                    )}
                                    onDataChange={(data) =>
                                        handleRecordDataChange(record.id, data)
                                    }
                                />
                            ))}
                            {filteredRecords.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        className="py-16 text-center font-medium text-muted-foreground italic dark:text-neutral-400"
                                    >
                                        {hasActiveFilters
                                            ? 'Aucune réception ne correspond aux filtres sélectionnés.'
                                            : 'Aucune réception enregistrée pour cette usine.'}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50/50 px-6 py-3 dark:border-neutral-800 dark:bg-neutral-800/50">
                        <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-neutral-500 uppercase dark:text-neutral-400">
                            <Package className="h-4 w-4" />
                            {filteredRecords.length} réception(s) affichée(s)
                            {hasActiveFilters &&
                                ` sur ${localRecords.length} au total`}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

UsineShowPage.layout = {
    breadcrumbs: [{ title: 'Usines', href: '/usines' }],
};
