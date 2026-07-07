import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, FileText, Loader2, X } from 'lucide-react';
import Markdown from 'react-markdown';

interface ImageAnalyzerProps {
  triggerAttempt?: (actionName: string, onExecute: () => void) => void;
}

export function ImageAnalyzer({ triggerAttempt }: ImageAnalyzerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selected);
      setResult('');
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    const execute = async () => {
      setIsLoading(true);
      setResult('');

      const formData = new FormData();
      formData.append('image', file);
      formData.append('prompt', 'Analyze this chart or financial document. Extract key indicators, trends, patterns, and provide an assessment.');

      try {
        const response = await fetch('/api/analyze-image', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Analysis failed');
        }

        const data = await response.json();
        setResult(data.reply);
      } catch (error: any) {
        console.error(error);
        setResult('Error analyzing image. Please ensure GEMINI_API_KEY is configured in settings.');
      } finally {
        setIsLoading(false);
      }
    };

    if (triggerAttempt) {
      triggerAttempt('Chart & Document Analysis', execute);
    } else {
      execute();
    }
  };

  const clearSelection = () => {
    setFile(null);
    setPreview(null);
    setResult('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-black/40 border border-white/10 rounded-xl overflow-hidden backdrop-blur-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-aif-neon-cyan/20 flex items-center justify-center text-aif-neon-cyan">
          <FileText size={18} />
        </div>
        <div>
          <h3 className="font-semibold text-white">Chart & Document Analysis</h3>
          <p className="text-xs text-white/50">Upload a chart or document for Gemini 3.1 Pro to analyze</p>
        </div>
      </div>

      {!preview ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-aif-neon-cyan/50 hover:bg-white/5 transition-all"
        >
          <Upload className="w-10 h-10 text-white/40 mx-auto mb-4" />
          <p className="text-sm font-medium text-white mb-1">Click to upload an image</p>
          <p className="text-xs text-white/50">PNG, JPG up to 10MB</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="relative rounded-xl overflow-hidden bg-black/60 border border-white/10 p-2">
            <button 
              onClick={clearSelection}
              className="absolute top-4 right-4 p-1.5 bg-black/80 rounded-full text-white/70 hover:text-white hover:bg-red-500/80 transition-colors"
            >
              <X size={16} />
            </button>
            <img src={preview} alt="Preview" className="max-h-64 w-auto mx-auto rounded-lg" />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isLoading}
            className="w-full py-3 bg-aif-neon-cyan/20 text-aif-neon-cyan hover:bg-aif-neon-cyan/30 border border-aif-neon-cyan/30 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <ImageIcon size={18} />}
            {isLoading ? 'Analyzing...' : 'Analyze Image'}
          </button>

          {result && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h4 className="text-sm font-medium text-aif-neon-cyan mb-4 flex items-center gap-2">
                <FileText size={16} /> Analysis Result
              </h4>
              <div className="text-sm text-white/80 markdown-body">
                <Markdown>{result}</Markdown>
              </div>
            </div>
          )}
        </div>
      )}

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />
    </div>
  );
}
