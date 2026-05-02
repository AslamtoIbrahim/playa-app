import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface DataTableSimpleProps {
    data: any[];
    columns: string[];
    labels: string[];
}

export function DataTableSimple({ data, columns, labels }: DataTableSimpleProps) {
    
    if (data.length === 0) {
        return <div className="text-sm text-slate-400 italic py-2 text-center">Aucune donnée disponible</div>;
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        {labels.map((label) => (
                            <TableHead key={label}>{label}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((row, index) => (
                        <TableRow key={index}>
                            {columns.map((col) => (
                                <TableCell key={col}>
                                    {typeof row[col] === 'number' ? `${row[col].toLocaleString()} MAD` : row[col]}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}