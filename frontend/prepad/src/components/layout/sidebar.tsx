// components/Sidebar.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const { logout } = useAuth();
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-44 bg-gray-800/30 backdrop-blur-md border-r border-gray-500 pt-8 px-6 z-50 transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0`}>
      <div className="mb-12 flex items-center justify-between">
        <Link href="/">
          <Image
            src="/prepadlight.svg"
            alt="PrepPad Logo"
            width={70}
            height={31}
            priority
          />
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1 hover:bg-gray-700 rounded-md transition-colors"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      <ul className="space-y-6">
        <li>
          <Link
            href="/dashboard"
            className={`flex items-center space-x-2 ${pathname === '/dashboard' ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}
            onClick={onClose}
          >
            <Image
              src="/GridFour.svg"
              alt="PrepPad Logo"
              width={20}
              height={20}
              priority
            />
            <span>Dashboard</span>
          </Link>
        </li>
        <li>
          <div className="flex items-center space-x-2 text-gray-500 cursor-not-allowed">
            <Image
              src="/nullFileDoc.svg"
              alt="PrepPad Logo"
              width={20}
              height={20}
              priority
            />
            <span>Resumes</span>
          </div>
        </li>
        <li>
          <Link
            href="/profile"
            className={`flex items-center space-x-2 ${pathname === '/profile' ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}
            onClick={onClose}
          >
            <Image
              src="/User-2.svg"
              alt="PrepPad Logo"
              width={20}
              height={20}
              priority
            />
            <span>Profile</span>
          </Link>
        </li>
      </ul>
      
      <button
        onClick={logout}
        className="absolute bottom-8 left-0 right-0 flex items-center justify-center space-x-2 px-4 text-gray-400 hover:text-white font-medium"
      >
        <Image
          src="/SignOut.svg"
          alt="PrepPad Logo"
          width={20}
          height={20}
          priority
        />
        <span>Sign out</span>
      </button>
      </div>
    </>
  );
}