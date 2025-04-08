// components/Sidebar.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const { logout } = useAuth();
  const pathname = usePathname();
  
  return (
    <div className="fixed left-0 top-0 h-full w-36 bg-gray-800 p-4">
      <div className="mb-12">
        <Link href="/">
          <Image 
            src="/prepadlight.svg"
            alt="PrepPad Logo"
            width={70}
            height={31}
            priority
          />
        </Link>
      </div>
      
      <ul className="space-y-6">
        <li>
          <Link href="/dashboard" className={`flex items-center space-x-2 ${pathname === '/dashboard' ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span>Dashboard</span>
          </Link>
        </li>
        <li>
          <Link href="/resume" className={`flex items-center space-x-2 ${pathname === '/resume' ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <span>Resume</span>
          </Link>
        </li>
        <li>
          <Link href="/profile" className={`flex items-center space-x-2 ${pathname === '/profile' ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>Profile</span>
          </Link>
        </li>
        <li>
          <Link href="/notification" className={`flex items-center space-x-2 ${pathname === '/notification' ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <span>Notification</span>
          </Link>
        </li>
      </ul>
      
      <button 
        onClick={logout}
        className="absolute bottom-8 left-0 right-0 flex items-center justify-center space-x-2 px-4 text-gray-400 hover:text-white"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        <span>Sign out</span>
      </button>
    </div>
  );
}