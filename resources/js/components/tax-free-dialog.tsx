import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Receipt } from "lucide-react";
import { TaxFreeRow } from "./taxtfree-row";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    details: any[]; // Hadu huma l-items dyal l-client
    customerName?: string;
    customerId: number;
}

export function TaxFreeDialog({ open, onOpenChange, details, customerName, customerId }: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl w-[95vw] p-0 flex flex-col max-h-[90vh]">
                <DialogHeader className="p-6 bg-slate-50 border-b shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <DialogTitle className="flex items-center gap-2">
                                <Receipt className="h-5 w-5 text-blue-600" />
                                Répartition Hors-Taxe: {customerName}
                            </DialogTitle>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <span>Nombre d'articles: <strong>{details.length}</strong></span>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-auto p-4">
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader className="bg-slate-50 sticky top-0 z-10">
                                <TableRow>
                                    <TableHead className="w-[30%]">Article</TableHead>
                                    <TableHead className="w-[15%] text-center">Quantité</TableHead>
                                    <TableHead className="w-[15%] text-center">Prix Réel (HT)</TableHead>
                                    <TableHead className="w-[20%] text-center">Montant</TableHead>
                                    <TableHead className="w-[10%] text-center">Caisse</TableHead>
                                    <TableHead className="w-[10%] text-center">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {details.map((diff) => (
                                    <TaxFreeRow
                                        key={diff.id}
                                        diff={diff}
                                        customerId={customerId}
                                    />
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}