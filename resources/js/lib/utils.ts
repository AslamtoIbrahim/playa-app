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


export const commandItemClass = 'text-xs !bg-white dark:!bg-neutral-900 cursor-pointer flex items-center gap-2 px-3 py-2 rounded-sm outline-none data-[selected=true]:!bg-slate-200 dark:data-[selected=true]:!bg-neutral-800 data-[selected=true]:!text-black dark:data-[selected=true]:!text-white transition-colors';
export const removeInputArraws = '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';