import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
import { Form } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar as CalendarIcon, Loader2, Pencil } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { update } from '@/routes/sessions';

interface Zone {
	id: number;
	name: string;
}

interface Session {
	id: number;
	session_date: string | null;
}

interface Props {
	zone: Zone;
	session: Session;
	existingSessionDates: string[];
}

export default function EditSessionForZoneDialog({
	zone,
	session,
	existingSessionDates = [],
}: Props) {
	const [open, setOpen] = useState(false);
	const [date, setDate] = useState<Date>(
		session.session_date ? parseISO(session.session_date) : new Date(),
	);

	const disabledDays = (day: Date): boolean => {
		const formattedDay = format(day, 'yyyy-MM-dd');

		return existingSessionDates.some((d) => {
			const pureExistingDate = d.split(' ')[0].split('T')[0];

			return pureExistingDate === formattedDay;
		});
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="h-8 w-8 text-blue-500 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-neutral-800 dark:hover:text-blue-400"
					onClick={(event) => event.stopPropagation()}
					onPointerDown={(event) => event.stopPropagation()}
					aria-label="Modifier la session"
				>
					<Pencil className="h-4 w-4" />
				</Button>
			</DialogTrigger>

			<DialogContent
				className="sm:max-w-112.5"
				onClick={(event) => event.stopPropagation()}
				onPointerDown={(event) => event.stopPropagation()}
			>
				<DialogHeader>
					<DialogTitle className="text-xl font-black uppercase">
						Modifier la journée
					</DialogTitle>
					<DialogDescription>
						Modifier la journée de la zone « {zone.name} ».
					</DialogDescription>
				</DialogHeader>

				<Form
					{...update.form(session.id)}
					onSuccess={() => {
						toast.success('Session mise à jour ! ✨');
						setOpen(false);
					}}
				>
					{({ processing, errors }) => (
						<div className="space-y-6 pt-4">
							<input
								type="hidden"
								name="session_date"
								value={format(date, 'yyyy-MM-dd')}
							/>
							<input
								type="hidden"
								name="selected_zones[]"
								value={zone.id}
							/>

							<div className="grid gap-2">
								<Label className="text-xs font-bold uppercase">
									Date de la journée
								</Label>
								<Popover>
									<PopoverTrigger asChild>
										<Button
											type="button"
											variant="outline"
											onClick={(event) => event.stopPropagation()}
											onPointerDown={(event) => event.stopPropagation()}
											className={cn(
												'w-full justify-start border-2 py-6 text-left font-medium',
												errors.session_date &&
													'border-destructive bg-destructive/5',
											)}
										>
											<CalendarIcon className="mr-2 h-4 w-4 text-primary" />
											{format(date, 'dd-MM-yyyy', {
												locale: fr,
											})}
										</Button>
									</PopoverTrigger>
									<PopoverContent
										className="w-auto p-0"
										align="start"
										onClick={(event) => event.stopPropagation()}
										onPointerDown={(event) => event.stopPropagation()}
									>
										<Calendar
											mode="single"
											selected={date}
											onSelect={(value) => {
												if (value) {
													setDate(value);
												}
											}}
											disabled={disabledDays}
											locale={fr}
										/>
									</PopoverContent>
								</Popover>
								{errors.session_date && (
									<p className="text-sm font-bold text-destructive">
										{errors.session_date}
									</p>
								)}
								{errors.selected_zones && (
									<p className="text-sm font-bold text-destructive">
										{errors.selected_zones}
									</p>
								)}
							</div>

							<Button
								type="submit"
								disabled={processing}
								className="text-md w-full py-7 font-bold tracking-widest uppercase shadow-md"
							>
								{processing ? (
									<>
										<Loader2 className="mr-2 h-5 w-5 animate-spin" />
										Modification en cours...
									</>
								) : (
									'Enregistrer les modifications'
								)}
							</Button>
						</div>
					)}
				</Form>
			</DialogContent>
		</Dialog>
	);
}
