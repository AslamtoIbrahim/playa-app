import { useCallback, useEffect, useMemo, useState } from 'react';
import type { NavGroup } from '@/types';

export type NavGroupsOpenState = Record<string, boolean>;

export interface UseNavGroupsReturn {
    isOpen: (groupTitle: string) => boolean;
    toggle: (groupTitle: string) => void;
}

const storageKey = 'playa:nav-groups';

const readStoredNavGroups = (groupTitles: string[]): NavGroupsOpenState => {
    if (typeof window === 'undefined') {
        return {};
    }

    try {
        const storedValue = window.localStorage.getItem(storageKey);

        if (!storedValue) {
            return {};
        }

        const parsedValue: unknown = JSON.parse(storedValue);

        if (typeof parsedValue !== 'object' || parsedValue === null) {
            return {};
        }

        const storedGroups = parsedValue as Record<string, unknown>;

        return groupTitles.reduce<NavGroupsOpenState>((openState, title) => {
            const storedGroupState = storedGroups[title];

            if (typeof storedGroupState === 'boolean') {
                openState[title] = storedGroupState;
            }

            return openState;
        }, {});
    } catch {
        return {};
    }
};

const writeStoredNavGroups = (openState: NavGroupsOpenState): void => {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.localStorage.setItem(storageKey, JSON.stringify(openState));
    } catch {
        // Storage may be unavailable (private browsing, quota, etc.).
    }
};

export function useNavGroups(
    groups: NavGroup[],
    activeGroupTitle: string | null,
): UseNavGroupsReturn {
    const groupTitles = useMemo(
        () => groups.map((group) => group.title),
        [groups],
    );

    const [storedOpenState, setStoredOpenState] = useState<NavGroupsOpenState>(
        () => readStoredNavGroups(groupTitles),
    );

    const isOpen = useCallback(
        (groupTitle: string): boolean => {
            const storedGroupState = storedOpenState[groupTitle];

            if (typeof storedGroupState === 'boolean') {
                return storedGroupState;
            }

            return groupTitle === activeGroupTitle;
        },
        [activeGroupTitle, storedOpenState],
    );

    const toggle = useCallback(
        (groupTitle: string): void => {
            setStoredOpenState((currentState) => {
                const storedGroupState = currentState[groupTitle];
                const isGroupOpen =
                    typeof storedGroupState === 'boolean'
                        ? storedGroupState
                        : groupTitle === activeGroupTitle;

                return {
                    ...currentState,
                    [groupTitle]: !isGroupOpen,
                };
            });
        },
        [activeGroupTitle],
    );

    useEffect(() => {
        writeStoredNavGroups(storedOpenState);
    }, [storedOpenState]);

    return { isOpen, toggle };
}
