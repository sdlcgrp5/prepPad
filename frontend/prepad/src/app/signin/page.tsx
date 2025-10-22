'use client';

import Image from "next/image";
import Link from 'next/link';
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, loginWithGoogle } = useAuth();

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
        We are currently in beta
      </div>
      
      {/* Main heading */}
      <h1 className="text-5xl md:text-6xl font-semibold text-center mb-6 max-w-3xl">
        Seamless resume 
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
            className="w-full p-4 bg-neutral-700/40 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        
        <div>
          <input
            type="password"
            placeholder="Enter your password"
            required
            className="w-full p-4 bg-neutral-700/40 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        
        {/* Forgot Password Link */}
        <div className="text-right">
          <a 
            href="#" 
            className="text-white hover:text-amber-400 transition text-sm"
          >
            Forgot password
          </a>
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full bg-purple-700 hover:bg-purple-600 text-white py-4 px-6 rounded-md font-medium transition duration-300 flex justify-center items-center ${
            isLoading ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {isLoading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      {/* Divider */}
      <div className="relative flex items-center justify-center my-6 w-full max-w-md">
        <div className="border-t border-gray-600 w-full"></div>
        <div className="bg-gray-900 px-4 text-gray-400 text-sm">or</div>
        <div className="border-t border-gray-600 w-full"></div>
      </div>

      {/* Google Sign-in Button */}
      <button
        type="button"
        onClick={loginWithGoogle}
        disabled={isLoading}
        className="w-full max-w-md bg-white hover:bg-gray-100 text-gray-900 py-4 px-6 rounded-md font-medium transition duration-300 flex justify-center items-center space-x-3 border border-gray-300 z-10"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <span>Continue with Google</span>
      </button>
      
      <p className="text-center text-white mt-4">
        New here? <Link href="/" className="text-white font-semibold hover:text-amber-400 transition">Get Started</Link>
      </p>
    </main>
  );
}