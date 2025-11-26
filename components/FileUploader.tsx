import React, { useRef } from 'react';

interface FileUploaderProps {
  onImageSelected: (base64: string | null, mimeType: string | null) => void;
  isLoading: boolean;
  preview: string | null;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onImageSelected, isLoading, preview }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("请上传图片文件 (Please upload an image file)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      onImageSelected(result, file.type);
    };
    reader.readAsDataURL(file);
  };

  const triggerSelect = () => {
    if (!isLoading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      <div 
        onClick={!preview ? triggerSelect : undefined}
        className={`w-full rounded-xl flex flex-col items-center justify-center transition-all duration-300 group overflow-hidden relative
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
          ${preview 
            ? 'border border-purple-500/30 bg-slate-900/50 cursor-default' 
            : 'h-[400px] border-2 border-dashed border-slate-600 bg-slate-800/20 hover:border-purple-500 hover:bg-slate-800 cursor-pointer'
          }
        `}
      >
        {preview ? (
          <>
            <div className="w-full relative">
               <img 
                 src={preview} 
                 alt="Preview" 
                 className="w-full h-auto object-contain block" 
               />
               <div className="absolute top-0 left-0 w-full h-full pointer-events-none shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]"></div>
            </div>
            
            <div className="absolute top-2 right-2 flex gap-2">
               <button 
                  onClick={(e) => {
                     e.stopPropagation();
                     triggerSelect();
                  }}
                  className="bg-slate-800/80 hover:bg-slate-700 text-white p-2 rounded-lg backdrop-blur-md shadow-lg transition-all border border-slate-600"
                  title="更换图片"
               >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
               </button>
               <button 
                  onClick={(e) => {
                     e.stopPropagation();
                     onImageSelected(null, null);
                     if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-lg backdrop-blur-md shadow-lg transition-all border border-red-400/50"
                  title="移除图片"
               >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
               </button>
            </div>
          </>
        ) : (
          <div className="text-center p-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto group-hover:bg-purple-500/20 group-hover:scale-110 transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400 group-hover:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-300 font-medium text-lg">点击上传 或 Ctrl+V</p>
              <p className="text-slate-500 text-sm mt-1">支持 JPG, PNG, WEBP</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};