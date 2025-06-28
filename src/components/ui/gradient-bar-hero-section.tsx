'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import ClientOnly from '@/components/common/ClientOnly';
import DashboardButton from '@/components/ui/DashboardButton';

type AvatarProps = {
  imageSrc: string;
  delay: number;
};

const Avatar: React.FC<AvatarProps> = ({ imageSrc, delay }) => {
  return (
    <div 
      className="relative h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 rounded-full overflow-hidden border-2 border-primary-500 shadow-lg animate-fadeIn"
      style={{ animationDelay: `${delay}ms` }}
    >
      <img 
        src={imageSrc} 
        alt="Créateur manga"
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-primary-500/40 to-transparent"></div>
    </div>
  );
};

const TrustElements: React.FC = () => {
  const avatars = [
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
  ];

  return (
    <div className="inline-flex items-center space-x-2 bg-dark-900/70 backdrop-blur-sm rounded-full py-1 px-2.5 text-xs border border-primary-500/30 shadow-lg">
      <div className="flex -space-x-1.5">
        {avatars.map((avatar, index) => (
          <div
            key={index}
            className="relative h-4 w-4 rounded-full overflow-hidden border border-primary-500/50 shadow-sm animate-fadeIn"
            style={{ animationDelay: `${index * 150}ms` }}
          >
            <img
              src={avatar}
              alt="Créateur manga"
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>
      <p className="text-white animate-fadeIn whitespace-nowrap font-sans text-xs" style={{ animationDelay: '600ms' }}>
        <span className="text-primary-500 font-semibold">1.2K</span> active creators
      </p>
    </div>
  );
};

const CTAButtons: React.FC = () => {
  const { user, loading } = useAuth();

  return (
    <ClientOnly fallback={
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="w-48 h-12 bg-dark-700 rounded-full animate-pulse"></div>
        <div className="w-40 h-12 bg-dark-700 rounded-full animate-pulse"></div>
      </div>
    }>
      {loading ? (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="w-48 h-12 bg-dark-700 rounded-full animate-pulse"></div>
          <div className="w-40 h-12 bg-dark-700 rounded-full animate-pulse"></div>
        </div>
      ) : user ? (
        // User connecté - Voir mes projets et Voir la démo
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-10 py-5 sm:px-8 sm:py-4 rounded-full bg-primary-500 hover:bg-primary-600 text-white font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-lg sm:text-base font-comic text-center border border-primary-400 !text-white"
          >
            View my projects
          </Link>
          <Link
            href="#features"
            className="w-full sm:w-auto px-10 py-5 sm:px-8 sm:py-4 rounded-full bg-dark-800/80 border-2 border-primary-500 hover:bg-primary-500/10 text-white transition-all duration-300 text-lg sm:text-base font-comic text-center hover:border-primary-400"
          >
            View demo
          </Link>
        </div>
      ) : (
        // Non-connected user - Start and View demo
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full">
          <DashboardButton
            variant="highlight"
            className="w-full sm:w-auto px-8 py-4 rounded-full text-base transition-all duration-300 hover:scale-105"
          >
            Get Started
          </DashboardButton>
          <Link
            href="https://www.youtube.com/watch?v=_WyL1hdgAPo"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-dark-800/80 border-2 border-primary-500 hover:bg-primary-500/10 text-white transition-all duration-300 text-base font-comic text-center hover:border-primary-400 hover:scale-105"
          >
            View demo
          </Link>
        </div>
      )}
    </ClientOnly>
  );
};



export const MangakaHeroSection: React.FC = () => {
  return (
    <section className="relative min-h-[85vh] sm:min-h-screen flex flex-col items-center justify-center px-6 sm:px-8 md:px-12 overflow-hidden">
      <div className="absolute inset-0 bg-dark-900"></div>

      <div className="relative z-10 text-center w-full max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[85vh] sm:min-h-screen py-6 sm:py-16">
        {/* Badge utilisateur positionné plus haut */}
        <div className="mb-2 sm:mb-4">
          <TrustElements />
        </div>

        <h1 className="w-full text-white leading-tight tracking-tight mb-6 sm:mb-10 animate-fadeIn px-4 text-center">
          <span className="block font-comic font-medium text-[clamp(2.5rem,8vw,3.75rem)] sm:text-[clamp(1.5rem,6vw,3.75rem)]">
            Create epic manga,
          </span>
          <span className="block font-comic italic text-[clamp(2.5rem,8vw,3.75rem)] sm:text-[clamp(1.5rem,6vw,3.75rem)] text-primary-500">
            Without knowing how to draw.
          </span>
        </h1>

        <div className="mb-6 sm:mb-12 px-4 text-center">
          <p className="text-[clamp(1.2rem,4vw,1.5rem)] sm:text-[clamp(1rem,3vw,1.5rem)] text-gray-300 leading-relaxed animate-fadeIn animation-delay-200 font-sans mb-2">
            The AI that transforms your ideas into professional manga stories.
          </p>
          <p className="text-[clamp(1.2rem,4vw,1.5rem)] sm:text-[clamp(1rem,3vw,1.5rem)] text-gray-300 leading-relaxed animate-fadeIn animation-delay-300 font-sans">
            Generate characters, backgrounds and scenes with just a few clicks.
          </p>
        </div>

        <div className="w-full max-w-2xl mb-6 sm:mb-10 px-4 flex justify-center">
          <CTAButtons />
        </div>

        <div className="flex justify-center space-x-8">
          <a href="https://x.com/try_mangaka_ai" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary-500 transition-colors duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 512 462.799" fill="currentColor" className="w-6 h-6 sm:w-[22px] sm:h-[22px]">
              <path fillRule="nonzero" d="M403.229 0h78.506L310.219 196.04 512 462.799H354.002L230.261 301.007 88.669 462.799h-78.56l183.455-209.683L0 0h161.999l111.856 147.88L403.229 0zm-27.556 415.805h43.505L138.363 44.527h-46.68l283.99 371.278z"/>
            </svg>
          </a>
          <a href="https://discord.gg/9jxTRpmK" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary-500 transition-colors duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 sm:w-[22px] sm:h-[22px]">
              <path d="M18.8943 4.34399C17.5183 3.71467 16.057 3.256 14.5317 3C14.3396 3.33067 14.1263 3.77866 13.977 4.13067C12.3546 3.89599 10.7439 3.89599 9.14391 4.13067C8.99457 3.77866 8.77056 3.33067 8.58922 3C7.05325 3.256 5.59191 3.71467 4.22552 4.34399C1.46286 8.41865 0.716188 12.3973 1.08952 16.3226C2.92418 17.6559 4.69486 18.4666 6.4346 19C6.86126 18.424 7.24527 17.8053 7.57594 17.1546C6.9466 16.92 6.34927 16.632 5.77327 16.2906C5.9226 16.184 6.07194 16.0667 6.21061 15.9493C9.68793 17.5387 13.4543 17.5387 16.889 15.9493C17.0383 16.0667 17.177 16.184 17.3263 16.2906C16.7503 16.632 16.153 16.92 15.5236 17.1546C15.8543 17.8053 16.2383 18.424 16.665 19C18.4036 18.4666 20.185 17.6559 22.01 16.3226C22.4687 11.7787 21.2836 7.83202 18.8943 4.34399ZM8.05593 13.9013C6.5 13.9013 5.5 12.952 5.5 11.7893C5.5 10.6267 6.5 9.67731 8.05593 9.67731C9.6 9.67731 10.6 10.6267 10.6 11.7893C10.6 12.952 9.6 13.9013 8.05593 13.9013ZM15.065 13.9013C13.5 13.9013 12.5 12.952 12.5 11.7893C12.5 10.6267 13.5 9.67731 15.065 9.67731C16.6 9.67731 17.6 10.6267 17.6 11.7893C17.6 12.952 16.6 13.9013 15.065 13.9013Z" fill="currentColor"/>
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
};
