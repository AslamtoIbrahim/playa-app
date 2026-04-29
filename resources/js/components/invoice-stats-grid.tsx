import { Card, CardContent } from '@/components/ui/card';
import { Stats } from '@/types/stats';
import { Package } from 'lucide-react';

export function InvoiceStatsGrid({ stats }: { stats: Stats }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:hidden">
            <Card className="shadow-none border-slate-100 h-24 flex flex-col justify-center">
                <CardContent className="p-4 py-0">
                    <p className="text-[9px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Total Caisses</p>
                    <div className='flex items-center gap-2'>
                        <p className="text-xl font-bold text-slate-700">{stats.totalBoxes}</p>
                        <Package className="h-4 w-4 text-slate-400" />
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-none border-slate-100 h-24 flex flex-col justify-center">
                <CardContent className="p-4 py-0">
                    <p className="text-[9px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Total Poids</p>
                    <p className="text-xl font-bold text-slate-700">{stats.formattedWeight} <span className="text-xs font-normal opacity-50">KG</span></p>
                </CardContent>
            </Card>

            <Card className="shadow-none border-slate-100 h-24 flex flex-col justify-center">
                <CardContent className="p-4 py-0">
                    <p className="text-[9px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Total HT</p>
                    <p className="text-xl font-bold text-blue-600">{stats.formattedTotalHT}</p>
                </CardContent>
            </Card>

            <Card className="shadow-none border-none bg-slate-900 text-white h-24 flex flex-col justify-center">
                <CardContent className="p-4 py-0">
                    <div className="flex justify-between items-center mb-0.5">
                        <p className="text-[9px] uppercase font-bold opacity-50 tracking-wider">Net à Payer</p>
                        <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase">Total</span>
                    </div>
                    <p className="text-xl font-black tracking-tight">{stats.formattedNetToPay} <span className="text-[10px] font-light opacity-60 ml-0.5">DH</span></p>
                    <div className="mt-1.5 flex justify-between items-center border-t border-white/10 pt-1">
                        <span className="text-[8px] opacity-50 font-bold uppercase">TVA (3%) + Caisses</span>
                        <span className="text-[12px] font-medium text-slate-400">+{stats.formattedTaxAndBoxes}</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}