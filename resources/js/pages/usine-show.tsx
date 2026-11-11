import ReceptionRecordRow from '@/components/reception-record-row';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { usines as usinesIndex } from '@/routes';
import type { ReceptionRecord } from '@/types/reception-record';
import type { Usine } from '@/types/usine';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Building2, Package } from 'lucide-react';

interface Props {
    usine: Usine;
    receptionRecords: ReceptionRecord[];
}

const headings = [
    'DATE',
    'RECEP',
    'DESIGNATION',
    'ORIGINE',
    'TTC',
    'PRIX MOY',
    'ACHAT',
    '%',
    'VENTE',
    'FACT',
    'RÉF',
];

export default function UsineShowPage({ usine, receptionRecords }: Props) {
    return (
        <>
            <Head title={`Réceptions - ${usine.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 lg:p-8">
                <button
                    type="button"
                    onClick={() => router.visit(usinesIndex().url)}
                    className="inline-flex w-fit cursor-pointer items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Retour aux usines
                </button>

                <div className="px-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        {usine.name}
                    </div>
                    <h1 className="mt-1 text-2xl font-black tracking-tight text-neutral-900 uppercase dark:text-neutral-100">
                        Réceptions
                    </h1>
                </div>

                <div className="min-w-0 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/90">
                    <Table>
                        <TableHeader className="bg-neutral-50/50 dark:bg-neutral-800/50">
                            <TableRow className="border-b border-neutral-200 text-sm hover:bg-transparent dark:border-neutral-800">
                                {headings.map((heading) => (
                                    <TableHead
                                        key={heading}
                                        className={`text-center leading-tight font-bold text-neutral-800 dark:text-neutral-200 ${
                                            heading === 'PRIX MOY.' ||
                                            heading === 'VAL. VENTE'
                                                ? 'whitespace-nowrap'
                                                : 'whitespace-normal'
                                        }`}
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
                                        colSpan={headings.length}
                                        className="py-16 text-center font-medium text-muted-foreground italic dark:text-neutral-400"
                                    >
                                        Aucune réception enregistrée pour cette
                                        usine.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50/50 px-6 py-3 dark:border-neutral-800 dark:bg-neutral-800/50">
                        <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-neutral-500 uppercase dark:text-neutral-400">
                            <Package className="h-4 w-4" />
                            {receptionRecords.length} réception(s) au total
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

UsineShowPage.layout = {
    breadcrumbs: [{ title: 'Usines', href: '/usines' }],
};
