import type { Metadata } from 'next';
import '@/styles/globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { AskAIProvider } from '@/context/AskAIContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AuthModal from '@/components/auth/AuthModal';
import CartDrawer from '@/components/cart/CartDrawer';
import WebMCPIndicator from '@/components/webmcp/WebMCPIndicator';
import AskAIPanel from '@/components/askai/AskAIPanel';
import WebMCPNavigationListener from '@/components/navigation/WebMCPNavigationListener';

export const metadata: Metadata = {
  title: 'Bridge to Agentia Atelier | WebMCP-Powered Luxury Fashion & Apparel',
  description: 'Next-generation luxury apparel platform exposing 34 WebMCP tools on document.modelContext for AI agents while delivering a sleek human shopping experience.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <AskAIProvider>
                <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                  <Navbar />
                  <main style={{ flex: 1 }}>{children}</main>
                  <Footer />
                </div>
                <AuthModal />
                <CartDrawer />
                <WebMCPIndicator />
                <AskAIPanel />
                <WebMCPNavigationListener />
              </AskAIProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

