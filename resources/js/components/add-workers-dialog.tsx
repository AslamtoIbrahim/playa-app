import { Form } from '@inertiajs/react';
import { Check, Users, Banknote } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from '@/components/ui/spinner';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import InputError from '@/components/input-error';

import { bulkStore } from '@/routes/attendances/items';
import { Worker } from '@/types/worker';
import { cn, removeInputArraws } from '@/lib/utils';

interface AddWorkersProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    attendanceId: number;
    availableWorkers: Worker[];
}

export default function AddWorkersDialog({
    open,
    onOpenChange,
    attendanceId,
    availableWorkers
}: AddWorkersProps) {
    // Initialiser m3a ga3 l'khadama checked par défaut
    const [selectedWorkerIds, setSelectedWorkerIds] = useState<number[]>(
        availableWorkers.map(w => w.id)
    );

    const [defaultWage, setDefaultWage] = useState<string>("0");

    const toggleWorker = (workerId: number) => {
        if (selectedWorkerIds.includes(workerId)) {
            setSelectedWorkerIds(selectedWorkerIds.filter((id) => {
                return id !== workerId;
            }));

            return;
        }

        setSelectedWorkerIds([...selectedWorkerIds, workerId]);
    };

    const handleSuccess = () => {
        toast.success('Ouvriers ajoutés avec succès !');

        setSelectedWorkerIds([]);

        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 uppercase font-black text-slate-900">
                        <Users className="h-5 w-5" /> Ajouter des Ouvriers
                    </DialogTitle>

                    <DialogDescription>
                        Configurez le salaire et sélectionnez les ouvriers à ajouter.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...bulkStore.form(attendanceId)}
                    onSuccess={handleSuccess}
                    onBefore={() => {
                        const wage = parseFloat(defaultWage);
                        
                        if (isNaN(wage) || wage <= 0) {
                            toast.error("Le salaire doit être supérieur à 0 DH");
                            return false; // Hna kan'habso l'form maymchich
                        }

                        return true; // Kolchi mzyan, zid t'wakel
                    }}
                    className="space-y-6 pt-4"
                >
                    {({ processing, errors }) => (
                        <>
                            {/* Hidden inputs for worker_ids array */}
                            {selectedWorkerIds.map((id, index) => (
                                <input
                                    key={id}
                                    type="hidden"
                                    name={`worker_ids[${index}]`}
                                    value={id}
                                />
                            ))}

                            {/* Default Wage Input - Required by Backend */}
                            <div className="space-y-2">
                                <Label htmlFor="default_wage" className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1">
                                    <Banknote className="h-3 w-3" /> Salaire par défaut (DH)
                                </Label>

                                <Input
                                    id="default_wage"
                                    name="default_wage"
                                    type="number"
                                    step="0.01"
                                    value={defaultWage}
                                    onChange={(e) => {
                                        setDefaultWage(e.target.value);
                                    }}
                                    placeholder="Ex: 150 dh"
                                    className={cn("font-mono ",removeInputArraws)}
                                />

                                <InputError message={errors.default_wage} />
                            </div>

                            <div className="space-y-4">
                                <Label className="text-xs font-bold uppercase text-slate-500">
                                    Sélection ({selectedWorkerIds.length} / {availableWorkers.length})
                                </Label>

                                <ScrollArea className="h-64  border p-4 bg-slate-50/50">
                                    <div className="space-y-2">
                                        {availableWorkers.map((worker) => {
                                            const isSelected = selectedWorkerIds.includes(worker.id);

                                            return (
                                                <div
                                                    key={worker.id}
                                                    className={`
                group flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200
                ${isSelected
                                                            ? 'border-slate-600/50 bg-primary/5 '
                                                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                                        }
            `}
                                                >
                                                    <Checkbox
                                                        id={`worker-${worker.id}`}
                                                        checked={isSelected}
                                                        onCheckedChange={() => {
                                                            toggleWorker(worker.id);
                                                        }}
                                                        className="transition-transform duration-200 group-hover:scale-110"
                                                    />

                                                    <label
                                                        htmlFor={`worker-${worker.id}`}
                                                        className={`
                    flex-1 text-sm font-semibold cursor-pointer select-none transition-colors
                    ${isSelected ? 'text-primary' : 'text-slate-700'}
                `}
                                                    >
                                                        {worker.name}
                                                    </label>

                                                    {isSelected && (
                                                        <div className="bg-primary/10 rounded-full p-1">
                                                            <Check className="h-3 w-3 text-primary" strokeWidth={3} />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {availableWorkers.length === 0 && (
                                            <div className="text-center py-4 text-sm text-muted-foreground italic">
                                                Aucun ouvrier à afficher.
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>

                                <InputError message={errors.worker_ids} />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        onOpenChange(false);
                                    }}
                                >
                                    Annuler
                                </Button>

                                <Button
                                    type="submit"
                                    disabled={processing || selectedWorkerIds.length === 0}
                                    className="font-bold uppercase tracking-wider"
                                >
                                    {processing && <Spinner className="mr-2 h-4 w-4" />}
                                    Confirmer l'ajout
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}