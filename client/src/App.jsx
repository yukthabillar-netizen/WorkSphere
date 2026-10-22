import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes/AppRoutes';
import { useAuthStore, applyThemeToDOM } from './store/authStore';
import { Toaster } from 'sonner';

function App() {
  const { initAuth, theme } = useAuthStore();

  useEffect(() => {
    initAuth();
    applyThemeToDOM(theme);
  }, []);

  return (
    <BrowserRouter>
      <AppRoutes />
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        theme={theme === 'dark' ? 'dark' : theme === 'light' ? 'light' : 'system'}
      />
    </BrowserRouter>
  );
}

export default App;