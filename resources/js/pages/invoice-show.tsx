import {
    closestCenter,
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    KeyboardSensor,
    PointerSensor,
    UniqueIdentifier,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Head, router } from '@inertiajs/react';
import { Camera, Copy, Printer, Trash2, X } from 'lucide-react';
import { useState } from 'react';

// UI Components
import { DeleteManyItemsDialog } from '@/components/delete-many-items';
import InvoiceItemDragOverlay from '@/components/invoice-item-drag-overlay';
import InvoiceItemRow from '@/components/invoice-item-row';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

// New Extracted Components & Hooks
import { InvoiceHeader } from '@/components/invoice-header';
import { InvoiceStatsGrid } from '@/components/invoice-stats-grid';
import { useInvoiceCalculations } from '@/hooks/use-invoice-calculations';

// Types & Routes
import { DifferenceDialog } from '@/components/difference-dialog';
import { ExportDropdown } from '@/components/export-dropdown';
import { ImportItemsDialog } from '@/components/import-items-dialog';
import { InvoicePrintFooter } from '@/components/print-invoice-footer';
import { useInvoiceExport } from '@/hooks/use-invoice-export';
import { useInvoiceImport } from '@/hooks/use-invoice-import';
import { useScreenshot } from '@/hooks/use-screenshot';
import AppLayout from '@/layouts/app-layout';
import { invoices } from '@/routes';
import {
    bulkStore,
    destroyMany,
    duplicateMany,
    reorder,
} from '@/routes/invoices/items';
import { Boat } from '@/types/boat';
import { Customer } from '@/types/customer';
import { Invoice } from '@/types/invoice';
import { InvoiceItem } from '@/types/invoice-item';
import { Item } from '@/types/item';
import { toast } from 'sonner';

interface Props {
    invoice: Invoice & { items: InvoiceItem[] };
    boats: Boat[];
    items: Item[];
    customers: Customer[];
}

