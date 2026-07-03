import { Navigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { ROUTES } from './routePaths';

export function RootRedirect() {
    const currentUser = useAppStore(s => s.currentUser);
    return <Navigate to={currentUser ? ROUTES.APP : ROUTES.LOGIN} replace />;
}
