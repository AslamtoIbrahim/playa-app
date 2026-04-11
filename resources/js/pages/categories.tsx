import { Head } from '@inertiajs/react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Category } from '@/types/category';
import AddCategoryDialog from '@/components/add-category-dialog';
import EditCategoryDialog from '@/components/edit-category-dialog';
import DeleteCategoryDialog from '@/components/delete-category-dialog';

interface Props {
    categories: Category[];
}

export default function Categories({ categories }: Props) {
    return (
        <>
            <Head title="Catégories" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between px-2">
                    <h1 className="text-xl font-semibold">Liste des Catégories</h1>
                    <AddCategoryDialog />
                </div>

                <div className="relative min-h-screen flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border bg-white p-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-20">ID</TableHead>
                                <TableHead>Nom</TableHead>
                                <TableHead className="text-left">Date Création</TableHead>
                                <TableHead className="text-center w-28">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categories.length > 0 ? (
                                categories.map((category) => (
                                    <TableRow key={category.id}>
                                        <TableCell className="font-medium text-muted-foreground">#{category.id}</TableCell>
                                        <TableCell className="font-medium">{category.name}</TableCell>
                                        <TableCell className="text-left text-muted-foreground text-sm">
                                            {category.created_at 
                                                ? new Date(category.created_at).toLocaleDateString('fr-FR') 
                                                : 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex justify-center gap-2">
                                                <EditCategoryDialog category={category} />
                                                <DeleteCategoryDialog
                                                    categoryId={category.id}
                                                    categoryName={category.name}
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        Aucune catégorie trouvée.
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

Categories.layout = {
    breadcrumbs: [
        {
            title: 'Catégories',
            href: '/categories',
        },
    ],
};