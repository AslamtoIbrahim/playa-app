import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import ReceptionRecordRow from '@/components/reception-record-row';
import { usines as usinesIndex } from '@/routes';
import type { ReceptionRecord } from '@/types/reception-record';
import type { Usine } from '@/types/usine';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Building2 } from 'lucide-react';

interface Props {
    usine: Usine;
    receptionRecords: ReceptionRecord[];
}

export default function UsineShowPage({ usine, receptionRecords }: Props) {
    return (
        <>
            <Head title={`Réceptions - ${usine.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 bg-neutral-100 p-4 lg:p-8 dark:bg-neutral-950">
                <button
                    type="button"
                    onClick={() => router.visit(usinesIndex().url)}
                    className="inline-flex w-fit cursor-pointer items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Retour aux usines
                </button>

                <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        {usine.name}
                    </div>
                    <h1 className="mt-1 text-2xl font-black tracking-tight text-neutral-900 uppercase dark:text-neutral-100">
                        Réceptions
                    </h1>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/90">
                    <Table className="min-w-[1400px]">
                        <TableHeader>
                            <TableRow className="border-0 bg-blue-500 hover:bg-blue-500">
                                {[
                                    'DATE',
                                    'RECEP',
                                    'DESIGNATION',
                                    'ORIGINE',
                                    'TTC',
                                    'PRIX MOYEN',
                                    "VALEUR D'ACHAT",
                                    'POURCENTAGE',
                                    'VALEUR DE VENTE',
                                    'FACTURATION',
                                    'BON RECEP',
                                    'ACTIONS',
                                ].map((heading) => (
                                    <TableHead
                                        key={heading}
                                        className="text-center font-bold whitespace-nowrap text-white"
                                    >
                                        {heading}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {receptionRecords.map((record, index) => (
                                <ReceptionRecordRow
                                    key={`${record.id}-${record.designation}-${index}`}
                                    usineId={usine.id}
                                    record={record}
                                />
                            ))}
                            {receptionRecords.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={12}
                                        className="py-20 text-center text-muted-foreground"
                                    >
                                        Aucune réception enregistrée pour cette
                                        usine.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </>
    );
}

UsineShowPage.layout = {
    breadcrumbs: [{ title: 'Usines', href: '/usines' }],
};
