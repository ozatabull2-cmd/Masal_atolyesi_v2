import React from 'react';
import { SavedStory } from '../hooks/useStoryLibrary';
import { BookOpen, Trash2, ArrowLeft, Clock } from 'lucide-react';
import { StoryData } from '../types';

interface LibraryViewProps {
  stories: SavedStory[];
  onOpenStory: (story: StoryData) => void;
  onDeleteStory: (id: string) => void;
  onBack: () => void;
}

const LibraryView: React.FC<LibraryViewProps> = ({ stories, onOpenStory, onDeleteStory, onBack }) => {
  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-6 md:p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
        <h2 className="text-2xl font-bold text-indigo-900 flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-indigo-500" />
          Kayıtlı Masallarım
        </h2>
        <button 
          onClick={onBack}
          className="text-slate-500 hover:text-indigo-600 font-bold flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full transition"
        >
          <ArrowLeft className="w-4 h-4" /> Geri Dön
        </button>
      </div>

      {stories.length === 0 ? (
        <div className="text-center py-12 px-4">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-10 h-10 text-indigo-200" />
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">Henüz Masal Kaydedilmemiş</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            Oluşturduğunuz tüm masallar otomatik olarak bu cihaza kaydedilir ve internet olmadan bile tekrar okuyabilirsiniz.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stories.map(saved => (
            <div key={saved.id} className="border border-slate-100 bg-slate-50 rounded-2xl p-4 flex gap-4 hover:shadow-md transition group">
              {saved.story.coverImageUrl ? (
                <div className="w-24 h-32 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
                  <img src={saved.story.coverImageUrl} className="w-full h-full object-cover" alt="Cover" />
                </div>
              ) : (
                <div className="w-24 h-32 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-300">
                  <BookOpen className="w-8 h-8" />
                </div>
              )}
              
              <div className="flex flex-col flex-1 justify-between">
                <div>
                  <h4 className="font-bold text-indigo-900 leading-tight mb-1 line-clamp-2">
                    {saved.story.title}
                  </h4>
                  <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400 mb-2 uppercase tracking-wide">
                    <Clock className="w-3 h-3" />
                    {new Date(saved.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {saved.story.summary}
                  </p>
                </div>
                
                <div className="flex items-center justify-between mt-3">
                  <button 
                    onClick={() => onOpenStory(saved.story)}
                    className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 transition"
                  >
                    Masalı Aç
                  </button>
                  <button 
                    onClick={() => {
                        if (window.confirm("Bu masalı silmek istediğinize emin misiniz?")) {
                            onDeleteStory(saved.id);
                        }
                    }}
                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LibraryView;
