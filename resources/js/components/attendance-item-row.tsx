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
        <TableRow className="group hover:bg-slate-50/50 transition-colors">
            {/* Info Ouvrier */}
            <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                        <User className="h-4 w-4" />
                    </div>

                    <div className="flex flex-col">
                        <span className="text-slate-900 font-bold capitalize">
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
                                        className={cn("w-24 h-8 text-sm font-bold border-blue-400 focus-visible:ring-blue-100", removeInputArraws)}
                                    />

                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        type="submit"
                                        disabled={processing}
                                        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
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
                                        className="h-8 w-8 text-slate-400 hover:bg-red-100"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </>
                            );
                        }}
                    </Form>
                ) : (
                    <div
                        className="font-black text-slate-700 cursor-pointer hover:text-blue-600 transition-colors flex items-center gap-1 group/wage"
                        onClick={() => {
                            setIsEditing(true);
                        }}
                    >
                        {item.wage} <span className="text-[10px] text-slate-400 font-medium">DH</span>
                    </div>
                )}
            </TableCell>

            {/* Statut */}
            <TableCell>
                <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-100 font-bold text-[10px] uppercase tracking-widest">
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
                                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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