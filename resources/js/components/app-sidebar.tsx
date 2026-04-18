import { Link } from '@inertiajs/react';
import { Banknote, BookOpen, Building2, CalendarClock, DoorOpen, FileText, FolderGit2, LayoutGrid, Package, Ship, Tags, User } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { customers, boats, categories, dashboard, invoices, items, officeRooms, payments, companies, sessions } from '@/routes';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Tableau de bord',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Sociétés',
        href: companies(),
        icon: Building2,
    },
    {
        title: 'Journées',
        href: sessions(),
        icon: CalendarClock,
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
        title: 'Bureaux',
        href: officeRooms(),
        icon: DoorOpen,
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
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
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


