'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ProfileData {
  id: number;
  firstName: string;
  lastName: string;
  phone: string | null;
  zipCode: string | null;
  jobTitle: string | null;
  company: string | null;
  yearsOfExperience: string | null;
  linkedinUrl: string | null;
  highestDegree: string | null;
  fieldOfStudy: string | null;
  institution: string | null;
  graduationYear: string | null;
  skills: string[];
}

export default function Profile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/profile');
        const data = await response.json();
        
        if (data.success) {
          setProfile(data.profile);
        } else {
          console.error('Failed to fetch profile:', data.error);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, []);
  
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <p>Loading profile...</p>
      </div>
    );
  }
  
  // If no profile exists, redirect to resume upload
  if (!profile && !loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white">
        <p className="mb-6">No profile found. Please create one first.</p>
        <Link 
          href="/resumeupload" 
          className="bg-purple-700 hover:bg-purple-600 text-white py-2 px-4 rounded"
        >
          Create Profile
        </Link>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Left sidebar */}
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
            <Link href="/dashboard" className="flex items-center space-x-2 text-gray-400 hover:text-white">
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
            <Link href="/resume" className="flex items-center space-x-2 text-gray-400 hover:text-white">
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
            <Link href="/profile" className="flex items-center space-x-2 text-purple-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>Profile</span>
            </Link>
          </li>
          <li>
            <Link href="/notification" className="flex items-center space-x-2 text-gray-400 hover:text-white">
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
      
      {/* Main content */}
      <div className="ml-36 p-8">
        {/* Header with user info */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Profile</h1>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="relative h-10 w-10 rounded-full bg-purple-200">
                {profile && (
                  <div className="flex h-full w-full items-center justify-center rounded-full font-bold text-gray-800">
                    {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <p className="font-semibold">{user?.email || 'User'}</p>
                <p className="text-sm text-gray-400">johndoe09@gmail.com</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Profile content - only render if profile exists */}
        {profile && (
          <div className="mt-8 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative h-20 w-20 overflow-hidden rounded-full bg-purple-200">
                  <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-gray-800">
                    {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
                  </div>
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold">{profile.firstName} {profile.lastName}</h2>
                  <p className="text-gray-400">
                    {profile.jobTitle || 'Machine Learning Specialist'} 
                    {profile.jobTitle && profile.company && ', '}
                    {profile.company || 'Data Designer, Graphics Designer'}
                  </p>
                  <p className="text-sm text-gray-500">NY {profile.zipCode || '12180'}</p>
                </div>
              </div>
              
              <button 
                onClick={() => router.push('/resumeupload')}
                className="rounded bg-purple-700 px-4 py-2 hover:bg-purple-600"
              >
                Edit
              </button>
            </div>
            
            {/* Personal Information */}
            <div className="rounded-lg border-t border-gray-700 pt-8">
              <h3 className="mb-4 text-xl font-semibold">Personal Information</h3>
              
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="mb-1 text-sm text-gray-400">Firstname</p>
                  <p>{profile.firstName}</p>
                </div>
                
                <div>
                  <p className="mb-1 text-sm text-gray-400">Lastname</p>
                  <p>{profile.lastName}</p>
                </div>
                
                <div>
                  <p className="mb-1 text-sm text-gray-400">Location</p>
                  <p>New York</p>
                </div>
                
                <div>
                  <p className="mb-1 text-sm text-gray-400">Email address</p>
                  <p>{user?.email || 'johndoe@gmail.comm'}</p>
                </div>
                
                <div>
                  <p className="mb-1 text-sm text-gray-400">Phone</p>
                  <p>{profile.phone || '123 456 7890'}</p>
                </div>
              </div>
            </div>
            
            {/* Education */}
            <div className="rounded-lg border-t border-gray-700 pt-8">
              <h3 className="mb-4 text-xl font-semibold">Education</h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="mb-1 text-sm text-gray-400">Degree</p>
                  <p>{profile.highestDegree === 'bachelor' ? 'Bachelor\'s' : 
                      profile.highestDegree === 'master' ? 'Masters' : 
                      profile.highestDegree === 'doctorate' ? 'Doctorate' : 
                      profile.highestDegree || 'Masters'}</p>
                </div>
                
                <div>
                  <p className="mb-1 text-sm text-gray-400">Field of study</p>
                  <p>{profile.fieldOfStudy || 'Information Technology'}</p>
                </div>
                
                <div>
                  <p className="mb-1 text-sm text-gray-400">Graduation Year</p>
                  <p>{profile.graduationYear || '2024'}</p>
                </div>
                
                <div>
                  <p className="mb-1 text-sm text-gray-400">Institution</p>
                  <p>{profile.institution || 'Rensselaer Polytechnic Institute'}</p>
                </div>
              </div>
            </div>
            
            {/* Skills */}
            <div className="rounded-lg border-t border-gray-700 pt-8">
              <h3 className="mb-4 text-xl font-semibold">Skills</h3>
              
              <div className="flex flex-wrap gap-2">
                {profile.skills && profile.skills.length > 0 ? (
                  profile.skills.map((skill, index) => (
                    <span 
                      key={index} 
                      className="inline-block rounded bg-purple-900 px-3 py-1 text-sm"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <>
                    <span className="inline-block rounded bg-purple-900 px-3 py-1 text-sm">Machine Learning</span>
                    <span className="inline-block rounded bg-purple-900 px-3 py-1 text-sm">Graphics Design</span>
                    <span className="inline-block rounded bg-purple-900 px-3 py-1 text-sm">Backend Development</span>
                    <span className="inline-block rounded bg-purple-900 px-3 py-1 text-sm">Communication</span>
                    <span className="inline-block rounded bg-purple-900 px-3 py-1 text-sm">Database Management</span>
                    <span className="inline-block rounded bg-purple-900 px-3 py-1 text-sm">Presentation</span>
                    <span className="inline-block rounded bg-purple-900 px-3 py-1 text-sm">Teamwork</span>
                    <span className="inline-block rounded bg-purple-900 px-3 py-1 text-sm">DevOps</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}