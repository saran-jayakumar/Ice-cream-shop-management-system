import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from './hooks/useToast';
import AppRoutes from './routes/AppRoutes';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
