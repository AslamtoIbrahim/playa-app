import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
// import { AppSidebarHeader } from '@/components/app-sidebar-header';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    // breadcrumbs = [],
}: AppLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-clip">
                {/* overflow-x-clip instead of hidden: clip does not create a
                    scroll container, so position:sticky keeps working inside
                    pages (e.g. sticky table headers). */}
                {/* <AppSidebarHeader breadcrumbs={breadcrumbs} /> */}
                {children}
            </AppContent>
        </AppShell>
    );
}
