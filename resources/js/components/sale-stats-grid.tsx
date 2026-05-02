import { Card, CardContent } from '@/components/ui/card';
import { SaleStats } from '@/types/sale-stats';
import { Package } from 'lucide-react';

export function SaleStatsGrid({ stats }: { stats: SaleStats }) {

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 print:hidden">
            {/* Total Caisses */}
            <Card className="shadow-none border-amber-200 h-24 flex flex-col justify-center">
                <CardContent className="p-4 py-0">
                    <p className="text-[9px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Total Caisses</p>
                    
                    <div className='flex items-center gap-2'>
                        <p className="text-xl font-bold text-slate-700">{stats.totalBoxes}</p>
                        <Package className="h-4 w-4 text-slate-400" />
                    </div>
                </CardContent>
            </Card>

            {/* Total Poids */}
            <Card className="shadow-none border-amber-200 h-24 flex flex-col justify-center">
                <CardContent className="p-4 py-0">
                    <p className="text-[9px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Total Poids</p>
                    
                    <div className='flex items-center gap-2'>
                        <p className="text-xl font-bold text-slate-700">{stats.formattedWeight}</p>
                        <span className="text-xs text-slate-600 font-semibold opacity-50">Kg</span>
                    </div>
                </CardContent>
            </Card>

            {/* Net à Payer Card */}
            <Card className="shadow-none border-none bg-stone-900 text-white h-24 flex flex-col justify-center">
                <CardContent className="p-4 py-0">
                    <div className="flex justify-between items-center mb-0.5">
                        <p className="text-[9px] uppercase font-bold opacity-50 tracking-wider">Net à Payer</p>
                        <span className="text-[8px] bg-emerald-500/20 text-lime-200 px-1.5 py-0.5 rounded font-bold uppercase">Final</span>
                    </div>

                    <div className='flex items-baseline gap-1'>
                        <p className="text-xl font-black tracking-tight">{stats.formattedNetToPay}</p>
                        <span className="text-[10px] font-light opacity-60">DH</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}