import { closestCenter, DndContext, DragEndEvent, DragOverlay, DragStartEvent, KeyboardSensor, PointerSensor, UniqueIdentifier, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Head, router } from '@inertiajs/react';
import { Copy, Printer, Trash2, X, ArrowLeft, Camera } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

// UI Components
import { DeleteManyItemsDialog } from '@/components/delete-many-items';
import ReceiptItemDragOverlay from '@/components/receipt-item-drag-overlay';
import ReceiptItemRow from '@/components/receipt-item-row';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Components & Hooks
import AppLayout from '@/layouts/app-layout';

// Routes
import { destroyMany, duplicateMany, reorder } from '@/routes/receipts/items';

// Types
import { Item } from '@/types/item';
import { Receipt } from '@/types/receipt';
import { ReceiptItem } from '@/types/receipt-item';
import { formatDateDisplay } from '@/lib/date';
import { useScreenshot } from '@/hooks/use-screenshot';
import { useReceiptExport } from '@/hooks/use-receipt-export';
import { ExportDropdown } from '@/components/export-dropdown';
import { useReceiptImport } from '@/hooks/use-receipt-import';
import { ImportItemsDialog } from '@/components/import-items-dialog';

interface Props {
    receipt: Receipt & {
        items: ReceiptItem[],
        customer?: { name: string },
        boat?: { name: string }
    };
    items: Item[];
}

