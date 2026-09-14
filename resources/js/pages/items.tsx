import { Head } from '@inertiajs/react';
import { Box, CalendarDays, Tags } from 'lucide-react';

import AddItemDialog from '@/components/add-item-dialog';
import DeleteItemDialog from '@/components/delete-item-dialog';
import EditItemDialog from '@/components/edit-item-dialog';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatDateDisplay } from '@/lib/date';
import type { Category } from '@/types/category';
import type { Item } from '@/types/item';

interface Props {
    items: Item[];
    categories: Category[];
}

export default function Items({ items, categories }: Props) {
    return (
        <>
            <Head title="Articles" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 lg:p-8">
                <div className="flex flex-col justify-between gap-4 px-2 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-neutral-900 uppercase dark:text-neutral-100">
                            Liste des Articles
                        </h1>

                        <p className="text-sm font-medium text-muted-foreground dark:text-neutral-400">
                            Gestion de la liste des articles et leurs catégories.
                        </p>
                    </div>

                    <AddItemDialog categories={categories} />
                </div>

                <div className="flex-1 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/90">
                    <Table>
                        <TableHeader className="bg-neutral-50/50 dark:bg-neutral-800/50">
                            <TableRow className="border-b border-neutral-200 text-sm hover:bg-transparent dark:border-neutral-800">
                                <TableHead className="w-24 font-bold text-neutral-800 dark:text-neutral-200">
                                    ID
                                </TableHead>
                                <TableHead className="font-bold text-neutral-800 dark:text-neutral-200">
                                    Nom de l'article
                                </TableHead>
                                <TableHead className="font-bold text-neutral-800 dark:text-neutral-200">
                                    Catégorie
                                </TableHead>
                                <TableHead className="font-bold text-neutral-800 dark:text-neutral-200">
                                    Date de création
                                </TableHead>
                                <TableHead className="w-20 text-center font-bold text-neutral-800 dark:text-neutral-200">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {items.length > 0 ? (
                                items.map((item) => {
                                    return (
                                        <TableRow
                                            key={item.id}
                                            className="group border-b border-slate-100 bg-white transition-all last:border-0 hover:bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800/70"
                                        >
                                            <TableCell className="font-mono text-sm font-bold text-slate-700 dark:text-neutral-300">
                                                #{item.id}
                                            </TableCell>

                                            <TableCell className="font-semibold capitalize text-slate-900 dark:text-neutral-100">
                                                <div className="flex items-center gap-2">
                                                    <Box className="h-4 w-4 text-slate-400 dark:text-neutral-500" />
                                                    {item.name}
                                                </div>
                                            </TableCell>

                                            <TableCell className="text-sm font-medium text-slate-600 dark:text-neutral-300">
                                                <Badge
                                                    variant="secondary"
                                                    className="font-medium text-slate-700 dark:text-neutral-200"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Tags className="h-3.5 w-3.5" />
                                                        {item.category?.name || 'Sans catégorie'}
                                                    </div>
                                                </Badge>
                                            </TableCell>

                                            <TableCell className="text-sm font-medium text-slate-600 dark:text-neutral-300">
                                                <div className="flex items-center gap-2">
                                                    <CalendarDays className="h-4 w-4 text-slate-400 dark:text-neutral-500" />
                                                    {formatDateDisplay(item.created_at)}
                                                </div>
                                            </TableCell>

                                            <TableCell className="text-center">
                                                <div className="flex justify-center gap-2">
                                                    <EditItemDialog
                                                        item={item}
                                                        categories={categories}
                                                    />

                                                    <DeleteItemDialog
                                                        itemId={item.id}
                                                        itemName={item.name}
                                                    />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="py-24 text-center font-medium text-muted-foreground italic dark:text-neutral-400"
                                    >
                                        Aucun article trouvé.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50/50 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-800/50">
                        <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-neutral-500 uppercase dark:text-neutral-400">
                            <Box className="h-4 w-4" />
                            {items.length} Articles au total
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

Items.layout = {
    breadcrumbs: [
        {
            title: 'Articles',
            href: '/items',
        },
    ],
};
