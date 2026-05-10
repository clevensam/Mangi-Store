import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './lib/theme-provider';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import { ApolloProvider } from '@apollo/client';
import { client } from './lib/apollo';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="light" storageKey="dukasmart-theme">
      <ApolloProvider client={client}>
        <AuthProvider>
          <Toaster position="top-right" richColors />
          <App />
        </AuthProvider>
      </ApolloProvider>
    </ThemeProvider>
  </StrictMode>,
);