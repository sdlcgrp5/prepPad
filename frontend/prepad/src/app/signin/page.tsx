'use client';

import Image from "next/image";
import Link from 'next/link';
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";





export default function Home() {
   const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      const success = await login(email, password);
      
      if (!success) {
        setError("Invalid email or password");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
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
      <h1 className="text-5xl md:text-6xl font-semibold text-center mb-6 max-w-3xl">
        Seamless job application 
        <br /> optimization for <span className="text-amber-200 italic">free</span>
      </h1>
      
      
      {/* Form */}
      <form 
        className="w-full max-w-md space-y-4 z-10"
        onSubmit={handleSubmit}
      >
         {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-2 rounded-sm">
               {error}
            </div>
         )}


        <div>
          <input
            type="email"
            placeholder="Enter your email address"
            required
            className="w-full p-4 bg-neutral-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        
        <div>
          <input
            type="password"
            placeholder="Enter your password"
            required
            className="w-full p-4 bg-neutral-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full bg-purple-700 hover:bg-purple-600 text-white py-4 px-6 rounded-md transition duration-300 flex justify-center items-center ${
            isLoading ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {isLoading ? "Signing in..." : "Get started"}
        </button>
        
        <p className="text-center text-white mt-4">
          New here? <Link href="/" className="text-white font-semibold hover:text-amber-400 transition">Get Started</Link>
        </p>
      </form>
    </main>
  );
}
