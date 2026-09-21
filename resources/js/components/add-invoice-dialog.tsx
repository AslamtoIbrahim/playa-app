import { Form } from '@inertiajs/react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';

import BillableCombobox from '@/components/billable-combobox';
import CautionCombobox from '@/components/caution-combobox';
import InputError from '@/components/input-error';
import OfficeRoomCombobox from '@/components/office-room-combobox';
import SessionZoneBadge from '@/components/receipt-session-zone-badge';
import SessionZoneCombobox from '@/components/session-zone-combobox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { formatDateDisplay } from '@/lib/date';
import { filterCautionsByBillable } from '@/lib/invoice';
import { cn } from '@/lib/utils';
import { store } from '@/routes/invoices';
import type { Caution } from '@/types/caution';
import type { Billable } from '@/types/invoice';
import type { OfficeRoom } from '@/types/office-room';
import type { SessionZone } from '@/types/session-zone';
import { Calendar } from './ui/calendar';

export interface AddInvoiceDialogProps {
    billables: Billable[];
    officeRooms: OfficeRoom[];
    cautions: Caution[];
    /** Journées / zones disponibles. Inutile quand `lockedSessionZoneIds` est fourni. */
    sessionZones?: SessionZone[];
    /**
     * Journée courante : quand fourni, la session/zone n'est plus choisissable.
     * Plusieurs ids = journée multi-zones (un sélecteur restreint est alors affiché).
     */
    lockedSessionZoneIds?: number[];
    /** Date imposée par le contexte (ISO ou `yyyy-MM-dd`). */
    lockedDate?: string;
    /** Type de flux imposé par le contexte (onglet Achats / Ventes). */
    lockedType?: 'sale' | 'purchase';
    trigger?: ReactNode;
    title?: string;
    description?: string;
    /** Renvoie vers la journée après création au lieu de la fiche facture. */
    redirectTo?: 'session';
}

/**
 * Convertit une date ISO (`2026-09-21T00:00:00.000000Z`) en `yyyy-MM-dd`
 * sans passer par le fuseau horaire du navigateur.
 */
const toInputDate = (value: string): string => value.split('T')[0];

