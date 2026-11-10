import type { Metadata } from 'next';
import './globals.css';
import ToastContainer from '@/components/ui/toast';

export const metadata: Metadata = {
  title: 'UPGC Mutuelle - Gestion',
  description: 'Système de gestion des mutuelles et associations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}