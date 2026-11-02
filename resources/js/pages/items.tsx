import { Head } from '@inertiajs/react';
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    FileText,
    Box,
    Tags,
} from 'lucide-react';

import AddItemDialog from '@/components/add-item-dialog';
import DeleteItemDialog from '@/components/delete-item-dialog';
import EditItemDialog from '@/components/edit-item-dialog';
import { ItemColumnFilter, ItemSearch } from '@/components/item-filters';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useItemFilters } from '@/hooks/use-item-filters';
import { formatDateDisplay } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { Category } from '@/types/category';
import type { Item } from '@/types/item';
import { useState } from 'react';

interface Props {
    items: Item[];
    categories: Category[];
}

export default function Items({ items, categories }: Props) {
    const [showColumnFilters, setShowColumnFilters] = useState(false);
    const {
        filters,
        setFilters,
        filteredItems,
        paginatedItems,
        activeFilterCount,
        currentPage,
        pageCount,
        setPage,
        clearFilters,
    } = useItemFilters(items);
    const itemNames = [...new Set(items.map((item) => item.name))].sort(
        (a, b) => a.localeCompare(b, 'fr'),
    );
    const categoryNames = [
        ...new Set([
            ...categories.map((category) => category.name),
            ...items.flatMap((item) =>
                item.category?.name ? [item.category.name] : [],
            ),
            ...(items.some((item) => !item.category?.name)
                ? ['Sans catégorie']
                : []),
        ]),
    ].sort((a, b) => a.localeCompare(b, 'fr'));

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
                            Gestion de la liste des articles et leurs
                            catégories.
                        </p>
                    </div>

                    <AddItemDialog categories={categories} />
                </div>

                <div className="flex-1 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/90">
                    <div className="flex min-h-14 items-center justify-between gap-3 border-b border-neutral-200 bg-neutral-50/50 px-4 py-2 dark:border-neutral-800 dark:bg-neutral-800/50">
                        <ItemSearch
                            value={filters.search}
                            onChange={(search) =>
                                setFilters((current) => ({
                                    ...current,
                                    search,
                                }))
                            }
                            showColumnFilters={showColumnFilters}
                            activeFilterCount={activeFilterCount}
                            onToggleColumnFilters={() =>
                                setShowColumnFilters((current) => !current)
                            }
                            onClearFilters={clearFilters}
                        />
                        <span className="shrink-0 text-xs font-medium text-muted-foreground">
                            {filteredItems.length} / {items.length} articles
                        </span>
                    </div>
                    <Table>
                        <TableHeader
                            className={`bg-neutral-50/50 dark:bg-neutral-800/50 ${showColumnFilters ? '' : '**:data-column-filter-trigger:hidden'}`}
                        >
                            <TableRow className="border-b border-neutral-200 text-sm hover:bg-transparent dark:border-neutral-800">
                                <TableHead className="w-24 font-bold text-neutral-800 dark:text-neutral-200">
                                    <span className="inline-flex items-center">
                                        ID
                                        <ItemColumnFilter
                                            column="id"
                                            title="ID"
                                            filters={filters}
                                            setFilters={setFilters}
                                        />
                                    </span>
                                </TableHead>
                                <TableHead className="font-bold text-neutral-800 dark:text-neutral-200">
                                    <span className="inline-flex items-center">
                                        Nom de l'article
                                        <ItemColumnFilter
                                            column="name"
                                            title="Nom de l'article"
                                            options={itemNames}
                                            filters={filters}
                                            setFilters={setFilters}
                                        />
                                    </span>
                                </TableHead>
                                <TableHead className="font-bold text-neutral-800 dark:text-neutral-200">
                                    <span className="inline-flex items-center">
                                        Catégorie
                                        <ItemColumnFilter
                                            column="category"
                                            title="Catégorie"
                                            options={categoryNames}
                                            filters={filters}
                                            setFilters={setFilters}
                                        />
                                    </span>
                                </TableHead>
                                <TableHead className="font-bold text-neutral-800 dark:text-neutral-200">
                                    <span className="inline-flex items-center">
                                        Date de création
                                        <ItemColumnFilter
                                            column="created_at"
                                            title="Date de création"
                                            filters={filters}
                                            setFilters={setFilters}
                                        />
                                    </span>
                                </TableHead>
                                <TableHead className="w-20 text-center font-bold text-neutral-800 dark:text-neutral-200">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {paginatedItems.length > 0 ? (
                                paginatedItems.map((item) => {
                                    return (
                                        <TableRow
                                            key={item.id}
                                            className="group border-b border-slate-100 bg-white transition-all last:border-0 hover:bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800/70"
                                        >
                                            <TableCell className="font-mono text-sm font-bold text-slate-700 dark:text-neutral-300">
                                                #{item.id}
                                            </TableCell>

                                            <TableCell className="font-semibold text-slate-900 capitalize dark:text-neutral-100">
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
                                                        {item.category?.name ||
                                                            'Sans catégorie'}
                                                    </div>
                                                </Badge>
                                            </TableCell>

                                            <TableCell className="text-sm font-medium text-slate-600 dark:text-neutral-300">
                                                <div className="flex items-center gap-2">
                                                    <CalendarDays className="h-4 w-4 text-slate-400 dark:text-neutral-500" />
                                                    {formatDateDisplay(
                                                        item.created_at,
                                                    )}
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
                                        {items.length > 0
                                            ? 'Aucun article ne correspond aux filtres.'
                                            : 'Aucun article enregistré.'}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50/50 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-800/50">
                        <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-neutral-500 uppercase dark:text-neutral-400">
                            <FileText className="h-4 w-4" />
                            {filteredItems.length} Articles au total
                        </div>

                        <div className="flex gap-2">
                            {currentPage > 1 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    aria-label="Page précédente"
                                    className="h-9 min-w-9 text-xs font-bold shadow-none transition-all dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                                    onClick={() => setPage(currentPage - 1)}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                            )}
                            {Array.from(
                                { length: pageCount },
                                (_, index) => index + 1,
                            ).map((page) => (
                                <Button
                                    key={page}
                                    type="button"
                                    variant={
                                        page === currentPage
                                            ? 'default'
                                            : 'outline'
                                    }
                                    size="sm"
                                    aria-current={
                                        page === currentPage
                                            ? 'page'
                                            : undefined
                                    }
                                    className={cn(
                                        'h-9 min-w-9 text-xs font-bold shadow-none transition-all dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700',
                                        page === currentPage &&
                                            'scale-105 shadow-md dark:bg-primary dark:text-primary-foreground',
                                    )}
                                    onClick={() => setPage(page)}
                                >
                                    {page}
                                </Button>
                            ))}
                            {currentPage < pageCount && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    aria-label="Page suivante"
                                    className="h-9 min-w-9 text-xs font-bold shadow-none transition-all dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                                    onClick={() => setPage(currentPage + 1)}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            )}
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
