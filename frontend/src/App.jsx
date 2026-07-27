import { RouterProvider } from 'react-router-dom';
import router from './router/index.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
