import type { InertiaLinkProps } from '@inertiajs/react';
import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function toUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}


export const commandItemClass = 'text-xs !bg-white cursor-pointer flex items-center gap-2 px-3 py-2 rounded-sm outline-none data-[selected=true]:!bg-slate-200 data-[selected=true]:!text-black transition-colors';