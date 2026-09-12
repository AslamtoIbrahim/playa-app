import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Bot, Plus, Send, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

type HelpPopupProps = {
	initialQuestion?: string;
};

export default function HelpPopup({
	initialQuestion = '',
}: HelpPopupProps) {
	const [open, setOpen] = useState(false);
	const [question, setQuestion] = useState(initialQuestion);

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!question.trim()) {
			return;
		}

		toast.success('Votre question a été envoyée avec succès ! Nous vous répondrons bientôt.');
		setQuestion('');
		setOpen(false);
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen: boolean) => {
				setOpen(nextOpen);

				if (nextOpen) {
					setQuestion(initialQuestion);
				}
			}}
		>
			<DialogTrigger asChild>
				<Button type="button" variant="outline" size="sm" className="gap-1.5">
					<Bot className="h-4 w-4 text-primary" />
					<Plus className="h-3.5 w-3.5" />
				</Button>
			</DialogTrigger>

			<DialogContent className="w-[calc(100%-2rem)] max-w-md overflow-hidden">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-xl font-bold">
						<span>👋</span>
						<span>Bonjour, comment puis-je vous aider ?</span>
					</DialogTitle>
					<DialogDescription>
						Posez votre question ou décrivez votre besoin ci-dessous et notre assistant vous aidera.
					</DialogDescription>
				</DialogHeader>

				<form
					onSubmit={handleSubmit}
					className="space-y-4 pt-2 w-full min-w-0"
				>
					<div className="relative flex items-center">
						<Sparkles className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
						<Input
							className="w-full min-w-0 pl-9 pr-10"
							name="question"
							value={question}
							onChange={(event) => {
								setQuestion(event.target.value);
							}}
							placeholder="Comment puis-je vous aider ?"
							required
							autoFocus
						/>
						<Button
							type="submit"
							size="icon"
							variant="ghost"
							className="absolute right-1.5 h-7 w-7 text-muted-foreground hover:text-primary"
						>
							<Send className="h-4 w-4" />
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}






