'use client';

import React from 'react';
import { ArrowRight, Server, Cpu, Activity, Disc, Zap } from 'lucide-react';

export function HeroSignalPath() {
  const nodes = [
    { label: 'WORKSTATION', sub: 'Layer 3 / HMI', icon: Server },
    { label: 'PLC-01', sub: 'Layer 2 / Control', icon: Cpu },
    { label: 'MODBUS/TCP', sub: 'Field Protocol · Port 502', icon: Activity },
    { label: 'MOTOR DRIVE', sub: 'Layer 1 / Actuator', icon: Zap },
    { label: 'CONVEYOR', sub: 'Physical Process', icon: Disc },
    { label: 'TELEMETRY', sub: 'Sensor Feedback', icon: Activity },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto pt-8 pb-4">
      {/* Schematic Container - Light, Translucent, Borderless from heavy cards */}
      <div className="relative py-4 px-2 sm:px-6">
        {/* Subtle Horizontal Guide Rail */}
        <div className="hidden lg:block absolute top-[34px] left-[6%] right-[6%] h-[1px] bg-slate-300/70 z-0">
          {/* Subtle slow pulse along the rail */}
          <div 
            className="h-full w-24 bg-gradient-to-r from-transparent via-[#1769FF]/50 to-transparent animate-[pulse_3s_ease-in-out_infinite]"
          />
        </div>

        {/* Nodes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 relative z-10">
          {nodes.map((node, index) => {
            const Icon = node.icon;
            return (
              <div
                key={node.label}
                className="flex flex-col items-center text-center p-2.5 rounded-lg bg-white/70 backdrop-blur-xs border border-slate-200/80 shadow-xs hover:border-[#1769FF]/40 transition-colors"
              >
                {/* Node icon with subtle dot */}
                <div className="w-7 h-7 rounded-md bg-blue-50/80 border border-blue-100 flex items-center justify-center text-[#1769FF] mb-1.5 shadow-2xs">
                  <Icon className="w-3.5 h-3.5" />
                </div>

                <div className="text-[11px] font-mono font-bold text-slate-800 tracking-tight">
                  {node.label}
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-0.5 truncate max-w-full">
                  {node.sub}
                </div>
              </div>
            );
          })}
        </div>

        {/* Subtle Architectural Flow Indicator */}
        <div className="mt-3 flex items-center justify-center gap-2 text-[10px] font-mono text-slate-600 uppercase tracking-widest">
          <span>PROTOCOL-REAL SIGNAL CHAIN</span>
          <span>·</span>
          <span>HARDWARE-INDEPENDENT VIRTUAL ARCHITECTURE</span>
        </div>
      </div>
    </div>
  );
}
