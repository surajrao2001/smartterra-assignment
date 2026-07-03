import type { RouteObject } from 'react-router-dom';
import { LoginScreen } from '../components/auth/LoginScreen';
import { EditorPage } from '../pages/EditorPage';
import { AuthGuard, GuestGuard } from './AuthGuard';
import { RootRedirect } from './RootRedirect';
import { ROUTES } from './routePaths';

const routes: RouteObject[] = [
    {
        path: '/',
        element: <RootRedirect />,
    },
    {
        element: <GuestGuard />,
        children: [
            {
                path: ROUTES.LOGIN,
                element: <LoginScreen />,
            },
        ],
    },
    {
        element: <AuthGuard />,
        children: [
            {
                path: ROUTES.APP,
                element: <EditorPage />,
            },
        ],
    },
];

export default routes;
