// components/sessions/receipt-detail-card.tsx
import { Receipt } from "@/types/receipt";
import { Card, CardContent } from "@/components/ui/card";
import { Anchor, ReceiptText } from "lucide-react";

export function ReceiptDetailCard({ receipt }: { receipt: Receipt }) {
    return (
        <Card className="mb-3 border-l-4 border-l-blue-500 bg-slate-50/50">
            <CardContent className="p-4">
                <div className="flex justify-between items-center">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 font-semibold text-blue-700">
                            <Anchor className="h-4 w-4" />
                            {receipt.boat_id ? `Merkeb ID: ${receipt.boat_id}` : 'Merkeb'}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                            <ReceiptText className="h-3 w-3" />
                            Bon N° {receipt.id} | {receipt.total_boxes} Boxes
                        </div>
                    </div>
                    <div className="font-bold text-slate-700">
                        {receipt.total_amount.toLocaleString()} MAD
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}