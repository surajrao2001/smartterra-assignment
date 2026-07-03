export type Role = 'admin' | 'editor' | 'operator';

export interface User {
    id: string;
    name: string;
    role: Role;
}
