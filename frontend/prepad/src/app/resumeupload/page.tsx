'use client';

import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  //const [file, setFile] = useState(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const fileType = droppedFile.type;
      
      if (fileType === "application/pdf" || 
          fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
       // setFile(droppedFile);
      } else {
        alert("Please upload a .pdf or .docx file");
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const fileType = selectedFile.type;
      
      if (fileType === "application/pdf" || 
          fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
       // setFile(selectedFile);
      } else {
        alert("Please upload a .pdf or .docx file");
      }
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center relative overflow-hidden px-4 py-8">
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
        <h1 className="text-5xl md:text-6xl font-semibold mb-4 max-w-3xl">
          Upload resume
        </h1>
        <p className="text-gray-300 max-w-md mx-auto">
          Provide your resume to help us create your concise profile
        </p>
      </div>
      
      {/* Resume Upload Section */}
      <div className="w-full max-w-md z-10">
        <div 
          className={`border-2 border-dashed rounded-lg p-8 mb-4 text-center transition-colors ${
            isDragging ? "border-purple-500 bg-purple-900/20" : "border-gray-600 hover:border-purple-500"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="mb-4 flex justify-center">
            <div className="w-16 h-16 rounded-lg bg-gray-700/60 flex items-center justify-center">
            <Image className="fill-purple-400"
          src="/fileplus.svg"
          alt="profile"
          width={24}
          height={24}
          priority
        />


            </div>
          </div>
          <p className="mb-2 text-sm text-gray-400">
            Drag and drop resume file to upload (.docx, .pdf)
          </p>
          <p className="text-xs text-gray-500 mb-4">
            Your profile will be created once you upload
          </p>
          <label className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded cursor-pointer inline-block transition">
            Select file
            <input
              type="file"
              className="hidden"
              accept=".pdf,.docx"
              onChange={handleFileChange}
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
            
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="text"
                    placeholder="First name"
                    className="w-full p-3 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Last name"
                    className="w-full p-3 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="tel"
                    placeholder="Phone number"
                    className="w-full p-3 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Zip code"
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
    </main>
  );
}