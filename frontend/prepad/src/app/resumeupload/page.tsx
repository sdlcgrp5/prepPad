'use client';

import Image from "next/image";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from 'next/navigation';
import HybridDateSelector from '@/components/HybridDateSelector';

export default function Home() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExperienceModalOpen, setIsExperienceModalOpen] = useState(false);
  const [isEducationModalOpen, setIsEducationModalOpen] = useState(false);
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
  const { user, logout, token } = useAuth();
  const router = useRouter();

  // Form state
  const [basicInfo, setBasicInfo] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    zipCode: ''
  });

  const [experienceInfo, setExperienceInfo] = useState({
    jobTitle: '',
    company: '',
    startDate: '',
    endDate: '',
    location: '',
    jobDescription: ''
  });

  const [educationInfo, setEducationInfo] = useState({
    highestDegree: '',
    fieldOfStudy: '',
    institution: '',
    graduationYear: ''
  });

  const [skillsInfo, setSkillsInfo] = useState({
    skills: [] as string[],
    newSkill: ''
  });

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const fileType = droppedFile.type;

      if (fileType === "application/pdf" ||
        fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        await handleFileUpload(droppedFile);
      } else {
        alert("Please upload a .pdf or .docx file");
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const fileType = selectedFile.type;

      if (fileType === "application/pdf" ||
        fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        await handleFileUpload(selectedFile);
      } else {
        alert("Please upload a .pdf or .docx file");
      }
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      console.log('Token before resume upload:', token); // Debug log

      // Send to Django backend for resume parsing
      const response = await fetch('http://localhost:8000/api/resume-upload/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}` // Use token from context
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Resume upload error:', errorData);
        throw new Error('Resume upload failed');
      }

      const data = await response.json();
      console.log('Resume upload response data:', data);

      // Extract profile data from the processed content
      const processedContent = data.processed_content || data.processed_data || data;
      console.log('Raw processed content:', processedContent);
      console.log('Contact info:', processedContent.contact_info);
      console.log('Work experience:', processedContent.work_experience);
      console.log('Education:', processedContent.education);
      console.log('Skills:', processedContent.skills);
      
      if (!processedContent) {
        console.error('No processed content in response:', data);
        throw new Error('No processed content received from resume');
      }

      try {
        // Extract name into first and last name
        const fullName = processedContent.name || '';
        console.log('Full name from resume:', fullName);

        // Split name into first and last name (basic implementation)
        const nameParts = fullName.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Extract contact info from array
        const [email, phone, address] = processedContent.contact_info || [];

        // Extract work experience from array
        const workExp = processedContent.work_experience?.[0] || {};

        // Extract education from array
        const edu = processedContent.education?.[0] || {};

        // Prepare profile data
        const profileData = {
          firstName,
          lastName,
          phone: phone || '',
          zipCode: address || '',
          jobTitle: workExp.job_title || '',
          company: workExp.company || '',
          jobDescription: workExp.job_description || '',
          yearsOfExperience: workExp.years_of_experience || '',
          linkedinUrl: email?.includes('linkedin.com') ? email : '',
          highestDegree: edu.degree || '',
          fieldOfStudy: edu.field_of_study || '',
          institution: edu.institution || '',
          graduationYear: edu.graduation_year || '',
          skills: processedContent.skills || []
        };

        console.log('Prepared profile data:', profileData);
        console.log('Using token from context:', token); // Debug log
        console.log('Token type:', typeof token); // Debug log
        console.log('Token length:', token?.length); // Debug log

        if (!token) {
          throw new Error('Not authenticated. Please log in first.');
        }

        // Send profile data to create/update profile
        const profileResponse = await fetch('/api/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // Use token from context
          },
          body: JSON.stringify(profileData)
        });

        if (!profileResponse.ok) {
          const errorData = await profileResponse.json();
          console.error('Profile creation error details:', errorData);
          throw new Error(errorData.error || errorData.details?.issues?.[0]?.message || 'Failed to create profile');
        }

        const profileResult = await profileResponse.json();
        console.log('Profile created successfully:', profileResult);

        // Show success message
        alert('Resume uploaded and profile created successfully!');

        // Redirect to dashboard
        router.push('/dashboard');

      } catch (error) {
        console.error('Error processing resume data:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : 'Failed to process resume');
    } finally {
      setIsUploading(false);
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const closeExperienceModal = () => {
    setIsExperienceModalOpen(false);
  };

  const handleBasicInfoSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Move to the next step - professional experience
    setIsModalOpen(false);
    setIsExperienceModalOpen(true);
  };

  const handleBasicInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBasicInfo({
      ...basicInfo,
      [name]: value
    });
  };
  
  const handleExperienceInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement |     HTMLSelectElement>) => {
    const { name, value } = e.target;
    setExperienceInfo({
      ...experienceInfo,
      [name]: value
    });
  };

  const handleBackToBasicInfo = () => {
    setIsExperienceModalOpen(false);
    setIsModalOpen(true);
  };

  const handleExperienceSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Move to the next form (education)
    setIsExperienceModalOpen(false);
    setIsEducationModalOpen(true);
  };

  const closeEducationModal = () => {
    setIsEducationModalOpen(false);
  };

  const handleBackToExperience = () => {
    setIsEducationModalOpen(false);
    setIsExperienceModalOpen(true);
  };

  const handleEducationInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEducationInfo({
      ...educationInfo,
      [name]: value
    });
  };

  const handleEducationSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Move to the next form (skills)
    setIsEducationModalOpen(false);
    setIsSkillsModalOpen(true);
  };

  const closeSkillsModal = () => {
    setIsSkillsModalOpen(false);
  };

  const handleBackToEducation = () => {
    setIsSkillsModalOpen(false);
    setIsEducationModalOpen(true);
  };

  const handleAddSkill = () => {
    if (skillsInfo.newSkill.trim() !== '') {
      setSkillsInfo({
        skills: [...skillsInfo.skills, skillsInfo.newSkill.trim()],
        newSkill: ''
      });
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkillsInfo({
      ...skillsInfo,
      skills: skillsInfo.skills.filter(skill => skill !== skillToRemove)
    });
  };

  const handleSkillInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSkillsInfo({
      ...skillsInfo,
      newSkill: e.target.value
    });
  };

  const handleSkillsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Combine all data from the form steps
    const profileData = {
      ...basicInfo,
      ...experienceInfo,
      ...educationInfo,
      skills: skillsInfo.skills
    };

    try {
      // Submit profile data to the API
      const response = await fetch('http://localhost:8000/api/profile/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Add Bearer token
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (response.ok) {
        // Close the modal and show success message
        setIsSkillsModalOpen(false);

        // Redirect to profile page
        router.push('/profile');
      } else {
        console.error('Error creating profile:', data.error);
        alert('Failed to create profile. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting profile:', error);
      alert('An error occurred. Please try again later.');
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center relative overflow-hidden px-4 py-8">
      {/* User info and logout */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-4">
        <div className="text-white">
          {user?.email}
        </div>
        <button
          onClick={logout}
          className="text-white py-1 px-3 bg-red-600 hover:bg-red-700 rounded-md transition"
        >
          Logout
        </button>
      </div>

      {/* Logo */}
      <div className="mb-16 z-10">
        <Image
          src="/prepadlight.svg"
          alt="PrepPad Logo"
          width={96}
          height={43}
          priority
          className="animate-fadeIn"
        />
      </div>

      {/* Background graphics */}
      <div className="absolute top-4 left-4 z-0 w-[120px] md:w-[280px] pointer-events-none">
        <div className="relative w-full aspect-square">
          <Image
            src="/jobmatch.svg"
            alt="jobmatch"
            fill
            sizes="(max-width: 768px) 120px, 280px"
            className="object-contain"
          />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 z-0 w-[120px] md:w-[280px] pointer-events-none">
        <div className="relative w-full aspect-square">
          <Image
            src="/dashb.svg"
            alt="dashboard"
            fill
            sizes="(max-width: 768px) 120px, 280px"
            priority
          />
        </div>
      </div>

      <div className="absolute right-0 top-1/4 z-0 w-[120px] md:w-[320px] pointer-events-none">
        <div className="relative w-full aspect-square">
          <Image
            src="/joblisting.svg"
            alt="joblistiing"
            fill
            sizes="(max-width: 500px) 120px, 280px"
            priority
          />
        </div>
      </div>

      <div className="absolute bottom-2 right-4 z-0">
        <Image
          src="/profile.svg"
          alt="profile"
          width={220}
          height={220}
          priority
        />
      </div>

      {/* Beta banner */}
      <div className="bg-neutral-700/40 text-white py-2 px-6 rounded-full mb-6 backdrop-blur-sm">
        We are currently on beta
      </div>

      {/* Main heading */}
      <div className="text-center mb-8">
        <h1 className="text-5xl md:text-6xl font-semibold mb-4 max-w-3xl text-white">
          Upload resume
        </h1>
        <p className="text-gray-300 max-w-md mx-auto">
          Provide your resume to help us create your concise profile
        </p>
      </div>

      {/* Resume Upload Section */}
      <div className="w-full max-w-md z-10">
        <div
          className={`border-2 border-dashed rounded-lg p-8 mb-4 text-center transition-colors ${isDragging ? "border-purple-500 bg-purple-900/20" : "border-gray-600 hover:border-purple-500"
            }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="mb-4 flex justify-center">
            <div className="w-16 h-16 rounded-lg bg-gray-700/60 flex items-center justify-center">
              <Image
                className="fill-purple-400"
                src="/fileplus.svg"
                alt="profile"
                width={24}
                height={24}
                priority
              />
            </div>
          </div>

          <p className="mb-2 text-sm text-gray-400">
            {isUploading ? 'Uploading...' : 'Drag and drop resume file to upload (.docx, .pdf)'}
          </p>
          <p className="text-xs text-gray-500 mb-4">
            Your profile will be created once you upload
          </p>
          <label className={`bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded cursor-pointer inline-block transition ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {isUploading ? 'Uploading...' : 'Select file'}
            <input
              type="file"
              className="hidden"
              accept=".pdf,.docx"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </label>
        </div>

        <div className="text-center">
          <button
            onClick={openModal}
            className="text-white hover:text-purple-400 transition"
          >
            <span className="mr-1">Do not have a resume?</span>
            <span className="font-semibold text-amber-200 hover:underline">Create profile here</span>
          </button>
        </div>
      </div>

      {/* Modal for Basic Information */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-gray-800 rounded-lg w-full max-w-lg p-6 relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </button>

            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-white mb-2">Basic Information</h2>
            </div>

            <form className="space-y-4" onSubmit={handleBasicInfoSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First name"
                    value={basicInfo.firstName}
                    onChange={handleBasicInfoChange}
                    className="w-full p-3 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last name"
                    value={basicInfo.lastName}
                    onChange={handleBasicInfoChange}
                    className="w-full p-3 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone number"
                    value={basicInfo.phone}
                    onChange={handleBasicInfoChange}
                    className="w-full p-3 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="zipCode"
                    placeholder="Zip code"
                    value={basicInfo.zipCode}
                    onChange={handleBasicInfoChange}
                    className="w-full p-3 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-purple-700 hover:bg-purple-600 text-white py-3 px-6 rounded transition duration-300"
                >
                  Next
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <span className="text-gray-500 text-sm">01/04</span>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Professional Experience */}
        {isExperienceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
            <div className="bg-gray-800 rounded-lg w-full max-w-lg p-6 relative">
              <button
                onClick={closeExperienceModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
              </button>
              
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-white mb-2">Recent Professional Experience</h2>
              </div>
              
              <form className="space-y-4" onSubmit={handleExperienceSubmit}>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <input
                      type="text"
                      name="jobTitle"
                      placeholder="Current Job Title"
                      value={experienceInfo.jobTitle}
                      onChange={handleExperienceInfoChange}
                      className="w-full p-3 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      name="company"
                      placeholder="Company"
                      value={experienceInfo.company}
                      onChange={handleExperienceInfoChange}
                      className="w-full p-3 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Start Date Selector */}
                  <HybridDateSelector
                    name="startDate"
                    value={experienceInfo.startDate}

                    onChange={handleExperienceInfoChange}
                    placeholder="Start date (MM/YYYY)"
                  />
                  
                  {/* End Date Selector */}
                  <HybridDateSelector
                    name="endDate"
                    value={experienceInfo.endDate}
                    onChange={handleExperienceInfoChange}
                    placeholder="End date (MM/YYYY)"
                    allowPresent={true}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="location"
                    placeholder="Location"
                    value={experienceInfo.location}
                    onChange={handleExperienceInfoChange}
                    className="w-full p-3 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div>
                  <textarea
                    name="jobDescription"
                    placeholder="Job Description"
                    maxLength={300}
                    value={experienceInfo.jobDescription || ''}
                    onChange={handleExperienceInfoChange}
                    className="w-full p-3 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none h-24"
                  ></textarea>
                  <div className="text-right text-xs text-gray-400 mt-1">
                    {(experienceInfo.jobDescription?.length || 0)}/300 characters
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <button
                    type="button"
                    onClick={handleBackToBasicInfo}
                    className="bg-gray-600 hover:bg-gray-500 text-white py-3 px-6 rounded transition duration-300"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="bg-purple-700 hover:bg-purple-600 text-white py-3 px-6 rounded transition duration-300"
                  >
                    Next
                  </button>
                </div>
              </form>
              
              <div className="mt-6 text-center">
                <span className="text-gray-500 text-sm">02/04</span>
              </div>
            </div>
          </div>
        )}
      
      {/* Modal for Education */}
      {isEducationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-gray-800 rounded-lg w-full max-w-lg p-6 relative">
            <button
              onClick={closeEducationModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </button>

            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-white mb-2">Recent Education</h2>
            </div>

            <form className="space-y-4" onSubmit={handleEducationSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <select
                    name="highestDegree"
                    value={educationInfo.highestDegree}
                    onChange={handleEducationInfoChange}
                    className="w-full p-3 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
                  >
                    <option value="" disabled>Highest Degree</option>
                    <option value="high_school">High School</option>
                    <option value="associate">Associate&apos;s</option>
                    <option value="bachelor">Bachelor&apos;s</option>
                    <option value="master">Master&apos;s</option>
                    <option value="doctorate">Doctorate</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>
                <div>
                  <input
                    type="text"
                    name="fieldOfStudy"
                    placeholder="Field of Study"
                    value={educationInfo.fieldOfStudy}
                    onChange={handleEducationInfoChange}
                    className="w-full p-3 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="text"
                    name="institution"
                    placeholder="Institution"
                    value={educationInfo.institution}
                    onChange={handleEducationInfoChange}
                    className="w-full p-3 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="graduationYear"
                    placeholder="Graduation Year"
                    value={educationInfo.graduationYear}
                    onChange={handleEducationInfoChange}
                    className="w-full p-3 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleBackToExperience}
                  className="bg-gray-600 hover:bg-gray-500 text-white py-3 px-6 rounded transition duration-300"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="bg-purple-700 hover:bg-purple-600 text-white py-3 px-6 rounded transition duration-300"
                >
                  Next
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <span className="text-gray-500 text-sm">03/04</span>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Skills */}
      {isSkillsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-gray-800 rounded-lg w-full max-w-lg p-6 relative">
            <button
              onClick={closeSkillsModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </button>

            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-white mb-2">Skills</h2>
            </div>

            <form className="space-y-4" onSubmit={handleSkillsSubmit}>
              <div className="mb-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  {skillsInfo.skills.length > 0 ? (
                    skillsInfo.skills.map((skill, index) => (
                      <div
                        key={index}
                        className="inline-flex items-center bg-purple-800 text-white px-3 py-1 rounded"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="ml-2 text-purple-300 hover:text-white"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-400 text-sm">Add your professional skills below</div>
                  )}
                </div>

                <div className="flex">
                  <input
                    type="text"
                    placeholder="Add Skills"
                    value={skillsInfo.newSkill}
                    onChange={handleSkillInputChange}
                    className="flex-grow p-3 bg-gray-700 text-white rounded-l focus:outline-none focus:ring-2 focus:ring-purple-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="bg-gray-600 text-white px-4 rounded-r hover:bg-gray-500 transition"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleBackToEducation}
                  className="bg-gray-600 hover:bg-gray-500 text-white py-3 px-6 rounded transition duration-300 border border-purple-500"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="bg-purple-700 hover:bg-purple-600 text-white py-3 px-6 rounded transition duration-300"
                >
                  Create Profile
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <span className="text-gray-500 text-sm">04/04</span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}