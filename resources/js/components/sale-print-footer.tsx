import { SaleStats } from '@/types/sale-stats';

interface Props {
    stats: SaleStats;
}

export function SalePrintFooter({ stats }: Props) {
    return (
        <div className="hidden print:block mt-6 border-slate-100 pt-6 font-sans">
            {/* Upper Part: Summary Stats */}
            <div className="grid grid-cols-2 gap-8 mb-10">
                <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Total Caisses</p>

                    <p className="text-sm font-medium text-slate-700">
                        {stats.totalBoxes} <span className="text-[10px] text-slate-400 font-normal italic">PCS</span>
                    </p>
                </div>

                <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Total Poids</p>

                    <p className="text-sm font-medium text-slate-700">
                        {stats.formattedWeight} <span className="text-[10px] text-slate-400 font-normal italic">KG</span>
                    </p>
                </div>
            </div>

            {/* Bottom Part: Final Amount */}
            <div className="flex justify-end">
                <div className="w-72 space-y-3">
                    <div className="flex justify-between items-baseline pt-1">
                        <span className="text-base uppercase font-black text-slate-900 tracking-tighter">Net à Payer</span>

                        <div className="text-right">
                            <span className="text-2xl font-black text-slate-900">{stats.formattedNetToPay}</span>
                            <span className="text-[10px] font-bold text-slate-900 ml-1">DH</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}