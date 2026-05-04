import { Head } from '@inertiajs/react';
import {
    Calendar,
    Camera,
    ChevronLeft,
    Clock,
    Plus,
    Printer,
    Trash2,
    Users,
    Wallet
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

// Types
import { Attendance } from '@/types/attendance';
import { Worker } from '@/types/worker';

// Components (غادي نكريوهم من بعد)
// import EditAttendanceDialog from './edit-attendance-dialog';
import AttendanceItemRow from '@/components/attendance-item-row';
import AddWorkersDialog from '@/components/add-workers-dialog';
import AppLayout from '@/layouts/app-layout';
import { attendances } from '@/routes';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns/format';
import DeleteWorkersDialog from '@/components/delete-workers-dialog';
import { useScreenshot } from '@/hooks/use-screenshot';
import { ExportDropdown } from '@/components/export-dropdown';
import { useAttendanceExport } from '@/hooks/use-attendance-export';

interface Props {
    attendance: Attendance;
    availableWorkers: Worker[];
}

export default function AttendancesShow({ attendance, availableWorkers }: Props) {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const { copyToClipboard } = useScreenshot();

    const { exportToExcel, exportToCSV, exportToPDF } = useAttendanceExport();
    
    const handleScreenshot = () => {
        copyToClipboard('worker-content');
    };

    
    const handleExport = (type: 'excel' | 'csv' | 'pdf') => {
        if (type === 'excel') {
            exportToExcel(attendance);
        }

        if (type === 'pdf') {
            exportToPDF(attendance);
        }

        if (type === 'csv') {
            exportToCSV(attendance);
        }
    };

    return (
        <div className="p-4 space-y-6 w-[90%] lg:w-[50%] mx-auto  ">
            <Head title={`Pointage #${attendance.id}`} />

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-xl font-black tracking-tight print:hidden text-slate-600 flex items-center gap-3">
                        <Calendar className="size-4 text-slate-600" />
                        Feuille de Pointage #{attendance.id}
                    </h1>

                    <Badge
                        variant="outline"
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1 font-bold border shadow-sm",
                            attendance.session?.status === 'open'
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-50 text-slate-600 border-slate-200"
                        )}
                    >
                        <Clock className={cn(
                            "h-3.5 w-3.5",
                            attendance.session?.status === 'open' ? "text-emerald-500" : "text-slate-400"
                        )} />
                        <span className="text-[11px] uppercase tracking-wider">
                            {attendance.session?.session_date ? format(new Date(attendance.session?.session_date), 'dd-MM-yyyy') : '---'}
                        </span>
                    </Badge>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => {
                            setIsAddDialogOpen(true);
                        }}
                        className="font-bold shadow-lg shadow-blue-100 print:hidden"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Pointer des ouvriers
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
                <Card className="border-none shadow-sm bg-slate-50">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2 font-bold uppercase text-xs text-slate-400 tracking-widest">
                            <Users className="h-3 w-3" /> Total Ouvriers
                        </CardDescription>

                        <CardTitle className="text-2xl font-black text-slate-800">
                            {attendance.items?.length || 0}
                        </CardTitle>
                    </CardHeader>
                </Card>

                <Card className="border-none shadow-sm bg-slate-50">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2 font-bold uppercase text-xs text-slate-400 tracking-widest">
                            <Wallet className="h-3 w-3" /> Masse Salariale
                        </CardDescription>

                        <CardTitle className="text-2xl font-black text-green-600">
                            {attendance.total_wage} <span className="text-sm">DH</span>
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <div className='hidden print:flex gap-8  text-slate-700 '>
                <p>
                    Total Ouvriers : <span className='font-medium text-lg'>{attendance.items?.length || 0}</span>
                </p>
                <p>
                    Masse Salariale : <span className='font-medium text-lg'>{attendance.total_wage}</span> DH
                </p>
            </div>

            <div className="w-full flex items-center justify-between">
                {attendance.items && attendance.items.length > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteDialogOpen(true)}
                        className="text-red-600 hover:bg-red-50 border-red-200 print:hidden"
                    >
                        <Trash2 className="h-4 w-4 mr-2" /> Vider la liste
                    </Button>)}

                <div className="flex gap-2 print:hidden ">

                    <Button
                        onClick={handleScreenshot}
                        variant="outline"
                        size="sm"
                        className="h-9 border-slate-200 shadow-sm hover:bg-slate-50 text-slate-500"
                        title="Copy for WhatsApp"
                    >
                        <Camera className="h-4 w-4" />
                    </Button>
                    
                    <Button variant="outline" size="sm" onClick={()=> window.print()}
                        className="h-9 border-slate-200 shadow-sm hover:bg-slate-50 text-slate-500"
                        title="Print"
                    >
                        <Printer className="h-4 w-4" />
                    </Button>

                    <ExportDropdown
                        onExport={handleExport}
                    />
                </div>
            </div>

            {/* Attendance Table */}
            <Card id="worker-content" className="border-slate-200 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="w-[15%] font-bold text-slate-600">Ouvrier</TableHead>
                            <TableHead className="w-[25%] font-bold text-slate-600">Salaire (DH)</TableHead>
                            <TableHead className="w-[5%] font-bold text-slate-600">Statut</TableHead>
                            <TableHead className="w-[15%] text-right font-bold text-slate-600">Actions</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {attendance.items && attendance.items.length > 0 ? (
                            attendance.items.map((item) => {
                                return (
                                    <AttendanceItemRow
                                        key={item.id}
                                        item={item}
                                    />
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-32 text-center text-slate-400 italic">
                                    Aucun ouvrier pointé pour le moment.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Dialogs */}
            <AddWorkersDialog
                open={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                attendanceId={attendance.id}
                availableWorkers={availableWorkers}
            />

            <DeleteWorkersDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                attendanceId={attendance.id}
                count={attendance.items?.length || 0}
            />
        </div>
    );
}

AttendancesShow.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            {
                title: 'Pointages',
                href: attendances()
            },
            {
                title: 'Détails du Pointage',
                href: '#'
            },
        ]}
    >
        {page}
    </AppLayout>
);