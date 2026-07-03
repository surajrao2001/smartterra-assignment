import type { RouteObject } from 'react-router-dom';
import { ROUTES } from './routePaths';
import PrivateRoutes from './PrivateRoutes';
import PublicRoutes from './PublicRoutes';
import {Home} from '../pages/home/Home';


const Routes: RouteObject[] = [
  {
    element: <PublicRoutes />,
    children: [
      {
        path: ROUTES.HOME,
        element: <Home />,
      }
    ],
  },
  {
    element: <PrivateRoutes />,
    children: [
      {
        path: ROUTES.HOME,
        // element: <HomePage />,
      }
    ],
  },
];

export default Routes;