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
            const oldIndex = localItems.findIndex((i) => i.id === active.id);
            const newIndex = localItems.findIndex((i) => i.id === over.id);

            const newOrder = arrayMove(localItems, oldIndex, newIndex);

            setLocalItems(newOrder);

            router.post(reorder(sale.id), {
                items: newOrder.map((i) => i.id)
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
        <div className="p-6 space-y-6 max-w-7xl mx-auto bg-white min-h-screen text-slate-900 font-sans">
            <Head title={`Vente #${sale.id}`} />

            <SaleHeader sale={sale} />
            <SaleStatsGrid stats={stats} />

            {/* Header dyal l-Vente (Tqder t-dir component bhal InvoiceHeader) */}
            <div className="w-full flex justify-end items-center">
                <div className="flex gap-2 print:hidden">

                    <Button
                        onClick={handleScreenshot}
                        variant="outline"
                        size="sm"
                        className="h-9 border-slate-200 shadow-sm hover:bg-slate-50 text-slate-500"
                        title="Copy for WhatsApp"
                    >
                        <Camera className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handlePrint}
                        className="h-9 border-slate-200 shadow-sm hover:bg-slate-50 text-slate-500"
                        title="Print"
                    >
                        <Printer className="h-4 w-4" />
                    </Button>

                    <ImportItemsDialog onImport={handleImport} />

                    <ExportDropdown
                        onExport={handleExport}
                    />
                </div>
            </div>

            {/* Toolbar dyal l-Actions Bulk */}
            <div className="h-10 flex items-center justify-between">
                {selectedIds.length > 0 ? (
                    <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-200">
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            {selectedIds.length} sélectionnés
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedIds([])}
                            className="h-8 text-xs text-slate-500"
                        >
                            <X className="h-3 w-3 mr-1" /> Annuler
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs gap-2"
                            onClick={handleBulkDuplicate}>
                            <Copy className="h-3.5 w-3.5" /> Dupliquer
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setIsDeleteDialogOpen(true)}
                            className="h-8 text-xs gap-2"
                        >
                            <Trash2 className="h-3.5 w-3.5" /> Supprimer
                        </Button>
                    </div>
                ) : <div />}
            </div>

            {/* Table Area */}
            <div id="sale-content" className="border border-slate-100 rounded-lg overflow-hidden shadow-sm relative bg-white">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToVerticalAxis]}
                >
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="h-11 hover:bg-transparent">
                                <TableHead className="w-8 print:hidden"></TableHead>
                                <TableHead className="w-10 print:hidden">
                                    <Checkbox
                                        checked={selectedIds.length === localItems.length && localItems.length > 0}
                                        onCheckedChange={(checked) => {
                                            setSelectedIds(checked ? localItems.map(i => i.id) : []);
                                        }}
                                    />
                                </TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-slate-500">Bateau</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-slate-500">Espèces</TableHead>
                                <TableHead className="text-center text-[10px] font-black uppercase text-slate-500">Qte/nc</TableHead>
                                <TableHead className="text-right text-[10px] font-black uppercase text-slate-500">prix unitaire</TableHead>
                                <TableHead className="text-center text-[10px] font-black uppercase text-slate-500">Unité</TableHead>
                                <TableHead className="text-center text-[10px] font-black uppercase text-slate-500">Poids</TableHead>
                                <TableHead className="text-center text-[10px] font-black uppercase text-slate-500">Caisses</TableHead>
                                <TableHead className="text-right px-6 text-[10px] font-black uppercase text-slate-500">Total DH</TableHead>
                                <TableHead className="w-12 print:hidden"></TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {/* Row jdida dima l-fouq */}
                            <SaleItemRow
                                saleId={sale.id}
                                boats={boats}
                                items={items}
                                isNew={true}
                            />

                            <SortableContext items={localItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                                {localItems.map((row) => (
                                    <SaleItemRow
                                        key={row.id}
                                        saleId={sale.id}
                                        item={row}
                                        boats={boats}
                                        items={items}
                                        selected={selectedIds.includes(row.id)}
                                        onSelectChange={(checked) => {
                                            setSelectedIds(prev => checked
                                                ? [...prev, row.id]
                                                : prev.filter(id => id !== row.id)
                                            );
                                        }}
                                    />
                                ))}
                            </SortableContext>
                        </TableBody>
                    </Table>

                    <DragOverlay dropAnimation={null}>
                        {activeId ? (
                            <SaleItemDragOverlay
                                items={localItems.filter(i =>
                                    selectedIds.includes(activeId as number)
                                        ? selectedIds.includes(i.id)
                                        : i.id === activeId
                                )}
                            />
                        ) : null}
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