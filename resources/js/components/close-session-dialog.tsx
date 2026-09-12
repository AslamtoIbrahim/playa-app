import { Form } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AlertTriangle, Loader2, Lock } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { close } from '@/routes/sessions'; // تأكد من وجود route باسم close
import type { DailySession } from '@/types/daily-session';

interface Props {
    session: DailySession;
}

export default function CloseSessionDialog({ session }: Props) {
    const [open, setOpen] = useState<boolean>(false);

    const sessionDate = typeof session.session_date === 'string' 
        ? parseISO(session.session_date) 
        : session.session_date;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-orange-500 hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-neutral-800 dark:hover:text-orange-400"
                    title="Clôturer la session"
                >
                    <Lock className="h-4 w-4" />
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-2">
                        <AlertTriangle className="h-5 w-5" />
                        <DialogTitle className="font-black uppercase tracking-tight text-slate-900 dark:text-neutral-100">
                            Clôturer la Session
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-slate-600 dark:text-neutral-400">
                        Êtes-vous sûr de vouloir fermer la session du 
                        <span className="font-bold text-slate-900 dark:text-neutral-100 mx-1">
                            {format(sessionDate, 'PPPP', { locale: fr })}
                        </span>? 
                        Cette action calculera les totaux et verrouillera les modifications.
                    </DialogDescription>
                </DialogHeader>

                <div className="my-4 rounded-lg bg-orange-50 border border-orange-100 dark:bg-orange-950/30 dark:border-orange-900/50 p-4 space-y-3">
                    <div className="flex justify-between items-center border-b border-orange-200 dark:border-orange-900/50 pb-2">
                        <span className="text-xs font-semibold text-orange-700 dark:text-orange-400 uppercase">Total Achat</span>
                        <span className="font-mono font-bold text-orange-900 dark:text-orange-300">{session.total_buy} DH</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-orange-700 dark:text-orange-400 uppercase">Total Vente</span>
                        <span className="font-mono font-bold text-orange-900 dark:text-orange-300">{session.total_sell} DH</span>
                    </div>
                </div>

                <Form
                    {...close.form(session.id)}
                    onSuccess={() => {
                        toast.success('Session clôturée avec succès ! 🔒');
                        setOpen(false);
                    }}
                >
                    {({ processing }) => {
                        return (
                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => {
                                        return setOpen(false);
                                    }}
                                    disabled={processing}
                                    className="font-semibold"
                                >
                                    Annuler
                                </Button>
                                
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    variant="destructive"
                                    className="min-w-37.5 font-bold uppercase tracking-wider"
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Clôture...
                                        </>
                                    ) : (
                                        'Confirmer la Clôture'
                                    )}
                                </Button>
                            </DialogFooter>
                        );
                    }}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

