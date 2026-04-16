import { Stats } from "@/types/stats";

interface Props {
    stats: Stats;
}

export function InvoicePrintFooter({ stats }: Props) {
    return (
        <div className="hidden print:block mt-12 border-t border-slate-100 pt-6 font-sans">
            {/* الجزء العلوي: الطوطالات بتصميم خفيف */}
            <div className="grid grid-cols-3 gap-8 mb-10">
                <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Total Caisses</p>
                    <p className="text-sm font-medium text-slate-700">{stats.totalBoxes} <span className="text-[10px] text-slate-400">Units</span></p>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Total Poids</p>
                    <p className="text-sm font-medium text-slate-700">{stats.formattedWeight} <span className="text-[10px] text-slate-400">KG</span></p>
                </div>
                <div className="space-y-1 text-right">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Total Hors Taxe</p>
                    <p className="text-sm font-medium text-slate-700">{stats.formattedTotalHT} <span className="text-[10px] text-slate-400">DH</span></p>
                </div>
            </div>

            {/* الجزء السفلي: تفاصيل الدفع */}
            <div className="flex justify-end">
                <div className="w-64 space-y-3">
                    <div className="flex justify-between text-[11px] text-slate-500">
                        <span>TVA (3%) + Caisses</span>
                        <span>+{stats.formattedTaxAndBoxes} DH</span>
                    </div>
                    
                    {/* خط فاصل خفيف جدا */}
                    <div className="h-px bg-slate-100 w-full" />

                    <div className="flex justify-between items-baseline">
                        <span className="text-base uppercase font-bold text-slate-900 tracking-tighter">Net à Payer</span>
                        <div className="text-right">
                            <span className="text-xl font-bold text-slate-900">{stats.formattedNetToPay}</span>
                            <span className="text-[10px] font-bold text-slate-900 ml-1">DH</span>
                        </div>
                    </div>
                </div>
            </div>
            
             
        </div>
    );
}