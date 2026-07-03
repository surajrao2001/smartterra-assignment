import React from 'react';
import {Navigate, Outlet} from 'react-router-dom';
import {ROUTES} from './routePaths';

const PrivateRoutes: React.FC = () => {
    const isAuthenticated = true;

    const defaultPublicRoute = ROUTES.HOME;

    return isAuthenticated ? <Outlet /> : <Navigate to={defaultPublicRoute} replace />;
};

export default PrivateRoutes;