
import React, { useState } from 'react';
import { OnboardingData } from '../types';
import { Check, ArrowRight, Book, Clock, BrainCircuit, Activity, Zap, Hourglass, User } from 'lucide-react';

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
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-violet-400/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[20%] w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-3xl w-full bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-violet-900/10 p-8 md:p-14 relative overflow-hidden border border-white/60 z-10">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-2 bg-slate-100/50">
            <div className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all duration-500 ease-out" style={{ width: `${(step/4)*100}%` }}></div>
        </div>

        <div className="mb-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-50 text-violet-600 mb-6 shadow-sm ring-4 ring-violet-50/50">
                {step === 1 && <User size={32} />}
                {step === 2 && <Book size={32} />}
                {step === 3 && <Clock size={32} />}
                {step === 4 && <BrainCircuit size={32} />}
            </div>
            <h2 className="text-3xl font-display font-extrabold text-slate-900 mb-3 tracking-tight">
                {step === 1 && "Welcome! What should we call you?"}
                {step === 2 && "What is your main field of study?"}
                {step === 3 && "When is your peak focus time?"}
                {step === 4 && "What is your biggest study challenge?"}
            </h2>
            <p className="text-slate-500 font-medium text-lg max-w-lg mx-auto leading-relaxed">
                {step === 1 && "Let's personalize your workspace."}
                {step === 2 && "We'll customize your dashboard resources based on your major."}
                {step === 3 && "We'll suggest optimal study blocks around your natural rhythm."}
                {step === 4 && "This helps the AI assistant personalize its advice for you."}
            </p>
        </div>

        <div className="max-w-xl mx-auto space-y-8">
             {step === 1 && (
                 <div className="relative group">
                    <input 
                        type="text" 
                        className="w-full bg-slate-50/50 border-2 border-slate-200 rounded-2xl px-6 py-4 text-xl outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all font-bold placeholder-slate-400 text-center"
                        placeholder="Your Name"
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
                    <div className="grid grid-cols-2 gap-4">
                        {predefinedAreas.map(option => (
                            <button
                                key={option}
                                onClick={() => handleAreaSelect(option)}
                                className={`p-6 rounded-2xl border-2 text-left transition-all duration-200 font-bold text-lg ${
                                    !isCustomArea && data.studyArea === option 
                                    ? 'border-violet-500 bg-violet-50 text-violet-700 shadow-lg shadow-violet-500/10' 
                                    : 'border-slate-100 text-slate-600 hover:border-violet-200 hover:bg-slate-50'
                                }`}
                            >
                                {option}
                            </button>
                        ))}
                        <button
                            onClick={() => handleAreaSelect('Other')}
                            className={`p-6 rounded-2xl border-2 text-left transition-all duration-200 font-bold text-lg ${
                                isCustomArea 
                                ? 'border-violet-500 bg-violet-50 text-violet-700 shadow-lg shadow-violet-500/10' 
                                : 'border-slate-100 text-slate-600 hover:border-violet-200 hover:bg-slate-50'
                            }`}
                        >
                            Other
                        </button>
                    </div>
                    
                    {/* Custom Input for 'Other' */}
                    {isCustomArea && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                             <input 
                                type="text" 
                                className="w-full bg-white border-2 border-violet-200 rounded-2xl px-6 py-4 text-lg outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all font-bold placeholder-slate-400"
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
                <div className="space-y-4">
                    {['Morning (6am - 12pm)', 'Afternoon (12pm - 5pm)', 'Evening (5pm - 10pm)', 'Night Owl (10pm - 4am)'].map(option => (
                        <button
                            key={option}
                            onClick={() => setData({...data, focusTime: option})}
                            className={`w-full p-6 rounded-2xl border-2 text-left transition-all duration-200 font-bold text-lg flex justify-between items-center ${
                                data.focusTime === option 
                                ? 'border-violet-500 bg-violet-50 text-violet-700 shadow-lg shadow-violet-500/10' 
                                : 'border-slate-100 text-slate-600 hover:border-violet-200 hover:bg-slate-50'
                            }`}
                        >
                            {option}
                            {data.focusTime === option && <Check size={24} className="text-violet-600"/>}
                        </button>
                    ))}
                </div>
            )}

            {step === 4 && (
                <div className="grid grid-cols-1 gap-4">
                     {[
                         { label: 'Focus & Distractions', icon: Zap, desc: 'I get distracted easily by phone or social media.' },
                         { label: 'Time Management', icon: Hourglass, desc: 'I struggle with planning and meeting deadlines.' },
                         { label: 'Understanding Topics', icon: Activity, desc: 'I find the coursework difficult to grasp.' }
                     ].map((item) => (
                         <button
                            key={item.label}
                            onClick={() => setData({...data, mainDifficulty: item.label})}
                            className={`w-full p-6 rounded-2xl border-2 text-left transition-all duration-200 flex items-center gap-5 ${
                                data.mainDifficulty === item.label 
                                ? 'border-violet-500 bg-violet-50 shadow-lg shadow-violet-500/10' 
                                : 'border-slate-100 hover:border-violet-200 hover:bg-slate-50'
                            }`}
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${data.mainDifficulty === item.label ? 'bg-violet-200 text-violet-700' : 'bg-slate-100 text-slate-400'}`}>
                                <item.icon size={24} />
                            </div>
                            <div>
                                <h4 className={`font-bold text-lg mb-1 ${data.mainDifficulty === item.label ? 'text-violet-700' : 'text-slate-700'}`}>{item.label}</h4>
                                <p className="text-sm text-slate-500 font-medium">{item.desc}</p>
                            </div>
                            {data.mainDifficulty === item.label && <Check size={24} className="text-violet-600 ml-auto"/>}
                        </button>
                     ))}
                </div>
            )}

            <div className="pt-4">
                <button 
                    onClick={handleNext}
                    disabled={
                        (step === 1 && !data.studentName) ||
                        (step === 2 && !data.studyArea) ||
                        (step === 3 && !data.focusTime) ||
                        (step === 4 && !data.mainDifficulty)
                    }
                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:shadow-violet-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] shadow-xl shadow-violet-500/30 flex items-center justify-center gap-2 group"
                >
                    {step === 4 ? "Complete Setup" : "Next Step"} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
