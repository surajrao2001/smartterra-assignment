import type { ReactNode } from 'react';
import { useCan } from '../../hooks/useCan';
import type { Permission } from '../../store/permissions';

interface GuardProps {
    permission: Permission;
    children: ReactNode;
    fallback?: ReactNode;
}

export function Guard({ permission, children, fallback = null }: GuardProps) {
    const allowed = useCan(permission);
    return allowed ? <>{children}</> : <>{fallback}</>;
}
