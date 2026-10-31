import AddAccountDialog from '@/components/add-customer-dialog';
import {
    CustomerColumnFilter,
    CustomerSearch,
} from '@/components/customer-filters';
import DeleteCustomerDialog from '@/components/delete-customer-dialog';
import EditCustomerDialog from '@/components/edit-customer-dialog';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useCustomerFilters } from '@/hooks/use-customer-filters';
import { formatDateDisplay } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { Customer } from '@/types/customer';
import { Head } from '@inertiajs/react';
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    FileText,
    Users,
} from 'lucide-react';
import { useState } from 'react';

interface Props {
    customers: Customer[];
}

export default function Customers({ customers }: Props) {
    const [showColumnFilters, setShowColumnFilters] = useState(false);
    const {
        filters,
        setFilters,
        filteredCustomers,
        paginatedCustomers,
        activeFilterCount,
        currentPage,
        pageCount,
        setPage,
        clearFilters,
    } = useCustomerFilters(customers);
    const customerNames = [
        ...new Set(customers.map((customer) => customer.name)),
    ].sort((a, b) => a.localeCompare(b, 'fr'));

    return (
        <>
            <Head title="Clients" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 lg:p-8">
                <div className="flex flex-col justify-between gap-4 px-2 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-neutral-900 uppercase dark:text-neutral-100">
                            Liste des Clients
                        </h1>

                        <p className="text-sm font-medium text-muted-foreground dark:text-neutral-400">
                            Gestion de la liste des clients enregistrés.
                        </p>
                    </div>

                    <AddAccountDialog />
                </div>

                <div className="flex-1 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/90">
                    <div className="flex min-h-14 items-center justify-between gap-3 border-b border-neutral-200 bg-neutral-50/50 px-4 py-2 dark:border-neutral-800 dark:bg-neutral-800/50">
                        <CustomerSearch
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
                            {filteredCustomers.length} / {customers.length}{' '}
                            clients
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
                                        <CustomerColumnFilter
                                            column="id"
                                            title="ID"
                                            filters={filters}
                                            setFilters={setFilters}
                                        />
                                    </span>
                                </TableHead>
                                <TableHead className="font-bold text-neutral-800 dark:text-neutral-200">
                                    <span className="inline-flex items-center">
                                        Nom
                                        <CustomerColumnFilter
                                            column="name"
                                            title="Nom"
                                            options={customerNames}
                                            filters={filters}
                                            setFilters={setFilters}
                                        />
                                    </span>
                                </TableHead>
                                <TableHead className="font-bold text-neutral-800 dark:text-neutral-200">
                                    <span className="inline-flex items-center">
                                        Date de création
                                        <CustomerColumnFilter
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
                            {paginatedCustomers.length > 0 ? (
                                paginatedCustomers.map((customer) => (
                                    <TableRow
                                        key={customer.id}
                                        className="group border-b border-slate-100 bg-white transition-all last:border-0 hover:bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800/70"
                                    >
                                        <TableCell className="font-mono text-sm font-bold text-slate-700 dark:text-neutral-300">
                                            #{customer.id}
                                        </TableCell>

                                        <TableCell className="font-semibold text-slate-900 capitalize dark:text-neutral-100">
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-slate-400 dark:text-neutral-500" />
                                                {customer.name}
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-sm font-medium text-slate-600 dark:text-neutral-300">
                                            <div className="flex items-center gap-2">
                                                <CalendarDays className="h-4 w-4 text-slate-400 dark:text-neutral-500" />
                                                {formatDateDisplay(
                                                    customer.created_at,
                                                )}
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-center">
                                            <div className="flex justify-center gap-2">
                                                <EditCustomerDialog
                                                    customer={customer}
                                                />

                                                <DeleteCustomerDialog
                                                    customerId={customer.id}
                                                    customerName={customer.name}
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="py-24 text-center font-medium text-muted-foreground italic dark:text-neutral-400"
                                    >
                                        {customers.length > 0
                                            ? 'Aucun client ne correspond aux filtres.'
                                            : 'Aucun client enregistré.'}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50/50 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-800/50">
                        <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-neutral-500 uppercase dark:text-neutral-400">
                            <FileText className="h-4 w-4" />
                            {filteredCustomers.length} Clients au total
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

Customers.layout = {
    breadcrumbs: [
        {
            title: 'Clients',
            href: '/customers',
        },
    ],
};
