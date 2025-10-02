
import React from 'react';

interface QuizModalProps {
  isOpen: boolean;
  question: string;
  options: string[];
  onAnswer: (answer: string) => void;
}

const QuizModal: React.FC<QuizModalProps> = ({ isOpen, question, options, onAnswer }) => {
  return (
    <div className={`fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className={`bg-slate-800 rounded-2xl shadow-2xl shadow-cyan-500/10 border border-slate-700 p-8 max-w-lg w-full m-4 transform transition-all duration-300 ease-in-out ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        <h2 className="text-2xl font-bold mb-4 text-cyan-400">Quiz Time!</h2>
        <p className="text-lg text-slate-200 mb-6">{question}</p>
        <div className="flex flex-col space-y-3">
          {(options || []).map((option, index) => (
            <button
              key={index}
              onClick={() => onAnswer(option)}
              className="w-full text-left p-4 rounded-lg bg-slate-700 hover:bg-cyan-600 text-slate-200 hover:text-white transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-500"
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuizModal;
