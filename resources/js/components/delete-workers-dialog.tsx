import { Form } from '@inertiajs/react';
import { Trash2, AlertCircle, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';

import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { bulkDestroy } from '@/routes/attendances/items';

interface DeleteWorkersProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    attendanceId: number;
    count: number;
}

export default function DeleteWorkersDialog({ open, onOpenChange, attendanceId, count }: DeleteWorkersProps) {
    
    const handleSuccess = () => {
        toast.error('Liste vidée avec succès');
        onOpenChange(false);
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-100 gap-0 p-0 overflow-hidden border-none shadow-2xl">
                {/* Header ملون كيعطي إشارة خطر خفيفة */}
                <div className="bg-red-50/50 p-6 pb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
                        <AlertCircle className="h-6 w-6 text-red-600" />
                    </div>
                    
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-slate-900">
                            Vider la liste ?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 leading-relaxed text-balance">
                            Vous êtes sur le point de retirer <span className="font-bold text-slate-900">{count} ouvrier{count > 1 ? 's' : ''}</span>. 
                            Cette action ne peut pas être annulée.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                </div>

                {/* Footer فيه الأزرار مع شكل أنيق */}
                <div className="p-6 bg-red-50/50">
                    <Form
                        {...bulkDestroy.form(attendanceId)}
                        onSuccess={handleSuccess}
                    >
                        {({ processing }) => (
                            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                <AlertDialogCancel 
                                    disabled={processing}
                                    className="flex-1 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
                                >
                                    Annuler
                                </AlertDialogCancel>
                                
                                <Button 
                                    type="submit"
                                    variant="destructive"
                                    disabled={processing}
                                    className="flex-[1.5] bg-red-600 hover:bg-red-700 shadow-sm shadow-red-200 transition-all active:scale-[0.98]"
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Suppression...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Oui, supprimer tout
                                        </>
                                    )}
                                </Button>
                            </AlertDialogFooter>
                        )}
                    </Form>
                </div>
 
            </AlertDialogContent>
        </AlertDialog>
    );
}