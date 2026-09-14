import { Form } from '@inertiajs/react';
import {
    Check,
    Loader2,
    Trash2,
    User,
    X
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

// Wayfinder imports

// Types
import { AttendanceItem } from '@/types/attendance-item';
import { destroy, update } from '@/routes/attendances/items';
import { cn, removeInputArraws } from '@/lib/utils';

interface Props {
    item: AttendanceItem;
}

export default function AttendanceItemRow({ item }: Props) {
    const [isEditing, setIsEditing] = useState<boolean>(false);

    return (
        <TableRow className="group transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
            {/* Info Ouvrier */}
            <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        <User className="h-4 w-4" />
                    </div>

                    <div className="flex flex-col">
                        <span className="font-bold capitalize text-slate-900 dark:text-slate-100">
                            {item.worker?.name}
                        </span>
                    </div>
                </div>
            </TableCell>

            {/* Salaire (Inline Form) */}
            <TableCell>
                {isEditing ? (
                    <Form
                        {...update.form(item.id)}
                        onSuccess={() => {
                            toast.success('Salaire mis à jour');

                            setIsEditing(false);
                        }}
                        className="flex items-center gap-2"
                    >
                        {({ processing }) => {
                            return (
                                <>
                                    <Input
                                        name="wage"
                                        type="number"
                                        autoFocus
                                        defaultValue={item.wage} 
                                        onBlur={(e) => {
                                            if (!e.currentTarget.parentElement?.contains(e.relatedTarget as Node)) {
                                                setIsEditing(false);
                                            }
                                        }}
                                        className={cn("h-8 w-24 border-blue-400 text-sm font-bold focus-visible:ring-blue-100 dark:border-blue-500 dark:bg-slate-900 dark:text-slate-100 dark:focus-visible:ring-blue-900", removeInputArraws)}
                                    />

                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        type="submit"
                                        disabled={processing}
                                        className="h-8 w-8 text-green-600 hover:bg-green-100 hover:text-green-700 dark:text-green-400 dark:hover:bg-green-950/50 dark:hover:text-green-300"
                                    >
                                        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                    </Button>

                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        type="button"
                                        onClick={() => {
                                            setIsEditing(false);
                                        }}
                                        className="h-8 w-8 text-slate-400 hover:bg-red-100 dark:text-slate-500 dark:hover:bg-red-950/50"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </>
                            );
                        }}
                    </Form>
                ) : (
                    <div
                        className="group/wage flex cursor-pointer items-center gap-1 font-black text-slate-700 transition-colors hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-400"
                        onClick={() => {
                            setIsEditing(true);
                        }}
                    >
                        {item.wage} <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">DH</span>
                    </div>
                )}
            </TableCell>

            {/* Statut */}
            <TableCell>
                <Badge variant="secondary" className="border-green-100 bg-green-50 text-[10px] font-bold tracking-widest text-green-700 uppercase dark:border-green-900 dark:bg-green-950/50 dark:text-green-400">
                    Présent
                </Badge>
            </TableCell>

            {/* Actions */}
            <TableCell className="text-right">
                <div className="flex justify-end items-center gap-1">
                    {/* Delete Form */}
                    <Form
                        {...destroy.form(item.id)}
                        onSuccess={() => {
                            toast.error('Ouvrier retiré');
                        }}
                    >
                        {({ processing }) => {
                            return (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    type="submit"
                                    disabled={processing}
                                    className="h-8 w-8 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-500 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            );
                        }}
                    </Form>
                </div>
            </TableCell>
        </TableRow>
    );
}
