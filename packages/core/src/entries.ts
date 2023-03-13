export type Entries<T, K extends keyof T = keyof T> = [K, T[K]][];
