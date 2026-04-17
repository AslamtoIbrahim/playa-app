import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { UniqueIdentifier, DragStartEvent, DragEndEvent, closestCenter, DndContext, DragOverlay, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { Trash2, Copy, X, Printer, Camera } from 'lucide-react';

// UI Components
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DeleteManyItemsDialog } from '@/components/delete-many-items';
import InvoiceItemRow from '@/components/invoice-item-row';
import InvoiceItemDragOverlay from '@/components/invoice-item-drag-overlay';

// New Extracted Components & Hooks
import { InvoiceHeader } from '@/components/invoice-header';
import { InvoiceStatsGrid } from '@/components/invoice-stats-grid';
import { useInvoiceCalculations } from '@/hooks/use-invoice-calculations';

// Types & Routes
import { Invoice } from '@/types/invoice';
import { Boat } from '@/types/boat';
import { Item } from '@/types/item';
import { InvoiceItem } from '@/types/invoice-item';
import { bulkStore, destroyMany, duplicateMany, reorder } from '@/routes/invoices/items';
import { InvoicePrintFooter } from '@/components/print-invoice-footer';
import { useInvoiceExport } from '@/hooks/use-invoice-export';
import { InvoiceExportDropdown } from '@/components/invoice-export-dropdown';
import { useInvoiceScreenshot } from '@/hooks/use-invoice-screenshot';
import { useInvoiceImport } from '@/hooks/use-invoice-import';
import { toast } from 'sonner';
import { ImportItemsDialog } from '@/components/import-items-dialog';

interface Props {
    invoice: Invoice & { items: InvoiceItem[] };
    boats: Boat[];
    items: Item[];
}

