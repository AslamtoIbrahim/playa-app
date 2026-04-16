import {
    ChevronDown,
    Download,
    FileSpreadsheet,
    FileText
} from 'lucide-react';

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
    onExport: (type: 'excel' | 'csv' | 'pdf') => void;
}

export function InvoiceExportDropdown({ onExport }: Props) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-2 border-slate-200 shadow-sm font-medium "
                >
                    <Download className="h-4 w-4 text-slate-500" />
                    <span>Export</span>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48 p-1">
                <DropdownMenuItem
                    onClick={() => onExport('excel')}
                    className="gap-2 cursor-pointer py-2 text-xs"
                >
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                    <span>Export as Excel</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                    onClick={() => onExport('pdf')}
                    className="gap-2 cursor-pointer py-2 text-xs"
                >
                    <FileText className="h-4 w-4 text-red-600" />
                    <span>Export as PDF</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                    onClick={() => onExport('csv')}
                    className="gap-2 cursor-pointer py-2 text-xs"
                >
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span>Export as CSV</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}