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
  startDate?: string;
  endDate?: string;
  location?: string;
  jobDescription?: string;
  yearsOfExperience: string | null;
  linkedinUrl: string | null;
  highestDegree: string | null;
  fieldOfStudy: string | null;
  institution: string | null;
  graduationYear: string | null;
  skills: string[];
}

// Example job experience - typically this would come from the database
interface JobExperience {
  id: number;
  startDate: string;
  endDate: string;
  jobTitle: string;
  company: string;
  location: string;
  description: string[];
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

  // Format the degree display
  const formatDegree = (degree: string | null) => {
    if (!degree) return "Masters"; // Default value
    
    switch(degree) {
      case 'high_school': return 'High School';
      case 'associate': return 'Associate\'s';
      case 'bachelor': return 'Bachelor\'s';
      case 'master': return 'Masters';
      case 'doctorate': return 'Doctorate';
      default: return degree;
    }
  };
  
  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      {/* Left sidebar */}
      <div className="w-36 bg-gray-800 p-4 flex flex-col fixed h-full">
        <div className="mb-12">
          <Link href="/">
            <div className="flex items-center">
              {/* Logo using SVG from public folder */}
              <div className="w-8 h-8 mr-1">
                <Image
                  src="/prePad-favicon.svg"
                  alt="PrepPad Logo"
                  width={32}
                  height={32}
                  priority
                />
              </div>
              <div className="h-8 w-24">
                <Image
                  src="/prepadlight.svg"
                  alt="PrepPad Text"
                  width={96}
                  height={32}
                  priority
                  className="object-contain"
                />
              </div>
            </div>
          </Link>
        </div>
        
        <nav className="flex-1">
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
              <Link href="/resumes" className="flex items-center space-x-2 text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <span>Resumes</span>
              </Link>
            </li>
            <li>
              <Link href="/profile" className="flex items-center space-x-2 text-purple-400 border-l-2 border-purple-400 pl-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>Profile</span>
              </Link>
            </li>
          </ul>
        </nav>
        
        <button 
          onClick={logout}
          className="mt-auto flex items-center text-gray-400 hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span className="ml-2">Sign out</span>
        </button>
      </div>
      
      {/* Main content */}
      <div className="ml-36 p-8 w-full">
        {/* Header with title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Profile</h1>
        </div>
        
        {/* Profile content - only render if profile exists */}
        {profile && (
          <div className="space-y-8">
            {/* Profile header with avatar and basic info */}
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center space-x-4">
                <div className="bg-purple-300 w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-gray-800">
                  {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold">{profile.firstName} {profile.lastName}</h2>
                  <p className="text-gray-400">
                    {profile.jobTitle || 'Machine Learning Specialist'} 
                    {profile.company && ', '}
                    {profile.company || 'Data Designer, Graphics Designer'}
                  </p>
                  <p className="text-sm text-gray-500">NY {profile.zipCode || '12180'}</p>
                </div>
              </div>
              
              <button 
                onClick={() => router.push('/resumeupload')}
                className="bg-purple-700 hover:bg-purple-600 text-white px-4 py-2 rounded flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Edit
              </button>
            </div>
            
            {/* Personal Information */}
            <section className="border-t border-gray-700 pt-6">
              <h3 className="text-xl font-semibold mb-4 text-purple-400">Personal Information</h3>
              
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Email address</p>
                  <p>{user?.email || 'johndoe09@gmail.com'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400 mb-1">Phone</p>
                  <p>{profile.phone || '123 456 7890'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400 mb-1">Location</p>
                  <p>New York</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400 mb-1">First Name</p>
                  <p>{profile.firstName}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400 mb-1">Last Name</p>
                  <p>{profile.lastName}</p>
                </div>
              </div>
            </section>
            
            {/* Experience */}
            <section className="border-t border-gray-700 pt-6">
              <h3 className="text-xl font-semibold mb-4 text-purple-400">Experience(s)</h3>
              
              <div className="space-y-6">
                <div className="flex">
                  <div className="bg-gray-800 text-center px-2 py-1 rounded w-24 h-fit text-sm mr-4">
                    {profile.startDate ? profile.startDate.substring(0, 5) : "06/24"} - {profile.endDate === "present" ? "Present" : profile.endDate ? profile.endDate.substring(0, 5) : "Present"}
                  </div>
                  
                  <div className="flex-1">
                    <div className="grid grid-cols-3 mb-2">
                      <div>
                        <p className="text-sm text-gray-400">Job Role</p>
                        <p className="font-medium">{profile.jobTitle || "Product Manager"}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-400">Company</p>
                        <p className="font-medium">{profile.company || "Amazon Audio"}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-400">Location</p>
                        <p className="font-medium">{profile.location || "Manchester, NY"}</p>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <p className="text-sm text-gray-400 mb-1">Job Description</p>
                      <ul className="list-disc pl-5 space-y-1">
                        {profile.jobDescription ? (
                          <li>{profile.jobDescription}</li>
                        ) : (
                          <li>Continuously iterating the strategy based on market feedback and performance metrics</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            
            {/* Education */}
            <section className="border-t border-gray-700 pt-6">
              <h3 className="text-xl font-semibold mb-4 text-purple-400">Education</h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Degree</p>
                  <p>{formatDegree(profile.highestDegree)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400 mb-1">Field of study</p>
                  <p>{profile.fieldOfStudy || 'Information Technology'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400 mb-1">Institution</p>
                  <p>{profile.institution || 'Rensselaer Polytechnic Institute'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400 mb-1">Graduation Year</p>
                  <p>{profile.graduationYear || '2024'}</p>
                </div>
              </div>
            </section>
            
            {/* Skills */}
            <section className="border-t border-gray-700 pt-6">
              <h3 className="text-xl font-semibold mb-4 text-purple-400">Skills</h3>
              
              <div className="flex flex-wrap gap-2">
                {profile.skills && profile.skills.length > 0 ? (
                  profile.skills.map((skill, index) => (
                    <span 
                      key={index} 
                      className="bg-purple-900 px-3 py-1 rounded text-sm"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <>
                    <span className="bg-purple-900 px-3 py-1 rounded text-sm">Machine Learning</span>
                    <span className="bg-purple-900 px-3 py-1 rounded text-sm">Graphics Design</span>
                    <span className="bg-purple-900 px-3 py-1 rounded text-sm">Backend Development</span>
                    <span className="bg-purple-900 px-3 py-1 rounded text-sm">Communication</span>
                    <span className="bg-purple-900 px-3 py-1 rounded text-sm">Database Management</span>
                    <span className="bg-purple-900 px-3 py-1 rounded text-sm">Presentation</span>
                    <span className="bg-purple-900 px-3 py-1 rounded text-sm">Teamwork</span>
                    <span className="bg-purple-900 px-3 py-1 rounded text-sm">DevOps</span>
                  </>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}