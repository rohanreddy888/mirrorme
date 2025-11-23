import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Truncate a string in the middle with ellipsis
 * @param str - The string to truncate
 * @param chars - Number of characters to show at both start and end (default: 6)
 * @returns Truncated string with ellipsis in the middle
 * @example truncate("0x1234567890abcdef1234567890abcdef", 6) => "0x1234...abcdef"
 */
export function truncate(
  str: string,
  chars: number = 6
): string {
  if (!str) return "";
  if (str.length <= chars * 2) return str;
  return `${str.substring(0, chars)}...${str.substring(str.length - chars)}`;
}

