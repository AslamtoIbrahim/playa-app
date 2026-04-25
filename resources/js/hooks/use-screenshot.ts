import { toPng } from 'html-to-image';
import { toast } from 'sonner';

interface ScreenshotOptions {
    style?: Partial<CSSStyleDeclaration>;
}

export function useScreenshot() {
    const copyToClipboard = async (elementId: string, options: ScreenshotOptions = {}) => {
        const element = document.getElementById(elementId);

        if (!element) {
            toast.error('Élément non trouvé');

            return;
        }

        const toastId = toast.loading('Capture en cours...');

        try {
            element.classList.add('screenshot-mode');

            const dataUrl = await toPng(element, {
                cacheBust: true,
                backgroundColor: '#ffffff',
                // ندمج الستايل الافتراضي مع الستايل الممرر عبر البرامتر
                style: {
                    margin: '0',
                    ...options.style,
                },
                filter: (node: any) => {
                    const exclusionClasses = ['print:hidden', 'no-print'];

                    return !exclusionClasses.some((cls) =>
                        node.classList?.contains(cls),
                    );
                },
            });

            element.classList.remove('screenshot-mode');

            const response = await fetch(dataUrl);

            const blob = await response.blob();

            if (navigator.clipboard && navigator.clipboard.write) {
                await navigator.clipboard.write([
                    new ClipboardItem({ [blob.type]: blob }),
                ]);

                toast.success('Capture réussie ! Prêt à coller (WhatsApp)', {
                    id: toastId,
                });
            }
        } catch (error) {
            element.classList.remove('screenshot-mode');

            console.error(error);

            toast.error('Erreur de capture', { id: toastId });
        }
    };

    return { copyToClipboard };
}