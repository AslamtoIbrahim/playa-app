import { Head } from '@inertiajs/react';

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

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between px-2">
                    <h1 className="text-xl font-semibold text-slate-900 dark:text-neutral-100">
                        Liste des Articles
                    </h1>

                    <AddItemDialog categories={categories} />
                </div>

                <div className="relative min-h-screen flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-neutral-900 p-4 md:min-h-min">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-20">ID</TableHead>
                                <TableHead>Nom de l'article</TableHead>
                                <TableHead>Catégorie</TableHead>
                                <TableHead className="text-left">Date Création</TableHead>
                                <TableHead className="text-center w-28">Actions</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {items.length > 0 ? (
                                items.map((item) => {
                                    return (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium text-muted-foreground">
                                                #{item.id}
                                            </TableCell>

                                            <TableCell className="font-medium capitalize text-slate-900 dark:text-neutral-100">
                                                {item.name}
                                            </TableCell>

                                            <TableCell>
                                                <Badge
                                                    variant="secondary"
                                                    className="font-normal"
                                                >
                                                    {item.category?.name ||
                                                        'Sans catégorie'}
                                                </Badge>
                                            </TableCell>

                                            <TableCell className="text-left text-muted-foreground text-sm">
                                                {item.created_at
                                                    ? new Date(
                                                          item.created_at
                                                      ).toLocaleDateString(
                                                          'fr-FR'
                                                      )
                                                    : 'N/A'}
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
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        Aucun article trouvé.
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

Items.layout = {
    breadcrumbs: [
        {
            title: 'Articles',
            href: '/items',
        },
    ],
};