export default function ReceiptShow({ receipt, items }: Props) {
    const [localItems, setLocalItems] = useState<ReceiptItem[]>(receipt.items || []);

    const [prevItems, setPrevItems] = useState(receipt.items);

    const { copyToClipboard } = useScreenshot();

    if (receipt.items !== prevItems) {
        setPrevItems(receipt.items);
        setLocalItems(receipt.items);
    }

    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const { exportToExcel, exportToPDF } = useReceiptExport();

    const handleExport = (type: 'excel' | 'pdf' | 'csv') => {
        if (type === 'excel') {
            exportToExcel(receipt);
        }

        if (type === 'pdf') {
            exportToPDF(receipt);
        }
    };


    const { parsePasteData } = useReceiptImport(items);

    /**
     * معالجة عملية الاستيراد مع تنظيف البيانات للـ TypeScript
     */
    const handleImport = (text: string) => {
        const rawData = parsePasteData(text);

        console.log('msg',rawData);

        if (rawData.length === 0) {
            toast.error("Aucune donnée valide trouvée.");

            return;
        }

        /**
         * تحويل البيانات لتنسيق يقبله Inertia ويطابق الـ Controller
         * كنصيفطو فقط الـ IDs والأرقام، بلا الـ Objects ديال الـ Relations
         */
        const cleanData = rawData.map((row) => {
            return {
                item_id: row.item_id,
                unit_count: row.unit_count || 0,     // qty في الـ Hook هي unit_count في الـ DB
                real_price: row.real_price || 0,   // price في الـ Hook هي real_price في الـ DB
                box: row.box || 0,          // boxes في الـ Hook هي box في الـ DB
            };
        });

        router.post(`/receipts/${receipt.id}/items/bulk`, {
            items: cleanData
        }, {
            onSuccess: () => {
                toast.success("Importation réussie !");
                setSelectedIds([]);
            },
            onError: (errors) => {
                console.error(errors);
                toast.error("Erreur lors de l'importation.");
            },
            preserveScroll: true
        });
    };




    const confirmBulkDelete = () => {
        router.post(destroyMany(receipt.id), {
            _method: 'DELETE',
            ids: selectedIds,
        }, {
            onSuccess: () => {
                setSelectedIds([]);
                setIsDeleteDialogOpen(false);
                toast.success("Éléments supprimés");
            },
            preserveScroll: true,
        });
    };

    const handleBulkDuplicate = () => {
        if (selectedIds.length === 0) {
            return;
        }

        router.post(duplicateMany(receipt.id), { ids: selectedIds }, {
            onSuccess: () => {
                setSelectedIds([]);
                toast.success("Éléments dupliqués");
            },
            preserveScroll: true,
        });
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (over && active.id !== over.id) {
            const isMovingBatch = selectedIds.includes(active.id as number);
            let newOrder: ReceiptItem[];

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
            router.post(reorder(receipt.id), { items: newOrder.map((i) => i.id) }, {
                preserveScroll: true,
                preserveState: true,
            });
        }
    };

    const handleScreenshot = () => {
        copyToClipboard('receipt-content', {
            style: { width: '280mm' }
        });
    };


    return (
        <div className="p-8 space-y-2 max-w-5xl mx-auto bg-white min-h-screen text-slate-900">
            <Head title={`Bon de Réception #${receipt.id}`} />

            {/* Top Navigation */}
            <div className="flex justify-between items-center print:hidden">
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-slate-800 p-0 h-auto"
                    onClick={() => router.get('/receipts')}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour
                </Button>

                <div className='space-x-2'>
                    <Button
                        onClick={handleScreenshot}
                        variant="outline"
                        size="sm"
                        title="Copy for WhatsApp"
                        className="h-9 border-slate-200 shadow-sm hover:bg-slate-50 text-slate-500"
                    >
                        <Camera className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => window.print()} className="h-9 w-9 border-slate-200">
                        <Printer className="h-4 w-4 text-slate-600" />
                    </Button>

                    <ImportItemsDialog onImport={handleImport} />

                    <ExportDropdown onExport={handleExport} />
                </div>
            </div>

            <div className='mt-4  px-2' id="receipt-content">
                {/* Header: Date & Customer & Boat (Clean & Simple) */}
                <div className="space-y-4" >
                    <div className="border-t border-slate-100 pt-4">
                        <h1 className="text-lg font-bold tracking-tight text-slate-900">
                            {formatDateDisplay(receipt.date)}
                        </h1>
                    </div>
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                Client Destination
                            </p>
                            <p className="text-lg uppercase font-bold text-slate-800">
                                {receipt.customer?.name || 'Client non spécifié'}
                            </p>
                        </div>
                        {/* Boat: Dynamic rendering based on availability */}
                        {receipt.boat?.name && (
                            <div className="text-right space-y-1">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                    Bateau
                                </p>
                                <p className="text-lg font-bold text-slate-900 uppercase">
                                    {receipt.boat.name}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
                {/* Bulk Toolbar */}
                <div className="h-10 my-2">
                    {selectedIds.length > 0 && (
                        <div className="flex items-center gap-6 animate-in fade-in slide-in-from-left-2 print:hidden">
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full">
                                {selectedIds.length} sélectionnés
                            </span>
                            <div className="flex gap-4">
                                <Button variant="ghost" size="sm" className="h-8 bg-destructive/8 text-xs" onClick={() => setSelectedIds([])}>
                                    <X className="h-4 w-4" /> Annuler
                                </Button>
                                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleBulkDuplicate}>
                                    <Copy className="h-3.5 w-3.5" /> Dupliquer
                                </Button>
                                <Button variant="destructive" size="sm" className="h-8 text-xs" onClick={() => setIsDeleteDialogOpen(true)}>
                                    <Trash2 className="h-3.5 w-3.5" /> Supprimer
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
                {/* Table Area (Simple Design) */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
                        <Table>
                            <TableHeader className="bg-slate-50/50 border-b border-slate-200">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-10 print:hidden"></TableHead>
                                    <TableHead className="w-10 print:hidden">
                                        <Checkbox
                                            checked={selectedIds.length === localItems.length && localItems.length > 0}
                                            onCheckedChange={(checked) => setSelectedIds(checked ? localItems.map(i => i.id) : [])}
                                        />
                                    </TableHead>
                                    <TableHead className="text-center font-bold text-foreground">Caisses</TableHead>

                                    <TableHead className="w-[30%] font-bold text-foreground">Article</TableHead>
                                    <TableHead className="text-center font-bold text-foreground">Quantité</TableHead>
                                    <TableHead className="text-center font-bold text-foreground">Prix Unitaire</TableHead>
                                    <TableHead className="text-center font-bold text-foreground">Montant</TableHead>

                                    <TableHead className="w-12 print:hidden"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {/* New Item Entry Row */}
                                <ReceiptItemRow receiptId={receipt.id} items={items} isNew={true} />
                                <SortableContext items={localItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                                    {localItems.map((row) => (
                                        <ReceiptItemRow
                                            key={row.id}
                                            receiptId={receipt.id}
                                            item={row}
                                            items={items}
                                            selected={selectedIds.includes(row.id)}
                                            onSelectChange={(checked) => {
                                                setSelectedIds(prev => checked ? [...prev, row.id] : prev.filter(id => id !== row.id));
                                            }}
                                        />
                                    ))}
                                </SortableContext>
                            </TableBody>
                        </Table>
                        <DragOverlay dropAnimation={null}>
                            {activeId ? (
                                <ReceiptItemDragOverlay items={localItems.filter(item => selectedIds.includes(activeId as number) ? selectedIds.includes(item.id) : item.id === activeId)} />
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                </div>
                {/* Simple Totals (Matches image_fdaed6.png footer) */}
                <div className="flex flex-col items-end space-y-4 pt-4 pr-2 ">
                    <div className="flex items-center justify-between gap-6 text-slate-500">
                        <span className="text-xs text-start font-medium text-slate-400">Total Caisses</span>
                        <span className="font-bold text-slate-900 text-md">{receipt.total_boxes || 0}</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Total Montant
                        </span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-slate-900 tracking-tight">
                                {(Number(receipt.total_amount) || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0 })}
                            </span>
                            <span className="text-xs font-bold text-slate-400 uppercase">DH</span>
                        </div>
                    </div>
                </div>
            </div>

            <DeleteManyItemsDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={confirmBulkDelete}
                count={selectedIds.length}
            />
        </div>
    );
}

ReceiptShow.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Bons de réception', href: '/receipts' },
            { title: 'Détails du bon', href: '#' },
        ]}
    >
        {page}
    </AppLayout>
);