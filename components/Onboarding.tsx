import React, { useState } from 'react';
import { OnboardingData } from '../types';
import { Check, ArrowRight, Book, Clock, BrainCircuit, Zap, Hourglass, User as UserIcon, Activity } from 'lucide-react';

interface OnboardingProps {
  onComplete: (data: OnboardingData) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    studentName: '',
    studyArea: '',
    focusTime: '',
    mainDifficulty: ''
  });
  const [isCustomArea, setIsCustomArea] = useState(false);

  const predefinedAreas = ['Computer Science', 'Business', 'Arts & Design', 'Medicine', 'Engineering'];

  const handleNext = () => {
      if (step < 4) setStep(step + 1);
      else onComplete(data);
  };

  const handleAreaSelect = (area: string) => {
      if (area === 'Other') {
          setIsCustomArea(true);
          setData({ ...data, studyArea: '' });
      } else {
          setIsCustomArea(false);
          setData({ ...data, studyArea: area });
      }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-15%] right-[-5%] w-[600px] h-[600px] bg-violet-300/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-15%] left-[-5%] w-[600px] h-[600px] bg-indigo-300/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-2xl w-full bg-white/70 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white p-8 sm:p-12 relative z-10">
        
        {/* PROGRESS STEPPER */}
        <div className="flex items-center justify-center mb-12">
            <div className="flex items-center gap-3 relative">
                {[1, 2, 3, 4].map((s) => (
                    <React.Fragment key={s}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 z-10 relative ${
                            step >= s 
                            ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/30' 
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                            {step > s ? <Check size={14} /> : s}
                            {/* Subtle pulse ring for current step */}
                            {step === s && (
                               <div className="absolute inset-0 rounded-full border border-violet-500/50 animate-ping"></div>
                            )}
                        </div>
                        {s < 4 && (
                            <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden relative">
                                <div className={`absolute top-0 left-0 h-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all duration-700 ease-in-out ${
                                    step > s ? 'w-full' : 'w-0'
                                }`}></div>
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>

        {/* HEADER SECTION */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {step === 1 && (
                <>
                    <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-violet-100 to-fuchsia-50 flex items-center justify-center overflow-hidden mb-6 shadow-inner ring-1 ring-white/50">
                        {/* 3D-like Icon rendering representation */}
                        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center transform rotate-3 shadow-lg group-hover:scale-110 transition-transform">
                            <UserIcon size={20} className="text-white" />
                        </div>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 mb-3 tracking-tight">Welcome! What should we call you?</h2>
                    <p className="text-slate-500 font-medium">Let’s personalize your workspace.</p>
                </>
            )}
            {step === 2 && (
                <>
                    <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-100 to-indigo-50 flex items-center justify-center overflow-hidden mb-6 shadow-inner ring-1 ring-white/50">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center transform rotate-3 shadow-lg">
                            <Book size={20} className="text-white" />
                        </div>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 mb-3 tracking-tight">What is your main field of study?</h2>
                    <p className="text-slate-500 font-medium">We'll customize your dashboard resources.</p>
                </>
            )}
            {step === 3 && (
                <>
                    <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-100 to-orange-50 flex items-center justify-center overflow-hidden mb-6 shadow-inner ring-1 ring-white/50">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-400 rounded-xl flex items-center justify-center transform rotate-3 shadow-lg">
                            <Clock size={20} className="text-white" />
                        </div>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 mb-3 tracking-tight">When is your peak focus time?</h2>
                    <p className="text-slate-500 font-medium">We'll map optimal deep-work sessions.</p>
                </>
            )}
            {step === 4 && (
                <>
                    <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-100 to-teal-50 flex items-center justify-center overflow-hidden mb-6 shadow-inner ring-1 ring-white/50">
                         <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center transform rotate-3 shadow-lg">
                             <BrainCircuit size={20} className="text-white" />
                         </div>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 mb-3 tracking-tight">What is your biggest study challenge?</h2>
                    <p className="text-slate-500 font-medium">This helps the AI personalize its strategy.</p>
                </>
            )}
        </div>

        {/* FORM CONTENT */}
        <div className="max-w-md mx-auto min-h-[220px] flex flex-col justify-center animate-in fade-in duration-500">
             {step === 1 && (
                 <div className="relative group">
                    <input 
                        type="text" 
                        className="w-full bg-white/50 border-2 border-slate-200 rounded-2xl px-6 py-5 text-xl font-bold text-center text-slate-800 placeholder-slate-300 outline-none focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10 transition-all shadow-sm"
                        placeholder="e.g. Uma"
                        value={data.studentName}
                        onChange={(e) => setData({...data, studentName: e.target.value})}
                        onKeyDown={(e) => {
                            if(e.key === 'Enter' && data.studentName) handleNext();
                        }}
                        autoFocus
                    />
                 </div>
            )}

            {step === 2 && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        {predefinedAreas.map(option => (
                            <button
                                key={option}
                                onClick={() => handleAreaSelect(option)}
                                className={`px-4 py-5 rounded-2xl border-2 text-center transition-all duration-200 font-bold text-[15px] ${
                                    !isCustomArea && data.studyArea === option 
                                    ? 'border-violet-500 bg-violet-50 text-violet-700 shadow-lg shadow-violet-500/20 transform scale-[1.02]' 
                                    : 'border-slate-100 text-slate-500 hover:border-slate-300 hover:bg-slate-50/50 bg-white'
                                }`}
                            >
                                {option}
                            </button>
                        ))}
                        <button
                            onClick={() => handleAreaSelect('Other')}
                            className={`px-4 py-5 rounded-2xl border-2 text-center transition-all duration-200 font-bold text-[15px] ${
                                isCustomArea 
                                ? 'border-violet-500 bg-violet-50 text-violet-700 shadow-lg shadow-violet-500/20 transform scale-[1.02]' 
                                : 'border-slate-100 text-slate-500 hover:border-slate-300 hover:bg-slate-50/50 bg-white'
                            }`}
                        >
                            Other
                        </button>
                    </div>
                    
                    {/* Custom Input for 'Other' */}
                    {isCustomArea && (
                        <div className="animate-in fade-in slide-in-from-top-2 mt-4">
                             <input 
                                type="text" 
                                className="w-full bg-white border-2 border-violet-200 rounded-2xl px-6 py-4 text-base font-bold text-slate-800 placeholder-slate-300 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all shadow-sm"
                                placeholder="Type your specific study area..."
                                value={data.studyArea}
                                onChange={(e) => setData({...data, studyArea: e.target.value})}
                                autoFocus
                            />
                        </div>
                    )}
                </div>
            )}

            {step === 3 && (
                <div className="space-y-3">
                    {['Morning (6am - 12pm)', 'Afternoon (12pm - 5pm)', 'Evening (5pm - 10pm)', 'Night Owl (10pm - 4am)'].map((option, idx) => {
                        const icons = [Activity, Hourglass, Book, Zap];
                        const Icon = icons[idx];

                        return (
                            <button
                                key={option}
                                onClick={() => setData({...data, focusTime: option})}
                                className={`w-full px-5 py-4 rounded-2xl border-2 text-left transition-all duration-200 font-bold text-base flex justify-between items-center ${
                                    data.focusTime === option 
                                    ? 'border-violet-500 bg-violet-50 text-violet-700 shadow-lg shadow-violet-500/10 transform scale-[1.02] z-10 relative' 
                                    : 'border-slate-100 bg-white text-slate-600 hover:border-slate-300'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon size={18} className={data.focusTime === option ? 'text-violet-600' : 'text-slate-400'} />
                                    {option}
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${data.focusTime === option ? 'border-violet-500 bg-violet-500' : 'border-slate-300'}`}>
                                    {data.focusTime === option && <Check size={12} className="text-white"/>}
                                </div>
                            </button>
                        )
                    })}
                </div>
            )}

            {step === 4 && (
                <div className="grid grid-cols-1 gap-3">
                     {[
                         { label: 'Focus & Distractions', icon: Zap, desc: 'I get distracted easily by my phone.' },
                         { label: 'Time Management', icon: Hourglass, desc: 'I struggle with meeting deadlines.' },
                         { label: 'Understanding Topics', icon: BrainCircuit, desc: 'I find coursework difficult to grasp.' }
                     ].map((item) => (
                         <button
                            key={item.label}
                            onClick={() => setData({...data, mainDifficulty: item.label})}
                            className={`w-full p-4 rounded-2xl border-2 text-left transition-all duration-200 flex items-center gap-4 ${
                                data.mainDifficulty === item.label 
                                ? 'border-violet-500 bg-violet-50 shadow-md shadow-violet-500/10 transform scale-[1.02] z-10 relative' 
                                : 'border-slate-100 bg-white hover:border-slate-300'
                            }`}
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${data.mainDifficulty === item.label ? 'bg-violet-200 text-violet-700' : 'bg-slate-100 text-slate-500'}`}>
                                <item.icon size={22} />
                            </div>
                            <div className="flex-1">
                                <h4 className={`font-bold text-base mb-0.5 ${data.mainDifficulty === item.label ? 'text-violet-800' : 'text-slate-800'}`}>{item.label}</h4>
                                <p className={`text-[13px] font-medium ${data.mainDifficulty === item.label ? 'text-violet-600/80' : 'text-slate-500'}`}>{item.desc}</p>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ml-2 ${data.mainDifficulty === item.label ? 'border-violet-500 bg-violet-500' : 'border-slate-300'}`}>
                                {data.mainDifficulty === item.label && <Check size={12} className="text-white"/>}
                            </div>
                        </button>
                     ))}
                </div>
            )}
        </div>

        {/* BOTTOM NAVIGATION */}
        <div className="max-w-md mx-auto pt-10">
            <button 
                onClick={handleNext}
                disabled={
                    (step === 1 && !data.studentName) ||
                    (step === 2 && !data.studyArea) ||
                    (step === 3 && !data.focusTime) ||
                    (step === 4 && !data.mainDifficulty)
                }
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-4 rounded-2xl font-bold text-[15px] hover:shadow-violet-500/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 active:scale-[0.98] shadow-xl shadow-violet-500/20 flex items-center justify-center gap-2 group"
            >
                {step === 4 ? "Complete Setup" : "Next Step"} 
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            {step < 4 && (
                <div className="mt-4 text-center">
                    <button onClick={() => {
                         // Fallback logic for skip - per user request, keep logic exact, but skip button was in the image.
                         if (step === 1) setData({...data, studentName: 'Student'});
                         if (step === 2) setData({...data, studyArea: 'General'});
                         if (step === 3) setData({...data, focusTime: 'Morning'});
                         handleNext();
                    }} className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider transition-colors inline-block py-2">
                         Skip this step
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
