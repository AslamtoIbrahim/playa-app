import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import {
    attendances,
    boats,
    categories,
    cautions,
    companies,
    customers,
    dashboard,
    differences,
    invoices,
    items,
    officeRooms,
    payments,
    receipts,
    sales,
    sessions,
    workers,
    zones,
} from '@/routes';
import type { NavGroup } from '@/types';
import {
    Banknote,
    Building2,
    CalendarClock,
    DoorOpen,
    FileText,
    LayoutGrid,
    MapPin,
    Package,
    Receipt,
    Scale,
    ShieldCheck,
    Ship,
    ShoppingBag,
    Tags,
    User,
    UserCheck,
    Users
} from 'lucide-react';

const mainNavGroups: NavGroup[] = [
    {
        title: 'Tableau de bord',
        items: [
            {
                title: 'Tableau de bord',
                href: dashboard(),
                icon: LayoutGrid,
            },
        ],
    },
    {
        title: 'Activité',
        items: [
            {
                title: 'Journées',
                href: sessions(),
                icon: CalendarClock,
            },
            {
                title: 'Pointages',
                href: attendances(),
                icon: UserCheck,
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
                title: 'Différences',
                href: differences(),
                icon: Scale,
            },
        ],
    },
    {
        title: 'Finance',
        items: [
            {
                title: 'Factures',
                href: invoices(),
                icon: FileText,
            },
            {
                title: 'Paiements',
                href: payments(),
                icon: Banknote,
            },
            {
                title: 'Cautions',
                href: cautions(),
                icon: ShieldCheck,
            },
        ],
    },
    {
        title: 'Organisation',
        items: [
            {
                title: 'Zones',
                href: zones(),
                icon: MapPin,
            },
            {
                title: 'Bureaux',
                href: officeRooms(),
                icon: DoorOpen,
            },
            {
                title: 'Bateaux',
                href: boats(),
                icon: Ship,
            },
            {
                title: 'Ouvriers',
                href: workers(),
                icon: Users,
            },
        ],
    },
    {
        title: 'Partenaires',
        items: [
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
        ],
    },
    {
        title: 'Catalogue',
        items: [
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
        ],
    },
];

// const footerNavItems: NavItem[] = [
//     {
//         title: 'Repository',
//         href: 'https://github.com/laravel/react-starter-kit',
//         icon: FolderGit2,
//     },
//     {
//         title: 'Documentation',
//         href: 'https://laravel.com/docs/starter-kits#react',
//         icon: BookOpen,
//     },
// ];

export function AppSidebar() {
    return (
        <Sidebar
            collapsible="icon"
            variant="inset"
            className="**:data-[active=true]:bg-sky-100 **:data-[active=true]:text-sky-700 dark:**:data-[active=true]:bg-sky-950 dark:**:data-[active=true]:text-sky-300"
        >
            <SidebarHeader>
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="text-sky-500 transition-colors hover:text-sky-600 dark:text-sky-400 dark:hover:text-sky-300" />
                    <span className="text-sm font-medium group-data-[collapsible=icon]:hidden">
                        Réduire la barre
                    </span>
                </div>
            </SidebarHeader>

            <SidebarContent>
                <NavMain groups={mainNavGroups} />
            </SidebarContent>

            <SidebarFooter>
                {/* <NavFooter items={footerNavItems} className="mt-auto" /> */}
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
