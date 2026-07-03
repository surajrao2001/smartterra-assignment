import { useAppStore } from '../store/useAppStore';
import { CAN, type Permission } from '../store/permissions';
import type { Role } from '../types/user';

export function useCan(permission: Permission, role?: Role | null): boolean {
    const currentRole = useAppStore(s => s.currentUser?.role);
    const r = role ?? currentRole;
    return CAN[permission](r);
}

export function useCurrentRole(): Role | undefined {
    return useAppStore(s => s.currentUser?.role);
}
