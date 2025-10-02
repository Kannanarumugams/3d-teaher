
import React from 'react';
import type { PoseName } from '../types';

interface PoseControlsProps {
  activePose: PoseName;
  onPoseChange: (poseName: PoseName) => void;
  onEndSession: () => void;
}

const presetButtons: { name: PoseName, label: string, icon: string }[] = [
    { name: 'IDLE', label: 'Idle', icon: 'M12 1v22' },
    { name: 'HI', label: 'Wave Right', icon: 'M6.1 19.4L6.1 7.4 12.1 1.4 18.1 7.4 18.1 19.4' },
    { name: 'WAVE_LEFT', label: 'Wave Left', icon: 'M6.1 19.4L6.1 7.4 12.1 1.4 18.1 7.4 18.1 19.4' },
    { name: 'HEART', label: 'Heart', icon: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' },
    { name: 'FOLD', label: 'Fold Arms', icon: 'M17 3l4 4L7 21l-4-4L17 3zM7 13l-4 4' },
    { name: 'THUMBS_UP', label: 'Thumbs Up', icon: 'M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z' },
    { name: 'POINTING', label: 'Point Right', icon: 'M5 12h14m-7-7l7 7-7 7' }
];

const PoseButton: React.FC<{
    name: PoseName;
    label: string;
    icon: string;
    isActive: boolean;
    onClick: (name: PoseName) => void;
}> = ({ name, label, icon, isActive, onClick }) => (
    <button
        onClick={() => onClick(name)}
        className={`
            px-5 py-3 rounded-lg text-left text-base font-medium transition-all duration-300 ease-in-out
            flex items-center space-x-4 transform hover:-translate-y-1
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-500
            ${isActive 
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30 scale-105' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white hover:shadow-md'
            }
        `}
    >
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5"
        >
        <path d={icon}></path>
        </svg>
        <span>{label}</span>
    </button>
);


const PoseControls: React.FC<PoseControlsProps> = ({ activePose, onPoseChange, onEndSession }) => {
  return (
    <div className="flex flex-col space-y-6">
        <div>
            <h2 className="text-xl font-semibold text-slate-300 mb-3">Choose a Pose</h2>
            <div className="grid grid-cols-1 gap-3">
                {presetButtons.map((btn) => (
                    <PoseButton 
                        key={btn.name}
                        {...btn}
                        isActive={activePose === btn.name}
                        onClick={onPoseChange}
                    />
                ))}
            </div>
        </div>
        <div className="pt-4 border-t border-slate-700/50">
             <button
                onClick={onEndSession}
                className={`
                    w-full px-6 py-4 rounded-lg text-lg font-medium transition-all duration-300 ease-in-out
                    flex items-center justify-center space-x-4 transform hover:-translate-y-1
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-rose-500
                    bg-rose-600/80 text-white hover:bg-rose-600 hover:shadow-lg hover:shadow-rose-500/20
                `}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>End Session</span>
            </button>
        </div>
    </div>
  );
};

export default PoseControls;