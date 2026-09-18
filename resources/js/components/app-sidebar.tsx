import { Banknote, BookOpen, Building2, CalendarClock, DoorOpen, FileText, FolderGit2, LayoutGrid, MapPin, Package, Receipt, Scale, ShieldCheck, Ship, ShoppingBag, Tags, User, UserCheck, Users } from 'lucide-react';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import { customers, boats, categories, dashboard, invoices, items, officeRooms, payments, companies, sessions, differences, receipts, cautions, sales, workers, attendances, zones } from '@/routes';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Tableau de bord',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Zones',
        href: zones(),
        icon: MapPin,
    },
    {
        title: 'Journées',
        href: sessions(),
        icon: CalendarClock,
    },
    {
        title: 'Bureaux',
        href: officeRooms(),
        icon: DoorOpen,
    },
    {
        title: 'Sociétés',
        href: companies(),
        icon: Building2,
    },
    {
        title: 'Clients',
        href: customers(),
        icon: User,
    },
    {
        title: 'Bateaux',
        href: boats(),
        icon: Ship,
    },
    {
        title: 'Cautions',
        href: cautions(),
        icon: ShieldCheck,
    },
    {
        title: 'Catégories',
        href: categories(),
        icon: Tags,
    },
    {
        title: 'Articles',
        href: items(),
        icon: Package,
    },
    {
        title: 'Factures',
        href: invoices(),
        icon: FileText,
    },
    {
        title: 'Ventes',
        href: sales(),
        icon: ShoppingBag,
    },

    {
        title: 'Bons de Réception',
        href: receipts(),
        icon: Receipt,
    },
    {
        title: 'Differences',
        href: differences(),
        icon: Scale,
    },
    {
        title: 'Ouvriers',
        href: workers(),
        icon: Users,
    },
    {
        title: 'Pointages',
        href: attendances(),
        icon: UserCheck,
    },
    {
        title: 'Paiements',
        href: payments(),
        icon: Banknote,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: FolderGit2,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="text-sky-500 transition-colors hover:text-sky-600 dark:text-sky-400 dark:hover:text-sky-300" />
                    <span className="text-sm font-medium group-data-[collapsible=icon]:hidden">
                        Réduire la barre
                    </span>
                </div>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}


