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
    <div className="fixed left-0 top-0 h-full w-44 bg-gray-800/50 border-r border-gray-500 pt-8 px-6">
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
          <Link href="/profile" className={`flex items-center space-x-2 ${pathname === '/profile' ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}>
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
  );
}