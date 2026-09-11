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
import { Input } from '@/components/ui/input';
import { store as customerStore } from '@/routes/customers';
import { store as companyStore } from '@/routes/companies';
import { Form } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

type MissingCustomerCompanyPopupProps = {
	initialName?: string;
};

export default function MissingCustomerCompanyPopup({
	initialName = '',
}: MissingCustomerCompanyPopupProps) {
	const [open, setOpen] = useState(false);
	const [name, setName] = useState(initialName);

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				setOpen(nextOpen);

				if (nextOpen) {
					setName(initialName);
				}
			}}
		>
			<DialogTrigger asChild>
				<Button type="button" variant="outline" size="sm">
					<Plus className="h-4 w-4" />
				</Button>
			</DialogTrigger>

			<DialogContent className="w-[calc(100%-2rem)] max-w-md overflow-hidden">
				<DialogHeader>
					<DialogTitle>Ajouter un propriétaire</DialogTitle>
					<DialogDescription>
						Cette personne ou société n&apos;est pas dans les suggestions.
						Ajoutez-la directement.
					</DialogDescription>
				</DialogHeader>

				<Input
					className="w-full min-w-0"
					name="name"
					value={name}
					onChange={(event) => setName(event.target.value)}
					placeholder="Nom"
					required
				/>

				<DialogFooter className="grid w-full min-w-0 grid-cols-1 gap-2 pt-2 sm:grid-cols-2">
						<Form
							{...customerStore.form()}
							resetOnSuccess={['name']}
							onSuccess={() => {
								toast.success('Le client a été créé avec succès !');
								setOpen(false);
							}}
							className="w-full min-w-0"
						>
							<input type="hidden" name="name" value={name} />
							<Button type="submit" className="w-full min-w-0">
								Ajouter comme client
							</Button>
						</Form>
						<Form
							{...companyStore.form()}
							resetOnSuccess={['name']}
							onSuccess={() => {
								toast.success('La société a été créée avec succès !');
								setOpen(false);
							}}
							className="w-full min-w-0"
						>
							<input type="hidden" name="name" value={name} />
							<Button type="submit" variant="secondary" className="w-full min-w-0">
								Ajouter comme société
							</Button>
						</Form>
					</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
