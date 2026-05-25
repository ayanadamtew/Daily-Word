import { createBrowserRouter } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import Journal from './pages/Journal';
import History from './pages/History';
import Stats from './pages/Stats';
import Recap from './pages/Recap';
import Groups from './pages/Groups';
import Settings from './pages/Settings';
import Auth from './pages/Auth';

export const router = createBrowserRouter([
  {
    path: '/auth',
    element: <Auth />,
  },
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Journal /> },
      { path: 'history', element: <History /> },
      { path: 'stats', element: <Stats /> },
      { path: 'recap', element: <Recap /> },
      { path: 'groups', element: <Groups /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
]);
