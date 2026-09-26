import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useNavGroups } from '@/hooks/use-nav-groups';
import type { NavGroup } from '@/types';

export function NavMain({ groups = [] }: { groups: NavGroup[] }) {
    const { isCurrentUrl, isCurrentOrParentUrl } = useCurrentUrl();
    const { state } = useSidebar();
    const activeGroupTitle =
        groups.find((group) =>
            group.items.some((item) => isCurrentOrParentUrl(item.href)),
        )?.title ?? null;
    const { isOpen, toggle } = useNavGroups(groups, activeGroupTitle);
    const isCollapsed = state === 'collapsed';

    return (
        <SidebarGroup className="px-2 py-0">
            {groups.map((group) => (
                <Collapsible
                    key={group.title}
                    open={isCollapsed || isOpen(group.title)}
                    onOpenChange={() => toggle(group.title)}
                    className="group/collapsible"
                >
                    <SidebarGroupLabel
                        asChild
                        className="h-9 w-full cursor-pointer justify-between text-sm font-bold text-sidebar-foreground group-data-[collapsible=icon]:-mt-9 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    >
                        <CollapsibleTrigger>
                            <span>{group.title}</span>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </CollapsibleTrigger>
                    </SidebarGroupLabel>

                    <CollapsibleContent>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {group.items.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isCurrentUrl(item.href)}
                                            tooltip={{ children: item.title }}
                                            className="pl-6 group-data-[collapsible=icon]:pl-2"
                                        >
                                            <Link href={item.href} prefetch>
                                                {item.icon && <item.icon />}
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </CollapsibleContent>
                </Collapsible>
            ))}
        </SidebarGroup>
    );
}
