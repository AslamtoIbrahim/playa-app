import { SessionSection } from '@/components/session-section';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent
} from '@/components/ui/card';
import {
    SessionDetailProps
} from '@/types/daily-session';
import { Head } from '@inertiajs/react';

export default function SessionsShow({ session, purchaseData, saleData }: SessionDetailProps) {
    
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
            <Head title={`Session - ${session.session_date}`} />

            <div className="flex justify-between items-center bg-white p-6 rounded-xl border shadow-sm">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900">
                        Détails de la Session
                    </h1>
                    <p className="text-slate-600 mt-1 text-lg">
                        Journée du {formatDate(session.session_date)}
                    </p>
                </div>

                <div className="flex gap-3">
                    <Badge variant={session.status === 'open' ? 'outline' : 'secondary'} className="px-4 py-1 text-md">
                        {session.status.toUpperCase()}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                <SessionSection 
                    title="Section Achat" 
                    data={purchaseData} 
                    type="purchase" 
                />

                <SessionSection 
                    title="Section Vente" 
                    data={saleData} 
                    type="sale" 
                />
                
            </div>

            <Card className="bg-slate-50 border-dashed">
                <CardContent className="pt-6">
                    <div className="flex justify-between items-center font-bold text-2xl">
                        <span>Marge Brute Totale</span>
                        <span className={saleData.total - purchaseData.total >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {(saleData.total - purchaseData.total).toLocaleString()} MAD
                        </span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}