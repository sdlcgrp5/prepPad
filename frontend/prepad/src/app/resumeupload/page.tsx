'use client';

import Image from "next/image";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from 'next/navigation';
import HybridDateSelector from '@/components/HybridDateSelector';
import ConsentModal from '@/components/privacy/ConsentModal';
import Cookies from 'js-cookie';

// Define validation error type
interface ValidationErrors {
  [key: string]: string;
}

interface ParsedResumeData {
  file?: string;
  processed_content?: {
    name?: string;
    contact_info?: {
      email?: string;
      phone?: string | null;
      zipCode?: string;
    };
    education?: {
      institution?: string;
      highestDegree?: string;
      fieldOfStudy?: string;
      graduationYear?: string;
    };
    work_experience?: {
      company?: string;
      jobTitle?: string;
      startDate?: string;
      endDate?: string;
      jobDescription?: string;
    };
    skills?: string[];
  };
}

export default function Home() {
  // All useState hooks must be declared before any conditional returns
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExperienceModalOpen, setIsExperienceModalOpen] = useState(false);
  const [isEducationModalOpen, setIsEducationModalOpen] = useState(false);
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  
  // Form state
  const [basicInfo, setBasicInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
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

  // Form validation errors
  const [basicInfoErrors, setBasicInfoErrors] = useState<ValidationErrors>({});
  const [experienceInfoErrors, setExperienceInfoErrors] = useState<ValidationErrors>({});
  const [educationInfoErrors, setEducationInfoErrors] = useState<ValidationErrors>({});

  // Auth and router hooks
  const { user, logout, isLoading, hasDataProcessingConsent, setDataProcessingConsent } = useAuth();
  const router = useRouter();

  // Authentication guard - show loading while auth is being determined
  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border border-purple-600 mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </main>
    );
  }

  // Redirect to signin if not authenticated
  if (!user) {
    router.push('/signin');
    return (
      <main className="flex min-h-screen flex-col items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border border-purple-600 mx-auto mb-4"></div>
          <p className="text-white">Redirecting...</p>
        </div>
      </main>
    );
  }

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
    // Check if user has given consent, if not show consent modal
    if (!hasDataProcessingConsent) {
      setPendingFile(file);
      setIsConsentModalOpen(true);
      return;
    }
    
    await processFileUpload(file);
  };

  const processFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      
      // File validation
      if (!file) {
        throw new Error('No file selected');
      }

      const fileType = file.type;
      if (fileType !== "application/pdf" && fileType !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        throw new Error('Please upload a PDF or DOCX file');
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('File size should be less than 10MB');
      }

      // Step 1: Upload and Parse Resume
      const formData = new FormData();
      formData.append('file', file);
      // Add privacy preference to request
      formData.append('anonymize_pii', hasDataProcessingConsent ? 'true' : 'false');

      const parseResponse = await fetch('/api/resume', {
        method: 'POST',
        body: formData
      });

      if (!parseResponse.ok) {
        const errorData = await parseResponse.json();
        throw new Error(errorData.message || 'Resume parsing failed');
      }

      // Step 2: Get Parsed Data
      const rawResponse = await parseResponse.text();
      const rawData: ParsedResumeData = JSON.parse(rawResponse);
      
      // Log in development only (without sensitive data)
      if (process.env.NODE_ENV === 'development') {
        console.log('Resume parsing completed successfully');
      }

      // Extract data from processed_content
      if (rawData.processed_content) {
        const content = rawData.processed_content;
        
        // Handle name
        let firstName = '', lastName = '';
        if (content.name) {
          const nameParts = content.name.trim().split(/\s+/);
          if (nameParts.length > 0) {
            firstName = nameParts[0];
            lastName = nameParts.slice(1).join(' ');
          }
        }

        // Step 3: Format Data for Profile Creation
        const profileData = {
          firstName,
          lastName,
          email: content.contact_info?.email || '',
          phone: content.contact_info?.phone || '',
          experience: content.work_experience ? [{
            jobTitle: content.work_experience.jobTitle || '',
            company: content.work_experience.company || '',
            startDate: content.work_experience.startDate || '',
            endDate: content.work_experience.endDate || '',
            location: '',
            jobDescription: content.work_experience.jobDescription || ''
          }] : [],
          education: content.education ? [{
            highestDegree: content.education.highestDegree || '',
            fieldOfStudy: content.education.fieldOfStudy || '',
            institution: content.education.institution || '',
            graduationYear: content.education.graduationYear || ''
          }] : [],
          skills: content.skills || []
        };
        
        if (process.env.NODE_ENV === 'development') {
          console.log('Profile data processed successfully');
        }

        // Validate required fields with detailed error messages
        const missingFields = [];
        if (!profileData.firstName) missingFields.push('First Name');
        if (!profileData.lastName) missingFields.push('Last Name');
        if (!profileData.email) missingFields.push('Email');

        if (missingFields.length > 0) {
          console.error('Missing fields in parsed data:', rawData);
          throw new Error(`Missing required profile information: ${missingFields.join(', ')}. Please check if your resume contains this information or fill it in manually.`);
        }

        // Update form state with parsed data
        setBasicInfo({
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          email: profileData.email,
          phone: profileData.phone || '',
          zipCode: content.contact_info?.zipCode || ''
        });

        if (profileData.experience.length > 0) {
          setExperienceInfo({
            jobTitle: profileData.experience[0].jobTitle,
            company: profileData.experience[0].company,
            startDate: profileData.experience[0].startDate,
            endDate: profileData.experience[0].endDate,
            location: profileData.experience[0].location,
            jobDescription: profileData.experience[0].jobDescription
          });
        }

        if (profileData.education.length > 0) {
          setEducationInfo({
            highestDegree: profileData.education[0].highestDegree,
            fieldOfStudy: profileData.education[0].fieldOfStudy,
            institution: profileData.education[0].institution,
            graduationYear: profileData.education[0].graduationYear
          });
        }

        if (profileData.skills.length > 0) {
          setSkillsInfo(prev => ({
            ...prev,
            skills: profileData.skills
          }));
        }

        // Open the form modal with pre-filled data
        setIsModalOpen(true);
        setIsUploading(false);
      } else {
        throw new Error('No processed content in response');
      }
    } catch (e) {
      setIsUploading(false);
      console.error('Error:', e);
      alert(e instanceof Error ? e.message : 'An unexpected error occurred');
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setBasicInfoErrors({});
  };

  const closeExperienceModal = () => {
    setIsExperienceModalOpen(false);
    setExperienceInfoErrors({});
  };

  const validateBasicInfo = (): boolean => {
    const errors: ValidationErrors = {};

    // Check first name
    if (!basicInfo.firstName.trim()) {
      errors.firstName = "First name is required";
    }

    // Check last name
    if (!basicInfo.lastName.trim()) {
      errors.lastName = "Last name is required";
    }

    // Check phone
    if (!basicInfo.phone) {
      errors.phone = "Phone number is required";
    } else {
      // Remove all non-numeric characters for the check
      const digitsOnly = basicInfo.phone.replace(/\D/g, '');
      if (digitsOnly.length !== 10) {
        errors.phone = "Phone number must be exactly 10 digits";
      } else if (!/^\d{3}-\d{3}-\d{4}$/.test(basicInfo.phone)) {
        // This shouldn't happen with our formatter, but just in case
        errors.phone = "Phone number should be in XXX-XXX-XXXX format";
      }
    }

    // Check zip code
    if (!basicInfo.zipCode) {
      errors.zipCode = "Zip code is required";
    } else if (!/^\d{5}(-\d{4})?$/.test(basicInfo.zipCode)) {
      errors.zipCode = "Enter a valid zip code (e.g., 12345 or 12345-6789)";
    }

    setBasicInfoErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateExperienceInfo = (): boolean => {
    const errors: ValidationErrors = {};

    // Job description is optional but if provided, check length
    if (experienceInfo.jobDescription && experienceInfo.jobDescription.length > 500) {
      errors.jobDescription = "Description must be 500 characters or less";
    }

    setExperienceInfoErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateEducationInfo = (): boolean => {
    const errors: ValidationErrors = {};

    // Check highest degree
    if (!educationInfo.highestDegree) {
      errors.highestDegree = "Please select your highest degree";
    }

    // Check field of study
    if (!educationInfo.fieldOfStudy.trim()) {
      errors.fieldOfStudy = "Field of study is required";
    }

    // Check institution
    if (!educationInfo.institution.trim()) {
      errors.institution = "Institution name is required";
    }

    // Check graduation year
    if (!educationInfo.graduationYear) {
      errors.graduationYear = "Graduation year is required";
    } else {
      const year = parseInt(educationInfo.graduationYear);
      const currentYear = new Date().getFullYear();
      
      if (isNaN(year) || year < 1900 || year > currentYear + 10) {
        errors.graduationYear = `Please enter a valid year between 1900 and ${currentYear + 10}`;
      }
    }

    setEducationInfoErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBasicInfoSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate basic info
    if (validateBasicInfo()) {
      // Move to the next step - professional experience
      setIsModalOpen(false);
      setIsExperienceModalOpen(true);
    }
  };

  const formatPhoneNumber = (value: string): string => {
    // Remove all non-numeric characters
    const phoneNumber = value.replace(/\D/g, '');
    
    // Format the phone number as XXX-XXX-XXXX
    if (phoneNumber.length <= 3) {
      return phoneNumber;
    } else if (phoneNumber.length <= 6) {
      return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
    } else {
      return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    }
  };

  const handleBasicInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Special handling for phone number
    if (name === 'phone') {
      const formattedPhone = formatPhoneNumber(value);
      setBasicInfo({
        ...basicInfo,
        [name]: formattedPhone
      });
    } else {
      setBasicInfo({
        ...basicInfo,
        [name]: value
      });
    }
    
    // Clear specific error when field is being edited
    if (basicInfoErrors[name]) {
      setBasicInfoErrors({
        ...basicInfoErrors,
        [name]: ''
      });
    }
  };
  
  const handleExperienceInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setExperienceInfo({
      ...experienceInfo,
      [name]: value
    });
    
    // Clear specific error when field is being edited
    if (experienceInfoErrors[name]) {
      setExperienceInfoErrors({
        ...experienceInfoErrors,
        [name]: ''
      });
    }
  };

  const handleBackToBasicInfo = () => {
    setIsExperienceModalOpen(false);
    setExperienceInfoErrors({});
    setIsModalOpen(true);
  };

  const handleExperienceSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate experience info
    if (validateExperienceInfo()) {
      // Move to the next form (education)
      setIsExperienceModalOpen(false);
      setIsEducationModalOpen(true);
    }
  };

  const closeEducationModal = () => {
    setIsEducationModalOpen(false);
    setEducationInfoErrors({});
  };

  const handleBackToExperience = () => {
    setIsEducationModalOpen(false);
    setEducationInfoErrors({});
    setIsExperienceModalOpen(true);
  };

  const handleEducationInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEducationInfo({
      ...educationInfo,
      [name]: value
    });
    
    // Clear specific error when field is being edited
    if (educationInfoErrors[name]) {
      setEducationInfoErrors({
        ...educationInfoErrors,
        [name]: ''
      });
    }
  };

  const handleEducationSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate education info
    if (validateEducationInfo()) {
      // Move to the next form (skills)
      setIsEducationModalOpen(false);
      setIsSkillsModalOpen(true);
    }
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
      // Check if skill already exists
      if (!skillsInfo.skills.includes(skillsInfo.newSkill.trim())) {
        setSkillsInfo({
          skills: [...skillsInfo.skills, skillsInfo.newSkill.trim()],
          newSkill: ''
        });
      } else {
        alert("This skill has already been added");
      }
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

    // Check if at least one skill is provided
    if (skillsInfo.skills.length === 0) {
      alert("Please add at least one skill before submitting");
      return;
    }

    try {
      // Prepare the profile data
      const profileData = {
        firstName: basicInfo.firstName,
        lastName: basicInfo.lastName,
        email: basicInfo.email,
        phone: basicInfo.phone,
        zipCode: basicInfo.zipCode,
        jobTitle: experienceInfo.jobTitle,
        company: experienceInfo.company,
        yearsOfExperience: experienceInfo.startDate && experienceInfo.endDate ? 
          calculateYearsOfExperience(experienceInfo.startDate, experienceInfo.endDate).toString() : null,
        linkedinUrl: null,
        highestDegree: educationInfo.highestDegree,
        fieldOfStudy: educationInfo.fieldOfStudy,
        institution: educationInfo.institution,
        graduationYear: educationInfo.graduationYear,
        skills: skillsInfo.skills
      };

      // Get the auth token - check both JWT and NextAuth methods
      let token = Cookies.get('auth_token');
      
      // If no JWT token found, check if user is authenticated via NextAuth
      if (!token && user) {
        // For NextAuth users, we'll send the placeholder token
        // The API will detect this and use NextAuth session instead
        token = 'nextauth';
      }
      
      if (!token) {
        throw new Error('No authentication found');
      }

      // Create profile using the profile API
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error creating profile:', errorData);
        throw new Error(errorData.error || 'Failed to create profile');
      }

      await response.json();
      if (process.env.NODE_ENV === 'development') {
        console.log('Profile created successfully');
      }

      // Close the modal and show success message
      setIsSkillsModalOpen(false);

      // Redirect to profile page
      router.push('/profile');
    } catch (error) {
      console.error('Error submitting profile:', error);
      alert(error instanceof Error ? error.message : 'An error occurred. Please try again later.');
    }
  };

  const calculateYearsOfExperience = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = endDate === 'Present' ? new Date() : new Date(endDate);
    const diffInYears = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return Math.round(diffInYears);
  };

  const handleConsentResponse = (granted: boolean) => {
    setDataProcessingConsent(granted);
    setIsConsentModalOpen(false);
    
    if (granted && pendingFile) {
      // User granted consent, proceed with file upload
      processFileUpload(pendingFile);
      setPendingFile(null);
    } else {
      // User declined consent or no pending file
      setPendingFile(null);
      if (!granted) {
        alert('Resume processing requires consent for AI analysis. You can change this preference in your profile settings later.');
      }
    }
  };

  const handleConsentModalClose = () => {
    setIsConsentModalOpen(false);
    setPendingFile(null);
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
          className="text-white py-1 px-3 bg-red-600 hover:bg-red-700 rounded-md font-medium transition"
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
      <div className="bg-neutral-700/40 text-white py-2 px-6 rounded-full mb-6 backdrop-blur-sm border border-gray-500/50">
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
          className={`border border-dashed rounded-lg p-8 mb-4 text-center transition-colors ${isDragging ? "border-purple-500 bg-purple-900/20" : "border-gray-500 hover:border-purple-500"
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

          <p className="mb-2 text-sm text-gray-200">
            {isUploading ? 'Uploading...' : 'Drag and drop resume file to upload (.docx, .pdf)'}
          </p>
          <p className="text-xs text-gray-400 mb-4">
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
            className="text-white hover:text-purple-400 font-medium transition"
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
                    className={`w-full p-3 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 ${basicInfoErrors.firstName ? 'border border-red-500 focus:ring-red-500' : 'focus:ring-purple-500'}`}
                  />
                  {basicInfoErrors.firstName && (
                    <p className="text-red-500 text-xs mt-1">{basicInfoErrors.firstName}</p>
                  )}
                </div>
                <div>
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last name"
                    value={basicInfo.lastName}
                    onChange={handleBasicInfoChange}
                    className={`w-full p-3 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 ${basicInfoErrors.lastName ? 'border border-red-500 focus:ring-red-500' : 'focus:ring-purple-500'}`}
                  />
                  {basicInfoErrors.lastName && (
                    <p className="text-red-500 text-xs mt-1">{basicInfoErrors.lastName}</p>
                  )}
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
                    maxLength={12} // To accommodate XXX-XXX-XXXX format
                    className={`w-full p-3 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 ${basicInfoErrors.phone ? 'border border-red-500 focus:ring-red-500' : 'focus:ring-purple-500'}`}
                  />
                  {basicInfoErrors.phone && (
                    <p className="text-red-500 text-xs mt-1">{basicInfoErrors.phone}</p>
                  )}
                </div>
                <div>
                  <input
                    type="text"
                    name="zipCode"
                    placeholder="Zip code"
                    value={basicInfo.zipCode}
                    onChange={handleBasicInfoChange}
                    className={`w-full p-3 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 ${basicInfoErrors.zipCode ? 'border border-red-500 focus:ring-red-500' : 'focus:ring-purple-500'}`}
                  />
                  {basicInfoErrors.zipCode && (
                    <p className="text-red-500 text-xs mt-1">{basicInfoErrors.zipCode}</p>
                  )}
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-purple-700 hover:bg-purple-600 text-white py-3 px-6 rounded font-medium transition duration-300"
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
                  <div>
                    <HybridDateSelector
                      name="startDate"
                      value={experienceInfo.startDate}
                      onChange={handleExperienceInfoChange}
                      placeholder="Start date (MM/YYYY)"
                    />
                  </div>
                  
                  {/* End Date Selector */}
                  <div>
                    <HybridDateSelector
                      name="endDate"
                      value={experienceInfo.endDate}
                      onChange={handleExperienceInfoChange}
                      placeholder="End date (MM/YYYY)"
                      allowPresent={true}
                    />
                  </div>
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
                    maxLength={500}
                    value={experienceInfo.jobDescription || ''}
                    onChange={handleExperienceInfoChange}
                    className={`w-full p-3 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 resize-none h-24 ${experienceInfoErrors.jobDescription ? 'border border-red-500 focus:ring-red-500' : 'focus:ring-purple-500'}`}
                  ></textarea>
                  <div className="flex justify-between items-center mt-1">
                    <div>
                      {experienceInfoErrors.jobDescription && (
                        <p className="text-red-500 text-xs">{experienceInfoErrors.jobDescription}</p>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      {(experienceInfo.jobDescription?.length || 0)}/500 characters
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <button
                    type="button"
                    onClick={handleBackToBasicInfo}
                    className="bg-gray-600 hover:bg-gray-500 text-white py-3 px-6 rounded font-medium transition duration-300"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="bg-purple-700 hover:bg-purple-600 text-white py-3 px-6 rounded font-medium transition duration-300"
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
                    className={`w-full p-3 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 appearance-none ${educationInfoErrors.highestDegree ? 'border border-red-500 focus:ring-red-500' : 'focus:ring-purple-500'}`}
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
                  {educationInfoErrors.highestDegree && (
                    <p className="text-red-500 text-xs mt-1">{educationInfoErrors.highestDegree}</p>
                  )}
                </div>
                <div>
                  <input
                    type="text"
                    name="fieldOfStudy"
                    placeholder="Field of Study"
                    value={educationInfo.fieldOfStudy}
                    onChange={handleEducationInfoChange}
                    className={`w-full p-3 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 ${educationInfoErrors.fieldOfStudy ? 'border border-red-500 focus:ring-red-500' : 'focus:ring-purple-500'}`}
                  />
                  {educationInfoErrors.fieldOfStudy && (
                    <p className="text-red-500 text-xs mt-1">{educationInfoErrors.fieldOfStudy}</p>
                  )}
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
                    className={`w-full p-3 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 ${educationInfoErrors.institution ? 'border border-red-500 focus:ring-red-500' : 'focus:ring-purple-500'}`}
                  />
                  {educationInfoErrors.institution && (
                    <p className="text-red-500 text-xs mt-1">{educationInfoErrors.institution}</p>
                  )}
                </div>
                <div>
                  <input
                    type="text"
                    name="graduationYear"
                    placeholder="Graduation Year"
                    value={educationInfo.graduationYear}
                    onChange={handleEducationInfoChange}
                    className={`w-full p-3 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 ${educationInfoErrors.graduationYear ? 'border border-red-500 focus:ring-red-500' : 'focus:ring-purple-500'}`}
                  />
                  {educationInfoErrors.graduationYear && (
                    <p className="text-red-500 text-xs mt-1">{educationInfoErrors.graduationYear}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleBackToExperience}
                  className="bg-gray-600 hover:bg-gray-500 text-white py-3 px-6 rounded font-medium transition duration-300"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="bg-purple-700 hover:bg-purple-600 text-white py-3 px-6 rounded font-medium transition duration-300"
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
                <div className="flex flex-wrap gap-2 mb-4 min-h-[60px] p-2 border border-gray-700 rounded">
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
                    <div className="text-gray-400 text-sm flex items-center justify-center w-full h-full">Add your professional skills below</div>
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
                {skillsInfo.skills.length === 0 && (
                  <p className="text-amber-400 text-xs mt-2">Please add at least one skill before submitting</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleBackToEducation}
                  className="bg-gray-600 hover:bg-gray-500 text-white py-3 px-6 rounded font-medium transition duration-300 border border-purple-500"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="bg-purple-700 hover:bg-purple-600 text-white py-3 px-6 rounded font-medium transition duration-300"
                  disabled={skillsInfo.skills.length === 0}
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

      {/* Consent Modal */}
      <ConsentModal
        isOpen={isConsentModalOpen}
        onConsent={handleConsentResponse}
        onClose={handleConsentModalClose}
        type="resume-upload"
      />
    </main>
  )
}