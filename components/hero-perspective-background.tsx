'use client';

import React from 'react';

export function HeroPerspectiveBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* Soft Blue Atmospheric Radial Glows */}
      <div 
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] rounded-full opacity-40 blur-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(23, 105, 255, 0.18) 0%, rgba(220, 235, 255, 0.12) 45%, transparent 75%)',
        }}
      />
      <div 
        className="absolute top-1/3 left-1/4 w-[500px] h-[350px] rounded-full opacity-25 blur-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(24, 135, 91, 0.08) 0%, transparent 70%)',
        }}
      />

      {/* Subtle Top Technical Grid */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #0B1220 1px, transparent 1px),
            linear-gradient(to bottom, #0B1220 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Large Perspective Engineering Floor Grid */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[380px] sm:h-[440px] origin-bottom overflow-hidden"
        style={{
          perspective: '650px',
        }}
      >
        <div 
          className="absolute inset-0 w-full h-[600px] -bottom-[120px]"
          style={{
            transform: 'rotateX(62deg)',
            transformOrigin: '50% 100%',
            backgroundImage: `
              linear-gradient(to right, rgba(23, 105, 255, 0.16) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(23, 105, 255, 0.16) 1px, transparent 1px)
            `,
            backgroundSize: '54px 54px',
            maskImage: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 45%, transparent 95%)',
            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 45%, transparent 95%)',
          }}
        />

        {/* Central Converging Perspective Guide Line */}
        <div 
          className="absolute inset-x-0 bottom-0 h-[300px] flex justify-center opacity-30"
          style={{
            maskImage: 'linear-gradient(to top, black 0%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to top, black 0%, transparent 100%)',
          }}
        >
          <div className="w-[1px] h-full bg-[#1769FF]" />
        </div>
      </div>

      {/* Subtle Horizon Fog Gradient to softly blend perspective grid into page background */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[160px] pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, rgba(245, 248, 252, 0.85) 60%, #F5F8FC 100%)',
        }}
      />
    </div>
  );
}
