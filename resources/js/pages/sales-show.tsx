import { closestCenter, DndContext, DragEndEvent, DragOverlay, DragStartEvent, KeyboardSensor, PointerSensor, UniqueIdentifier, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Head, router } from '@inertiajs/react';
import { Camera, Copy, Printer, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

// UI Components
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Layout & Custom Components
import SaleItemDragOverlay from '@/components/sale-item-drag-overlay';
import SaleItemRow from '@/components/sale-item-row'; // Ghadi t-creer hada bhal invoice-item-row
import AppLayout from '@/layouts/app-layout';

// Routes & Types
import { DeleteManyItemsDialog } from '@/components/delete-many-items';
import { SaleHeader } from '@/components/sale-header';
import { SaleStatsGrid } from '@/components/sale-stats-grid';
import { useSaleCalculations } from '@/hooks/use-sale-calculations';
import { bulkStore, destroyMany, duplicateMany, reorder } from '@/routes/sales/items';
import { Boat } from '@/types/boat';
import { Item } from '@/types/item';
import { Sale } from '@/types/sale';
import { SaleItem } from '@/types/sale-item';
import { SalePrintFooter } from '@/components/sale-print-footer';
import { useScreenshot } from '@/hooks/use-screenshot';
import { ImportItemsDialog } from '@/components/import-items-dialog';
import { useSaleImport } from '@/hooks/use-sale-import';
import { ExportDropdown } from '@/components/export-dropdown';
import { useSaleExport } from '@/hooks/use-sale-export';

interface Props {
    sale: Sale & { items: SaleItem[] };
    boats: Boat[];
    items: Item[];
}

export default function SalesShow({ sale, boats, items }: Props) {
    const [localItems, setLocalItems] = useState<SaleItem[]>(sale.items || []);
    const [prevItems, setPrevItems] = useState(sale.items);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const { copyToClipboard } = useScreenshot();

    const { parsePasteData } = useSaleImport(boats, items);

    const { exportToExcel, exportToCSV, exportToPDF } = useSaleExport();

    // Sync local state m3a l'props dyal Inertia
    if (sale.items !== prevItems) {
        setPrevItems(sale.items);
        setLocalItems(sale.items);
    }

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );


    const stats = useSaleCalculations(sale)

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (over && active.id !== over.id) {
            const isMovingBatch = selectedIds.includes(active.id as number);
            let newOrder: SaleItem[];

            if (isMovingBatch) {
                const movingItems = localItems.filter((item) =>
                    selectedIds.includes(item.id),
                );
                const remainingItems = localItems.filter(
                    (item) => !selectedIds.includes(item.id),
                );
                const overIndexInRemaining = remainingItems.findIndex(
                    (item) => item.id === over.id,
                );
                newOrder = [...remainingItems];
                newOrder.splice(overIndexInRemaining, 0, ...movingItems);
            } else {
                const oldIndex = localItems.findIndex((i) => i.id === active.id);
                const newIndex = localItems.findIndex((i) => i.id === over.id);
                newOrder = arrayMove(localItems, oldIndex, newIndex);
            }

            setLocalItems(newOrder);

            router.post(reorder(sale.id), {
                items: newOrder.map((i) => i.id),
            }, {
                preserveScroll: true,
                preserveState: true,
            });
        }
    };



    const handleBulkDelete = () => {
        router.post(destroyMany(sale.id), {
            _method: 'DELETE',
            ids: selectedIds,
        }, {
            onSuccess: () => {
                toast.success('Supprimé avec succès');
                setSelectedIds([]);
            },
            preserveScroll: true,
        });
    };

    const handleBulkDuplicate = () => {
        if (selectedIds.length === 0) {
            return;
        }

        router.post(duplicateMany(sale.id), { ids: selectedIds }, {
            onSuccess: () => setSelectedIds([]),
            preserveScroll: true,
        });
    };

    const handlePrint = () => {
        window.print();
    };

    const handleScreenshot = () => {
        copyToClipboard('sale-content');
    };

    const handleImport = (text: string) => {
        {
            const rawData = parsePasteData(text);

            if (rawData.length === 0) {
                {
                    toast.error("Aucune donnée valide trouvée.");

                    return;
                }
            }

            const cleanData = rawData.map((row) => {
                {
                    return {
                        boat_id: row.boat_id,
                        item_id: row.item_id,
                        unit_count: row.unit_count,
                        unit_price: row.unit_price,
                        unit: row.unit,
                        weight: row.weight,
                        box: row.box, // Zdt l-box hit mhim f l-bi3
                    };
                }
            });

            router.post(bulkStore(sale.id), {
                items: cleanData
            }, {
                onSuccess: () => {
                    {
                        toast.success("Importation réussie !");

                        setSelectedIds([]);
                    }
                },
                onError: (errors) => {
                    {
                        console.log(errors);

                        toast.error("Erreur lors de l'importation.");
                    }
                },
                preserveScroll: true
            });
        }
    };


    const handleExport = (type: 'excel' | 'csv' | 'pdf') => {
        if (type === 'excel') {
            exportToExcel(sale, localItems);
        }

        if (type === 'pdf') {
            exportToPDF(sale, localItems, stats);
        }

        if (type === 'csv') {
            exportToCSV(sale, localItems);
        }
    };

    return (
        <div className="mx-auto min-h-screen max-w-7xl space-y-6 bg-white p-6 font-sans text-slate-900 dark:bg-neutral-950 dark:text-neutral-100">
            <Head title={`Vente #${sale.id}`} />

            <SaleHeader sale={sale} />
            <SaleStatsGrid stats={stats} />

            <div className="flex justify-end gap-4 print:hidden">
                <Button
                    onClick={handleScreenshot}
                    variant="outline"
                    size="sm"
                    title="Copy for WhatsApp"
                    className="h-9 border-slate-200 text-slate-500 shadow-sm hover:bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                >
                    <Camera className="h-4 w-4" />
                </Button>

                <Button
                    onClick={handlePrint}
                    variant="outline"
                    size="sm"
                    className="h-9 border-slate-200 text-slate-500 shadow-sm hover:bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                >
                    <Printer className="h-3 w-3" />
                </Button>

                <ImportItemsDialog onImport={handleImport} />

                <ExportDropdown onExport={handleExport} />
            </div>

            <div className="flex items-center justify-between">
                {selectedIds.length > 0 ? (
                    <div className="flex animate-in items-center gap-3 duration-200 fade-in slide-in-from-left-2">
                        <div className="flex items-center gap-2">
                            <span className="rounded bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                                {selectedIds.length} sélectionnés
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1.5 px-2 text-[10px] font-black tracking-tighter text-slate-500 uppercase transition-colors hover:bg-red-50 hover:text-red-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                                onClick={() => setSelectedIds([])}
                            >
                                <X className="h-3.5 w-3.5" /> Annuler
                            </Button>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-2 text-xs dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
                                onClick={handleBulkDuplicate}
                            >
                                <Copy className="h-3.5 w-3.5" /> Dupliquer
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                className="h-8 gap-2 text-xs"
                                onClick={() => setIsDeleteDialogOpen(true)}
                            >
                                <Trash2 className="h-3.5 w-3.5" /> Supprimer
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div />
                )}
            </div>

            <div
                id="sale-content"
                className="relative overflow-hidden rounded-lg rounded-b-none border border-slate-100 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
            >
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToVerticalAxis]}
                >
                    <Table>
                        <TableHeader className="border-b border-slate-100 bg-slate-50/50 dark:border-neutral-800 dark:bg-neutral-900/50">
                            <TableRow className="h-11 hover:bg-transparent">
                                <TableHead className="w-8 print:hidden"></TableHead>
                                <TableHead className="w-10 print:hidden">
                                    <Checkbox
                                        className="mt-1 mr-2"
                                        checked={
                                            selectedIds.length === localItems.length &&
                                            localItems.length > 0
                                        }
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                setSelectedIds(localItems.map((i) => i.id));
                                            } else {
                                                setSelectedIds([]);
                                            }
                                        }}
                                    />
                                </TableHead>
                                <TableHead className="text-[10px] font-black tracking-tight text-slate-500 uppercase dark:text-neutral-400">
                                    Bateau
                                </TableHead>
                                <TableHead className="text-[10px] font-black tracking-tight text-slate-500 uppercase dark:text-neutral-400">
                                    Espèces
                                </TableHead>
                                <TableHead className="text-center text-[10px] font-black tracking-tight text-slate-500 uppercase dark:text-neutral-400">
                                    Qte / NC
                                </TableHead>
                                <TableHead className="text-right text-[10px] font-black tracking-tight text-slate-500 uppercase dark:text-neutral-400">
                                    Prix Unitaire
                                </TableHead>
                                <TableHead className="text-center text-[10px] font-black tracking-tight text-slate-500 uppercase dark:text-neutral-400">
                                    Unité
                                </TableHead>
                                <TableHead className="text-center text-[10px] font-black tracking-tight text-slate-500 uppercase dark:text-neutral-400">
                                    Poids
                                </TableHead>
                                <TableHead className="text-center text-[10px] font-black tracking-tight text-slate-500 uppercase dark:text-neutral-400">
                                    Caisses
                                </TableHead>
                                <TableHead className="px-6 text-right text-[10px] font-black tracking-tight text-slate-500 uppercase dark:text-neutral-400">
                                    Valeur DH
                                </TableHead>
                                <TableHead className="w-12 print:hidden"></TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            <SaleItemRow
                                saleId={sale.id}
                                boats={boats}
                                items={items}
                                isNew={true}
                            />

                            <SortableContext
                                items={localItems.map((i) => i.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {localItems.map((row) => (
                                    <SaleItemRow
                                        key={row.id}
                                        saleId={sale.id}
                                        item={row}
                                        boats={boats}
                                        items={items}
                                        selected={selectedIds.includes(row.id)}
                                        onSelectChange={(checked) => {
                                            setSelectedIds((prev) =>
                                                checked
                                                    ? [...prev, row.id]
                                                    : prev.filter((id) => id !== row.id),
                                            );
                                        }}
                                    />
                                ))}
                            </SortableContext>
                        </TableBody>
                    </Table>

                    <DragOverlay dropAnimation={null}>
                        {activeId
                            ? (() => {
                                const isSelected = selectedIds.includes(activeId as number);
                                const itemsToDisplay = isSelected
                                    ? localItems.filter((item) =>
                                        selectedIds.includes(item.id),
                                    )
                                    : localItems.filter((item) => item.id === activeId);

                                return <SaleItemDragOverlay items={itemsToDisplay} />;
                            })()
                            : null}
                    </DragOverlay>
                </DndContext>
            </div>

            <SalePrintFooter stats={stats} />

            <DeleteManyItemsDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={handleBulkDelete}
                count={selectedIds.length}
            />
        </div>
    );
}

SalesShow.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Ventes', href: '/sales' },
            { title: 'Détails de la Vente', href: '#' },
        ]}
    >
        {page}
    </AppLayout>
);