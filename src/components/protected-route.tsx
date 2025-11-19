import { useAuth } from '../contexts/auth-context';
import { Navigate, Outlet } from 'react-router-dom';

export const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    // Redirect them to the /login page, but save the location they were
    // trying to go to so we can send them there after they login.
    return <Navigate to="/login" replace />;
  }

  return <Outlet />; // Render the child route (MainPage)
};