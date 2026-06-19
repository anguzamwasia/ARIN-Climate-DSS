import React, { useState } from 'react';
import { X, Play, FileText, ChevronUp, Lightbulb } from 'lucide-react';

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  mediaUrl: string;
  transcript: string;
  insights: string[];
}

export default function MediaModal({ isOpen, onClose, title, mediaUrl, transcript, insights }: MediaModalProps) {
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  if (!isOpen) return null;

  const isAudio = mediaUrl.toLowerCase().endsWith('.mp3') || mediaUrl.toLowerCase().endsWith('.wav');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-semibold text-slate-800 line-clamp-1">{title}</h2>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Media Player */}
          <div className="bg-black rounded-xl overflow-hidden shadow-inner flex justify-center items-center relative" style={{ minHeight: isAudio ? 'auto' : '400px' }}>
            {isAudio ? (
              <div className="w-full p-8 flex flex-col items-center gap-4 bg-slate-800 text-white">
                <Play className="w-16 h-16 opacity-50" />
                <audio controls src={mediaUrl} className="w-full max-w-md" />
              </div>
            ) : (
              <video controls src={mediaUrl} className="w-full h-auto max-h-[500px]" />
            )}
          </div>

          {/* Major Insights */}
          {insights && insights.length > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-medium text-blue-900">Major Insights & Topics</h3>
              </div>
              <ul className="list-disc list-inside space-y-2 text-blue-800">
                {insights.map((insight, idx) => (
                  <li key={idx} className="text-sm">{insight}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Transcript Accordion */}
          <div className="border rounded-xl overflow-hidden">
            <button 
              onClick={() => setTranscriptOpen(!transcriptOpen)}
              className="w-full flex justify-between items-center px-5 py-4 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-2 text-slate-800 font-medium text-lg">
                <FileText className="w-5 h-5 text-slate-500" />
                Video Transcript
              </div>
              {transcriptOpen ? (
                <ChevronUp className="w-5 h-5 text-slate-500" />
              ) : (
                <PlusIcon />
              )}
            </button>
            
            {transcriptOpen && (
              <div className="p-5 border-t bg-white text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                {transcript || "No transcript available for this media."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// A simple plus icon matching the design requested
function PlusIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}
