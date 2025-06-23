'use client'

import React, { useState, useEffect } from 'react';
import { MessageCircle, Twitter } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import ClientOnly from '@/components/common/ClientOnly';
import CheckoutButton from '@/components/stripe/CheckoutButton';

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
        <span className="text-primary-500 font-semibold">1.2K</span> créateurs actifs
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
            Voir mes projets
          </Link>
          <Link
            href="#features"
            className="w-full sm:w-auto px-10 py-5 sm:px-8 sm:py-4 rounded-full bg-dark-800/80 border-2 border-primary-500 hover:bg-primary-500/10 text-white transition-all duration-300 text-lg sm:text-base font-comic text-center hover:border-primary-400"
          >
            Voir la démo
          </Link>
        </div>
      ) : (
        // User non connecté - Commencer et Voir la démo
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full">
          <CheckoutButton
            planId="senior"
            planName="Mangaka Senior"
            price={25}
            variant="highlight"
            className="w-full sm:w-auto px-10 py-5 sm:px-8 sm:py-4 rounded-full text-lg sm:text-base"
          >
            Commencer
          </CheckoutButton>
          <Link
            href="#features"
            className="w-full sm:w-auto px-10 py-5 sm:px-8 sm:py-4 rounded-full bg-dark-800/80 border-2 border-primary-500 hover:bg-primary-500/10 text-white transition-all duration-300 text-lg sm:text-base font-comic text-center hover:border-primary-400"
          >
            Voir la démo
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
            Créez des manga épiques,
          </span>
          <span className="block font-comic italic text-[clamp(2.5rem,8vw,3.75rem)] sm:text-[clamp(1.5rem,6vw,3.75rem)] text-primary-500">
            Sans savoir dessiner.
          </span>
        </h1>

        <div className="mb-6 sm:mb-12 px-4 text-center">
          <p className="text-[clamp(1.2rem,4vw,1.5rem)] sm:text-[clamp(1rem,3vw,1.5rem)] text-gray-300 leading-relaxed animate-fadeIn animation-delay-200 font-sans mb-2">
            L'IA qui transforme vos idées en histoires manga professionnelles.
          </p>
          <p className="text-[clamp(1.2rem,4vw,1.5rem)] sm:text-[clamp(1rem,3vw,1.5rem)] text-gray-300 leading-relaxed animate-fadeIn animation-delay-300 font-sans">
            Générez personnages, décors et scènes en quelques clics.
          </p>
        </div>

        <div className="w-full max-w-2xl mb-6 sm:mb-10 px-4 flex justify-center">
          <CTAButtons />
        </div>

        <div className="flex justify-center space-x-8">
          <a href="#" className="text-gray-500 hover:text-primary-500 transition-colors duration-300">
            <Twitter size={24} className="w-6 h-6 sm:w-[22px] sm:h-[22px]" />
          </a>
          <a href="#" className="text-gray-500 hover:text-primary-500 transition-colors duration-300">
            <MessageCircle size={24} className="w-6 h-6 sm:w-[22px] sm:h-[22px]" />
          </a>
        </div>
      </div>
    </section>
  );
};