export default function AddInvoiceDialog({
    billables,
    officeRooms,
    cautions,
    sessionZones,
    lockedSessionZoneIds,
    lockedDate,
    lockedType,
    trigger,
    title = 'Nouvelle Facture',
    description = "Créez l'entête de la facture. Vous serez redirigé pour ajouter les articles.",
    redirectTo,
}: AddInvoiceDialogProps) {
    const [open, setOpen] = useState<boolean>(false);

    const isSessionZoneLocked = Boolean(lockedSessionZoneIds?.length);
    const isDateLocked = Boolean(lockedDate);
    const isTypeLocked = Boolean(lockedType);
    const isLockedContext = isSessionZoneLocked || isDateLocked || isTypeLocked;

    const allowedSessionZones = isSessionZoneLocked
        ? (sessionZones ?? []).filter((sessionZone) =>
              lockedSessionZoneIds?.includes(sessionZone.id),
          )
        : (sessionZones ?? []);

    const [selectedBillable, setSelectedBillable] = useState<Billable | null>(
        null,
    );
    const [selectedOfficeId, setSelectedOfficeId] = useState<string>('');
    const [selectedCautionId, setSelectedCautionId] = useState<string>('');
    const [selectedSessionZoneId, setSelectedSessionZoneId] = useState<string>(
        () =>
            lockedSessionZoneIds?.length
                ? lockedSessionZoneIds[0].toString()
                : '',
    );
    const [invoiceType, setInvoiceType] = useState<string>(
        lockedType ?? 'purchase',
    );
    const [date, setDate] = useState<Date>(new Date());

    const filteredCautions = filterCautionsByBillable(
        cautions,
        selectedBillable,
    );

    const selectedSessionZone =
        allowedSessionZones.find(
            (sessionZone) =>
                sessionZone.id.toString() === selectedSessionZoneId,
        ) ?? null;

    const dateValue = lockedDate
        ? toInputDate(lockedDate)
        : format(date, 'yyyy-MM-dd');

    const showSessionZoneSelect =
        !isSessionZoneLocked || allowedSessionZones.length > 1;

    const resetContextState = (): void => {
        if (!isSessionZoneLocked) {
            setSelectedSessionZoneId('');
        }

        if (!isDateLocked) {
            setDate(new Date());
        }

        if (!isTypeLocked) {
            setInvoiceType('purchase');
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ?? (
                    <Button size="sm" className="font-bold">
                        <Plus className="mr-2 h-4 w-4" /> Ajouter une Facture
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="sm:max-w-106.25">
                <DialogHeader>
                    <DialogTitle className="font-black text-slate-900 uppercase dark:text-neutral-100">
                        {title}
                    </DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <Form
                    {...store.form()}
                    onSuccess={() => {
                        toast.success('Facture créée avec succès !');
                        setOpen(false);
                        setSelectedBillable(null);
                        setSelectedOfficeId('');
                        setSelectedCautionId('');
                        resetContextState();
                    }}
                    className="space-y-4 pt-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <input
                                type="hidden"
                                name="billable_id"
                                value={selectedBillable?.id || ''}
                            />
                            <input
                                type="hidden"
                                name="billable_type"
                                value={selectedBillable?.type || ''}
                            />
                            <input
                                type="hidden"
                                name="office_room_id"
                                value={selectedOfficeId}
                            />
                            <input
                                type="hidden"
                                name="session_zone_id"
                                value={selectedSessionZoneId}
                            />
                            <input
                                type="hidden"
                                name="caution_id"
                                value={selectedCautionId}
                            />
                            <input
                                type="hidden"
                                name="type"
                                value={invoiceType}
                            />
                            <input
                                type="hidden"
                                name="date"
                                value={dateValue}
                            />

                            {redirectTo === 'session' && (
                                <input
                                    type="hidden"
                                    name="redirect_to"
                                    value="session"
                                />
                            )}

                            {isLockedContext && (
                                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50/70 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950/40">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {isDateLocked && (
                                            <Badge
                                                variant="outline"
                                                className="gap-1.5 border-neutral-200 bg-white px-2 py-0.5 dark:border-neutral-700 dark:bg-neutral-900"
                                            >
                                                <CalendarIcon className="h-3 w-3 text-neutral-400 dark:text-neutral-500" />
                                                <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                                                    {formatDateDisplay(
                                                        dateValue,
                                                    )}
                                                </span>
                                            </Badge>
                                        )}

                                        {isTypeLocked && (
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    'px-2 py-0.5 text-xs font-semibold',
                                                    invoiceType === 'purchase'
                                                        ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-400'
                                                        : 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/50 dark:bg-orange-950/40 dark:text-orange-400',
                                                )}
                                            >
                                                {invoiceType === 'purchase'
                                                    ? 'Achat'
                                                    : 'Vente'}
                                            </Badge>
                                        )}
                                    </div>

                                    {isSessionZoneLocked && (
                                        <SessionZoneBadge
                                            sessionZone={selectedSessionZone}
                                        />
                                    )}
                                </div>
                            )}

                            {(!isTypeLocked || !isDateLocked) && (
                                <div className="grid grid-cols-2 gap-4">
                                    {!isTypeLocked && (
                                        <div className="grid gap-2">
                                            <Label className="text-xs font-bold text-slate-500 uppercase dark:text-neutral-400">
                                                Type de flux
                                            </Label>
                                            <Select
                                                value={invoiceType}
                                                onValueChange={setInvoiceType}
                                            >
                                                <SelectTrigger className="font-medium">
                                                    <SelectValue placeholder="Sélectionner" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="purchase">
                                                        Achat
                                                    </SelectItem>
                                                    <SelectItem value="sale">
                                                        Vente
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <InputError message={errors.type} />
                                        </div>
                                    )}

                                    {!isDateLocked && (
                                        <div className="grid gap-2">
                                            <Label className="text-xs font-bold text-slate-500 uppercase dark:text-neutral-400">
                                                Date Facture
                                            </Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className="w-full justify-start text-left font-medium data-[state=open]:bg-neutral-100 dark:data-[state=open]:bg-neutral-800"
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {format(
                                                            date,
                                                            'dd/MM/yyyy',
                                                        )}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0">
                                                    <Calendar
                                                        mode="single"
                                                        selected={date}
                                                        onSelect={(
                                                            selectedDate,
                                                        ) => {
                                                            if (selectedDate) {
                                                                setDate(
                                                                    selectedDate,
                                                                );
                                                            }
                                                        }}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <InputError message={errors.date} />
                                        </div>
                                    )}
                                </div>
                            )}

                            {showSessionZoneSelect && (
                                <SessionZoneCombobox
                                    sessionZones={allowedSessionZones}
                                    value={selectedSessionZoneId}
                                    onChange={setSelectedSessionZoneId}
                                    error={errors.session_zone_id}
                                    label={
                                        isSessionZoneLocked
                                            ? "Zone d'affectation"
                                            : "Session & Zone d'affectation"
                                    }
                                    placeholder={
                                        isSessionZoneLocked
                                            ? 'Choisir la zone...'
                                            : 'Choisir la session/zone...'
                                    }
                                    showManageLink={!isSessionZoneLocked}
                                />
                            )}

                            <BillableCombobox
                                billables={billables}
                                value={selectedBillable}
                                onChange={(billable) => {
                                    setSelectedBillable(billable);
                                    setSelectedCautionId('');
                                }}
                                error={errors.billable_id}
                            />

                            <CautionCombobox
                                cautions={filteredCautions}
                                billable={selectedBillable}
                                value={selectedCautionId}
                                onChange={setSelectedCautionId}
                                error={errors.caution_id}
                            />

                            <OfficeRoomCombobox
                                officeRooms={officeRooms}
                                value={selectedOfficeId}
                                onChange={setSelectedOfficeId}
                                error={errors.office_room_id}
                            />

                            <div className="flex justify-end gap-3 pt-4">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full font-bold tracking-wider uppercase"
                                >
                                    {processing && (
                                        <Spinner className="mr-2 h-4 w-4" />
                                    )}
                                    Enregistrer la Facture
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
