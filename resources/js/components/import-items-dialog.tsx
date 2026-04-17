// components/import-items-dialog.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ClipboardPaste } from 'lucide-react';

export function ImportItemsDialog({ onImport }: { onImport: (data: string) => void }) {
    const [text, setText] = useState('');
    const [open, setOpen] = useState(false);

    const handleProcess = () => {
        onImport(text);
        setText('');
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2">
                    <ClipboardPaste className="h-4 w-4 text-slate-500" />
                    <span>Import</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-150">
                <DialogHeader>
                    <DialogTitle>Coller les données d'Excel</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <p className="text-sm text-slate-500">
                        Copiez les colonnes (Bateau, Espèce, Qte, Prix, Unité, Poids) depuis Excel et collez-les ici.
                    </p>
                    <Textarea 
                        placeholder="Collez ici..." 
                        className="min-h-50 font-mono text-xs"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                    <Button className="w-full" onClick={handleProcess} disabled={!text.trim()}>
                        Importer {text.trim().split('\n').length} lignes
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}