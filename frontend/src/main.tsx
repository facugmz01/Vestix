import '@/utils/generateUUID';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/600.css';

import App from './App';
import './styles/tokens.css';
import './index.css';
import { queryClient } from './core/queryClient';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#171512',
              color: '#FFFFFF',
              border: '1px solid #3A342E',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              fontWeight: 600,
              boxShadow: 'var(--shadow-md)',
            },
            success: {
              style: {
                background: '#166534',
                color: '#FFFFFF',
                border: '1px solid #15803D',
              },
              iconTheme: { primary: '#BBF7D0', secondary: '#166534' },
            },
            error: {
              style: {
                background: '#991B1B',
                color: '#FFFFFF',
                border: '1px solid #B91C1C',
              },
              iconTheme: { primary: '#FECACA', secondary: '#991B1B' },
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
