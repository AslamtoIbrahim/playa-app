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
import { store } from '@/routes/workers';
import { Form } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

type MissingWorkerPopupProps = {
	initialName?: string;
};

export default function MissingWorkerPopup({
	initialName = '',
}: MissingWorkerPopupProps) {
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
					<DialogTitle>Ajouter un ouvrier</DialogTitle>
					<DialogDescription>
						Cet ouvrier n&apos;est pas dans les suggestions. Ajoutez-le
						directement.
					</DialogDescription>
				</DialogHeader>

				<Form
					{...store.form()}
					resetOnSuccess={['name']}
					onSuccess={() => {
						toast.success("L'ouvrier a été créé avec succès !");
						setOpen(false);
					}}
					className="space-y-4 pt-2 w-full min-w-0"
				>
					<Input
						className="w-full min-w-0"
						name="name"
						value={name}
						onChange={(event) => setName(event.target.value)}
						placeholder="Nom complet de l'ouvrier"
						required
						autoFocus
					/>

					<DialogFooter className="w-full min-w-0 pt-2">
						<Button type="submit" className="w-full min-w-0">
							Ajouter l&apos;ouvrier
						</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	);
}


