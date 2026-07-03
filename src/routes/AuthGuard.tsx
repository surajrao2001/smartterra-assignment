import { Navigate, Outlet } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { ROUTES } from './routePaths';

export function AuthGuard() {
    const currentUser = useAppStore(s => s.currentUser);

    if (!currentUser) {
        return <Navigate to={ROUTES.LOGIN} replace />;
    }

    return <Outlet />;
}

export function GuestGuard() {
    const currentUser = useAppStore(s => s.currentUser);

    if (currentUser) {
        return <Navigate to={ROUTES.APP} replace />;
    }

    return <Outlet />;
}
