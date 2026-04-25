import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserCircle, Mail, Shield, Briefcase, Waves, User as UserIcon } from 'lucide-react';
import { motion } from 'motion/react';

export const Profile: React.FC = () => {
  const { profile } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row items-center gap-8 bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl relative overflow-hidden">
        <div className="w-32 h-32 rounded-[2.5rem] bg-indigo-50 flex items-center justify-center border-4 border-white shadow-xl overflow-hidden shrink-0">
          <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${profile?.displayName}`} alt="Avatar" className="w-full h-full object-cover" />
        </div>
        
        <div className="text-center md:text-left space-y-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter leading-none">{profile?.displayName}</h2>
            <p className="text-gray-500 font-medium mt-2 flex items-center justify-center md:justify-start gap-2 uppercase tracking-widest text-[10px]">
              <Mail className="w-3 h-3" /> {profile?.email}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
             <span className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 flex items-center gap-2">
               <Shield className="w-3 h-3" /> {profile?.role}
             </span>
             <span className="px-4 py-1.5 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                {profile?.businessLine === 'shadow' ? <Briefcase className="w-3 h-3" /> : profile?.businessLine === 'swimming' ? <Waves className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                {profile?.businessLine || 'Semua Unit'}
             </span>
          </div>
        </div>
      </div>
    </div>
  );
};
