'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Global listener for WebMCP agent-directed navigation events.
 * Enables the AI agent to smoothly navigate the user's browser using Next.js client-side routing
 * without losing React state or reloading the page.
 */
export default function WebMCPNavigationListener() {
  const router = useRouter();

  useEffect(() => {
    const handleNavigation = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && typeof detail.url === 'string') {
        const url = detail.url.trim();
        // Strict security boundary: only internal relative URLs allowed
        if (url.startsWith('/') && !url.startsWith('//')) {
          router.push(url);
        }
      }
    };

    window.addEventListener('webmcp-navigation', handleNavigation);
    return () => window.removeEventListener('webmcp-navigation', handleNavigation);
  }, [router]);

  return null;
}
