import React, { useState, useEffect } from 'react';
import { Mail, Building2, Users, Shield } from 'lucide-react';

interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onLoadingComplete }) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('Initializing...');

  const loadingSteps = [
    { progress: 20, text: 'Connecting to secure servers...' },
    { progress: 40, text: 'Verifying authentication...' },
    { progress: 60, text: 'Loading employee database...' },
    { progress: 80, text: 'Preparing communication tools...' },
    { progress: 100, text: 'Ready to launch!' }
  ];

  useEffect(() => {
    let currentStepIndex = 0;
    
    const interval = setInterval(() => {
      if (currentStepIndex < loadingSteps.length) {
        const step = loadingSteps[currentStepIndex];
        setProgress(step.progress);
        setCurrentStep(step.text);
        currentStepIndex++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          onLoadingComplete();
        }, 500);
      }
    }, 800);

    return () => clearInterval(interval);
  }, [onLoadingComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Floating Orbs */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-amber-200/30 to-orange-200/30 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-gradient-to-r from-orange-200/20 to-yellow-200/20 rounded-full blur-lg animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-gradient-to-r from-yellow-200/25 to-amber-200/25 rounded-full blur-md animate-pulse delay-500"></div>
      </div>

      {/* Main Loading Container */}
      <div className="relative z-10 text-center max-w-md mx-auto px-8">
        {/* 3D Logo Container */}
        <div className="relative mb-8">
          {/* 3D Mail Icon with Floating Animation */}
          <div className="relative mx-auto w-24 h-24 mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl transform rotate-12 animate-pulse shadow-2xl"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl transform -rotate-6 animate-pulse delay-300 shadow-xl"></div>
            <div className="relative bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl p-6 transform hover:scale-105 transition-transform duration-300 shadow-2xl">
              <Mail className="w-12 h-12 text-white mx-auto animate-bounce" />
            </div>
          </div>

          {/* Floating Icons */}
          <div className="absolute -top-4 -left-8 animate-float">
            <div className="bg-gradient-to-r from-amber-100 to-orange-100 p-3 rounded-full shadow-lg">
              <Building2 className="w-6 h-6 text-amber-700" />
            </div>
          </div>
          <div className="absolute -top-2 -right-8 animate-float delay-1000">
            <div className="bg-gradient-to-r from-orange-100 to-yellow-100 p-3 rounded-full shadow-lg">
              <Users className="w-6 h-6 text-orange-700" />
            </div>
          </div>
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 animate-float delay-500">
            <div className="bg-gradient-to-r from-yellow-100 to-amber-100 p-3 rounded-full shadow-lg">
              <Shield className="w-6 h-6 text-yellow-700" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-amber-900 mb-2 animate-fade-in">
          Corporate Communications
        </h1>
        <p className="text-amber-700 mb-8 animate-fade-in delay-300">
          Secure Employee Messaging Portal
        </p>

        {/* Progress Bar Container */}
        <div className="relative mb-6">
          {/* 3D Progress Bar Background */}
          <div className="w-full h-4 bg-gradient-to-r from-amber-100 to-orange-100 rounded-full shadow-inner border border-amber-200">
            {/* Progress Fill with 3D Effect */}
            <div 
              className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-full shadow-lg transition-all duration-500 ease-out relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              {/* Shimmer Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              {/* 3D Highlight */}
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-full"></div>
            </div>
          </div>
          
          {/* Progress Percentage */}
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
              {progress}%
            </div>
          </div>
        </div>

        {/* Loading Text */}
        <p className="text-amber-800 font-medium animate-pulse">
          {currentStep}
        </p>

        {/* Loading Dots */}
        <div className="flex justify-center space-x-2 mt-4">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce delay-100"></div>
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce delay-200"></div>
        </div>

        {/* Security Badge */}
        <div className="mt-8 flex items-center justify-center space-x-2 text-amber-700 text-sm">
          <Shield className="w-4 h-4" />
          <span>Secure Connection Established</span>
        </div>
      </div>

      {/* Particle Effects */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-amber-400/50 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default LoadingScreen;