export default function InvoiceShow({
    invoice,
    boats,
    items,
    customers,
}: Props) {
    // --- State Management (Manual Synchronization) ---
    const [localItems, setLocalItems] = useState<InvoiceItem[]>(
        invoice.items || [],
    );
    const [prevItems, setPrevItems] = useState(invoice.items);

    const { exportToExcel, exportToCSV, exportToPDF } = useInvoiceExport();
    const { copyToClipboard } = useScreenshot();

    // State لـ Difference Dialog
    const [diffItem, setDiffItem] = useState<InvoiceItem | null>(null);
    const [isDiffOpen, setIsDiffOpen] = useState(false);

    // فـ Show.tsx
    if (invoice.items !== prevItems) {
        setPrevItems(invoice.items);
        setLocalItems(invoice.items);

        // هاد السطور هما اللي غيخليو الـ Dialog يزيد الـ Rows فالبلاصة
        if (isDiffOpen && diffItem) {
            const freshItem = invoice.items.find((i) => i.id === diffItem.id);

            if (freshItem) {
                setDiffItem(freshItem);
            }
        }
    }

    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

    // الحسابات
    const stats = useInvoiceCalculations(invoice);

    // Sensors لعملية الـ Drag & Drop
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    // --- Logic: Actions ---
    const confirmBulkDelete = () => {
        router.post(
            destroyMany(invoice.id),
            {
                _method: 'DELETE',
                ids: selectedIds,
            },
            {
                onSuccess: () => {
                    setSelectedIds([]);
                    setIsDeleteDialogOpen(false);
                },
                preserveScroll: true,
            },
        );
    };

    const handleBulkDuplicate = () => {
        if (selectedIds.length === 0) {
            return;
        }

        router.post(
            duplicateMany(invoice.id),
            { ids: selectedIds },
            {
                onSuccess: () => setSelectedIds([]),
                preserveScroll: true,
            },
        );
    };

    // --- Drag & Drop Logic ---
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (over && active.id !== over.id) {
            const isMovingBatch = selectedIds.includes(active.id as number);
            let newOrder: InvoiceItem[];

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
                const oldIndex = localItems.findIndex(
                    (i) => i.id === active.id,
                );
                const newIndex = localItems.findIndex((i) => i.id === over.id);
                newOrder = arrayMove(localItems, oldIndex, newIndex);
            }

            setLocalItems(newOrder);
            router.post(
                reorder(invoice.id),
                { items: newOrder.map((i) => i.id) },
                {
                    preserveScroll: true,
                    preserveState: true,
                },
            );
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExport = (type: 'excel' | 'csv' | 'pdf') => {
        if (type === 'excel') {
            exportToExcel(invoice, localItems);
        }

        if (type === 'pdf') {
            exportToPDF(invoice, localItems, stats);
        }

        if (type === 'csv') {
            exportToCSV(invoice, localItems);
        }
    };

    const handleScreenshot = () => {
        copyToClipboard('invoice-content');
    };

    const { parsePasteData } = useInvoiceImport(boats, items);

    const handleImport = (text: string) => {
        const rawData = parsePasteData(text);

        if (rawData.length === 0) {
            toast.error('Aucune donnée valide trouvée.');

            return;
        }

        const cleanData = rawData.map((row) => ({
            boat_id: row.boat_id,
            item_id: row.item_id,
            unit_count: row.unit_count,
            unit_price: row.unit_price,
            unit: row.unit,
            weight: row.weight,
        }));

        router.post(
            bulkStore(invoice.id),
            {
                items: cleanData,
            },
            {
                onSuccess: () => {
                    toast.success('Importation réussie !');
                    setSelectedIds([]);
                },
                onError: (errors) => {
                    console.log(errors);
                    toast.error("Erreur lors de l'importation.");
                },
                preserveScroll: true,
            },
        );
    };

    const handleOpenDifference = (item: InvoiceItem) => {
        setDiffItem(item);
        setIsDiffOpen(true);
    };

    return (
        <div className="mx-auto min-h-screen max-w-7xl space-y-6 bg-white p-6 font-sans text-slate-900">
            <Head title={`Facture ${invoice.invoice_number}`} />

            {/* Header & Stats */}
            <InvoiceHeader invoice={invoice} />
            <InvoiceStatsGrid stats={stats} />

            <div className="flex justify-end gap-4 print:hidden">
                <Button
                    onClick={handleScreenshot}
                    variant="outline"
                    size="sm"
                    title="Copy for WhatsApp"
                    className="h-9 border-slate-200 text-slate-500 shadow-sm hover:bg-slate-50"
                >
                    <Camera className="h-4 w-4" />
                </Button>

                <Button
                    onClick={handlePrint}
                    variant="outline"
                    size="sm"
                    className="h-9 border-slate-200 text-slate-500 shadow-sm hover:bg-slate-50"
                >
                    <Printer className="h-3 w-3" />
                </Button>

                <ImportItemsDialog onImport={handleImport} />

                <ExportDropdown onExport={handleExport} />
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between">
                {selectedIds.length > 0 ? (
                    <div className="flex animate-in items-center gap-3 duration-200 fade-in slide-in-from-left-2">
                        <div className="flex items-center gap-2">
                            <span className="rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600">
                                {selectedIds.length} sélectionnés
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1.5 px-2 text-[10px] font-black tracking-tighter text-slate-500 uppercase transition-colors hover:bg-red-50 hover:text-red-600"
                                onClick={() => setSelectedIds([])}
                            >
                                <X className="h-3.5 w-3.5" /> Annuler
                            </Button>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-2 text-xs"
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

            {/* Table Area */}
            <div
                id="invoice-content"
                className="relative overflow-hidden rounded-lg rounded-b-none border border-slate-100 shadow-sm"
            >
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToVerticalAxis]}
                >
                    <Table>
                        <TableHeader className="border-b border-slate-100 bg-slate-50/50">
                            <TableRow className="h-11 hover:bg-transparent">
                                <TableHead className="w-8 print:hidden"></TableHead>
                                <TableHead className="w-10 print:hidden">
                                    <Checkbox
                                        className="mt-1 mr-2"
                                        checked={
                                            selectedIds.length ===
                                            localItems.length &&
                                            localItems.length > 0
                                        }
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                setSelectedIds(
                                                    localItems.map((i) => i.id),
                                                );
                                            } else {
                                                setSelectedIds([]);
                                            }
                                        }}
                                    />
                                </TableHead>
                                <TableHead className="text-[10px] font-black tracking-tight text-slate-500 uppercase">
                                    Bateau
                                </TableHead>
                                <TableHead className="text-[10px] font-black tracking-tight text-slate-500 uppercase">
                                    Espèces
                                </TableHead>
                                <TableHead className="text-center text-[10px] font-black tracking-tight text-slate-500 uppercase">
                                    Qte / NC
                                </TableHead>
                                <TableHead className="text-right text-[10px] font-black tracking-tight text-slate-500 uppercase">
                                    Prix Unitaire
                                </TableHead>
                                <TableHead className="text-center text-[10px] font-black tracking-tight text-slate-500 uppercase">
                                    Unité
                                </TableHead>
                                <TableHead className="text-center text-[10px] font-black tracking-tight text-slate-500 uppercase">
                                    Poids
                                </TableHead>
                                <TableHead className="text-center text-[10px] font-black tracking-tight text-slate-500 uppercase">
                                    Caisses
                                </TableHead>
                                <TableHead className="px-6 text-right text-[10px] font-black tracking-tight text-slate-500 uppercase">
                                    Valeur DH
                                </TableHead>
                                <TableHead className="w-12 print:hidden"></TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            <InvoiceItemRow
                                invoiceId={invoice.id}
                                boats={boats}
                                items={items}
                                isNew={true}
                                onOpenDifference={() => { }} // New row doesn't need this
                            />

                            <SortableContext
                                items={localItems.map((i) => i.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {localItems.map((row) => (
                                    <InvoiceItemRow
                                        key={row.id}
                                        invoiceId={invoice.id}
                                        item={row}
                                        boats={boats}
                                        items={items}
                                        selected={selectedIds.includes(row.id)}
                                        onSelectChange={(checked) => {
                                            setSelectedIds((prev) =>
                                                checked
                                                    ? [...prev, row.id]
                                                    : prev.filter(
                                                        (id) => id !== row.id,
                                                    ),
                                            );
                                        }}
                                        onOpenDifference={handleOpenDifference}
                                    />
                                ))}
                            </SortableContext>
                        </TableBody>
                    </Table>

                    <DragOverlay dropAnimation={null}>
                        {activeId
                            ? (() => {
                                const isSelected = selectedIds.includes(
                                    activeId as number,
                                );
                                const itemsToDisplay = isSelected
                                    ? localItems.filter((item) =>
                                        selectedIds.includes(item.id),
                                    )
                                    : localItems.filter(
                                        (item) => item.id === activeId,
                                    );

                                return (
                                    <InvoiceItemDragOverlay
                                        items={itemsToDisplay}
                                    />
                                );
                            })()
                            : null}
                    </DragOverlay>
                </DndContext>
            </div>

            <InvoicePrintFooter stats={stats} />

            <DeleteManyItemsDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={confirmBulkDelete}
                count={selectedIds.length}
            />

            {/* Difference Dialog Component */}
            {diffItem && (
                <DifferenceDialog
                    key={diffItem.id}
                    open={isDiffOpen}
                    onOpenChange={setIsDiffOpen}
                    item={diffItem}
                    customers={customers}
                    items={items}
                    sessionZoneId={invoice.session_zone_id}
                    date={invoice.date}
                />
            )}
        </div>
    );
}

InvoiceShow.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Factures', href: invoices() },
            { title: 'Détails de la Facture', href: '#' },
        ]}
    >
        {page}
    </AppLayout>
);