export default function Show({ invoice, boats, items }: Props) {
    // --- State Management (Manual Synchronization) ---
    const [localItems, setLocalItems] = useState<InvoiceItem[]>(invoice.items || []);
    const [prevItems, setPrevItems] = useState(invoice.items);

    const { exportToExcel, exportToCSV, exportToPDF } = useInvoiceExport();
    const { copyToClipboard } = useInvoiceScreenshot();

    // تصحيح الـ State فاش كيتبدل الـ Prop بلا useEffect
    if (invoice.items !== prevItems) {
        setPrevItems(invoice.items);
        setLocalItems(invoice.items);
    }

    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

    // الحسابات
    const stats = useInvoiceCalculations(invoice);

    // Sensors لعملية الـ Drag & Drop
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // --- Logic: Actions ---
    const confirmBulkDelete = () => {
        router.post(destroyMany(invoice.id), {
            _method: 'DELETE',
            ids: selectedIds,
        }, {
            onSuccess: () => {
                setSelectedIds([]);
                setIsDeleteDialogOpen(false);
            },
            preserveScroll: true,
        });
    };

    const handleBulkDuplicate = () => {
        if (selectedIds.length === 0) {
            return;
        }

        router.post(duplicateMany(invoice.id), { ids: selectedIds }, {
            onSuccess: () => setSelectedIds([]),
            preserveScroll: true,
        });
    };

    // --- Drag & Drop Logic ---
    const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (over && active.id !== over.id) {
            const isMovingBatch = selectedIds.includes(active.id as number);
            let newOrder: InvoiceItem[];

            if (isMovingBatch) {
                const movingItems = localItems.filter(item => selectedIds.includes(item.id));
                const remainingItems = localItems.filter(item => !selectedIds.includes(item.id));
                const overIndexInRemaining = remainingItems.findIndex(item => item.id === over.id);
                newOrder = [...remainingItems];
                newOrder.splice(overIndexInRemaining, 0, ...movingItems);
            } else {
                const oldIndex = localItems.findIndex((i) => i.id === active.id);
                const newIndex = localItems.findIndex((i) => i.id === over.id);
                newOrder = arrayMove(localItems, oldIndex, newIndex);
            }

            setLocalItems(newOrder);
            router.post(reorder(invoice.id), { items: newOrder.map((i) => i.id) }, {
                preserveScroll: true,
                preserveState: true,
            });
        }
    };

    const handlePrint = () => {
        window.print();
    };



    const handleExport = (type: 'excel' | 'csv' | 'pdf') => {
        if (type === 'excel') {
            // Google Sheets كيقبل ملفات Excel عادي
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
        copyToClipboard();
    };

    // داخل Show.tsx
    const { parsePasteData } = useInvoiceImport(boats, items);

    const handleImport = (text: string) => {
        const rawData = parsePasteData(text);

        if (rawData.length === 0) {
            toast.error("Aucune donnée valide trouvée.");
            
            return;
        }

        // 🧹 تصفية الداتا: كنصيفطو غير لي محتاج الـ Backend
        const cleanData = rawData.map(row => ({
            boat_id: row.boat_id,
            item_id: row.item_id,
            unit_count: row.unit_count,
            unit_price: row.unit_price,
            unit: row.unit,
            weight: row.weight,
        }));

        router.post(bulkStore(invoice.id), {
            items: cleanData // دابا TypeScript غادي يكون فرحان
        }, {
            onSuccess: () => {
                toast.success("Importation réussie !");
                setSelectedIds([]);
            },
            onError: (errors) => {
                console.log(errors);
                toast.error("Erreur lors de l'importation.");
            },
            preserveScroll: true
        });
    };



    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto bg-white min-h-screen text-slate-900 font-sans">
            <Head title={`Facture ${invoice.invoice_number}`} />


            {/* Header & Stats */}
            <InvoiceHeader invoice={invoice} />
            <InvoiceStatsGrid stats={stats} />
            {/* زر الطباعة - نضعه فوق الـ Header على اليمين */}
            <div className="flex justify-end gap-4 print:hidden">
                <Button
                    onClick={handleScreenshot}
                    variant="outline"
                    size="sm"
                    title="Copy for WhatsApp"
                    className="h-9 border-slate-200 shadow-sm hover:bg-slate-50 text-slate-500"
                >
                    <Camera className="h-4 w-4" />
                </Button>
                <Button
                    onClick={handlePrint}
                    variant="outline"
                    size="sm"
                    className="h-9 border-slate-200 shadow-sm hover:bg-slate-50 text-slate-500"
                >
                    <Printer className="h-3 w-3" />
                </Button>

                <ImportItemsDialog onImport={handleImport} />

                <InvoiceExportDropdown
                    onExport={handleExport}
                />
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between">
                {selectedIds.length > 0 ? (
                    <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-200">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                {selectedIds.length} sélectionnés
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2 text-[10px] text-slate-500 hover:text-red-600 hover:bg-red-50 uppercase font-black tracking-tighter gap-1.5 transition-colors"
                                onClick={() => setSelectedIds([])}
                            >
                                <X className="h-3.5 w-3.5" /> Annuler
                            </Button>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="h-8 text-xs gap-2" onClick={handleBulkDuplicate}>
                                <Copy className="h-3.5 w-3.5" /> Dupliquer
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                className="h-8 text-xs gap-2"
                                onClick={() => setIsDeleteDialogOpen(true)}
                            >
                                <Trash2 className="h-3.5 w-3.5" /> Supprimer
                            </Button>
                        </div>
                    </div>
                ) : <div />}
            </div>

            {/* Table Area */}
            <div id="invoice-content" className="border border-slate-100 rounded-lg rounded-b-none overflow-hidden shadow-sm relative">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToVerticalAxis]}
                >
                    <Table>
                        <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                            <TableRow className="h-11 hover:bg-transparent">
                                <TableHead className="w-8 print:hidden"></TableHead>
                                <TableHead className="w-10 print:hidden">
                                    <Checkbox
                                        className='mr-2 mt-1'
                                        checked={selectedIds.length === localItems.length && localItems.length > 0}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                setSelectedIds(localItems.map(i => i.id));
                                            } else {
                                                setSelectedIds([]);
                                            }
                                        }}
                                    />
                                </TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-tight text-slate-500">Bateau</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-tight text-slate-500">Espèces</TableHead>
                                <TableHead className="text-center text-[10px] font-black uppercase tracking-tight text-slate-500">Qte / NC</TableHead>
                                <TableHead className="text-right text-[10px] font-black uppercase tracking-tight text-slate-500">Prix Unitaire</TableHead>
                                <TableHead className="text-center text-[10px] font-black uppercase tracking-tight text-slate-500">Unité</TableHead>
                                <TableHead className="text-center text-[10px] font-black uppercase tracking-tight text-slate-500">Poids</TableHead>
                                <TableHead className="text-right px-6 text-[10px] font-black uppercase tracking-tight text-slate-500">Valeur DH</TableHead>
                                <TableHead className="w-12 print:hidden"></TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {/* Input row for new entries */}
                            <InvoiceItemRow invoiceId={invoice.id} boats={boats} items={items} isNew={true} />

                            <SortableContext items={localItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                                {localItems.map((row) => (
                                    <InvoiceItemRow
                                        key={row.id}
                                        invoiceId={invoice.id}
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
                        {activeId ? (() => {
                            const isSelected = selectedIds.includes(activeId as number);
                            const itemsToDisplay = isSelected
                                ? localItems.filter(item => selectedIds.includes(item.id))
                                : localItems.filter(item => item.id === activeId);

                            return <InvoiceItemDragOverlay items={itemsToDisplay} />;
                        })() : null}
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
        </div>
    );
}