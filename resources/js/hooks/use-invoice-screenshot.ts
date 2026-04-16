import { toPng } from 'html-to-image';
import { toast } from "sonner";

export function useInvoiceScreenshot() {
    const copyToClipboard = async () => {
        const element = document.getElementById('invoice-content');
        if (!element) return;

        const toastId = toast.loading("Capture en cours...");

        try {
            // 1. 🚀 "نطلقو" الـ Scroll مؤقتاً قبل التصوير
            element.classList.add('screenshot-mode');

            // 2. 📸 نصوروا الـ Element وهو "مطلق"
            const dataUrl = await toPng(element, {
                cacheBust: true,
                backgroundColor: '#ffffff',
                // هاد الفلتر كيحيد الأزرار والـ Checkboxes
                filter: (node: any) => {
                    const exclusionClasses = ['print:hidden', 'no-print'];
                    return !exclusionClasses.some(cls => node.classList?.contains(cls));
                },
            });

            // 3. 🔙 نرجعو الـ Scroll كيف كان (نحيدو الـ Class)
            element.classList.remove('screenshot-mode');

            const response = await fetch(dataUrl);
            const blob = await response.blob();

            if (navigator.clipboard && navigator.clipboard.write) {
                await navigator.clipboard.write([
                    new ClipboardItem({ [blob.type]: blob })
                ]);
                toast.success("Capture réussie !", { id: toastId });
            }
        } catch (error) {
            // ضروري نحيدو الـ Class حتى إلا وقع خطأ باش ما يخسرش الـ UI
            element.classList.remove('screenshot-mode');
            console.error(error);
            toast.error("Erreur de capture", { id: toastId });
        }
    };

    return { copyToClipboard };
}