// components/sessions/difference-detail-card.tsx
import { Difference } from "@/types/difference";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, User, ShoppingCart } from "lucide-react";

export function DifferenceDetailCard({ diff }: { diff: Difference }) {
    return (
        <Card className="mb-3 border-l-4 border-l-orange-500">
            <CardContent className="p-4">
                <div className="flex justify-between items-center">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 font-semibold">
                            <User className="h-4 w-4 text-slate-400" />
                            {diff.customer?.name || 'Client'}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                            <ShoppingCart className="h-3 w-3" />
                            {diff.item?.name || 'Produit'} | {diff.unit_count} Qte
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-1 text-orange-600 font-bold">
                            <TrendingUp className="h-4 w-4" />
                            +{diff.total_diff.toLocaleString()} MAD
                        </div>
                        <div className="text-[10px] text-slate-400">Ecart de prix</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}