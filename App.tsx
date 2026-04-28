
import React, { useState, useEffect } from 'react';
import { AppState, StoryData, UserInput } from './types';
import BookForm from './components/BookForm';
import StoryViewer from './components/StoryViewer';
import LoadingScreen from './components/LoadingScreen';
import { generateIllustration, generateStoryText, generateSpeech } from './services/geminiService';
import { Hourglass } from 'lucide-react';
import { getUserQuota, updateUserQuota, db } from './firebase';

const QUOTA_LIMIT = 1;
const RESET_PERIOD_MS = 12 * 60 * 60 * 1000; // 12 hours in ms

// Promo Codes configuration: code -> credits
const PROMO_DATA: Record<string, number> = {
  "ANKARA": 1,
  "K7L2M9": 1,
  "X4P8R3": 1,
  "T9Y5W1": 1,
  "B2H6S8": 1,
  "V3N7C4": 1,
  "J8D5F2": 1,
  "M6G9Z1": 1,
  "R4K3L7": 1,
  "S5T8P2": 1,
  "Y1W9Q6": 1,
  // 10 Rights Codes
  "ANKARA10": 10,
  "MASAL10": 10,
  "SIHIR10": 10,
  "OZEL10": 10,
  "HEDIYE10": 10
};

const PROMO_CODES = Object.keys(PROMO_DATA);

// Internal Cooldown Component
const CooldownView: React.FC<{ target: number; onComplete: () => void }> = ({ target, onComplete }) => {
    const [secondsLeft, setSecondsLeft] = useState(Math.ceil((target - Date.now()) / 1000));

    useEffect(() => {
        const timer = setInterval(() => {
            const left = Math.ceil((target - Date.now()) / 1000);
            if (left <= 0) {
                clearInterval(timer);
                onComplete();
            } else {
                setSecondsLeft(left);
            }
        }, 250);
        return () => clearInterval(timer);
    }, [target, onComplete]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-3xl shadow-xl p-8 text-center max-w-md mx-auto animate-fade-in">
            <div className="bg-indigo-100 p-6 rounded-full mb-6 animate-pulse">
                <Hourglass className="w-12 h-12 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Biraz Dinlenelim!</h2>
            <p className="text-slate-500 mb-8">
                Sihirli değneğimizin soğuması gerekiyor. Yeni bir masal oluşturmadan önce lütfen bekle.
            </p>
            <div className="text-6xl font-bold text-indigo-500 font-mono mb-4">
                {secondsLeft}
            </div>
            <p className="text-sm text-indigo-300 font-bold uppercase tracking-wider">Saniye Kaldı</p>
        </div>
    );
};

function App() {
  const [appState, setAppState] = useState<AppState>(AppState.Input);
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Quota State
  const [remainingQuota, setRemainingQuota] = useState<number>(QUOTA_LIMIT);
  const [nextResetTime, setNextResetTime] = useState<number | null>(null);

  // Cooldown State
  const [cooldownTarget, setCooldownTarget] = useState<number | null>(null);

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const email = params.get('email') || params.get('mail');
    const name = params.get('name');
    const role = params.get('role');

    if (email || name) {
      setUserEmail(email || "kullanici@mail.com");
      setUserName(name || "Kullanıcı");
      setUserRole(role || "user");
      checkQuota(email || "kullanici@mail.com");
    } else {
      setUserEmail("test@mail.com");
      setUserName("Test Kullanıcısı");
      setUserRole(role || "user");
      checkQuota("test@mail.com");
    }
  }, []);

  const checkQuota = async (mailKey: string | null = userEmail) => {
    let storedData = null;
    try {
        if (mailKey && db) {
            storedData = await getUserQuota(mailKey);
        } else {
            const s = localStorage.getItem('masal_quota');
            if (s) storedData = JSON.parse(s);
        }
    } catch(e) { console.error('Quota fetch error:', e); }

    if (storedData) {
        const { count, resetTime } = storedData;
        const now = Date.now();

        if (resetTime && now > resetTime) {
            resetQuotaState(mailKey);
        } else {
            setRemainingQuota(QUOTA_LIMIT - (count || 0));
            setNextResetTime(resetTime);
        }
    } else {
        setRemainingQuota(QUOTA_LIMIT);
        setNextResetTime(null);
    }
  };

  const setStorageData = (data: any, mailKey: string | null = userEmail) => {
      if (mailKey && db) {
          updateUserQuota(mailKey, data).catch(console.error);
      } else {
          localStorage.setItem('masal_quota', JSON.stringify(data));
      }
  };

  const resetQuotaState = (mailKey: string | null = userEmail) => {
      const data = { count: 0, resetTime: null };
      setStorageData(data, mailKey);
      setRemainingQuota(QUOTA_LIMIT);
      setNextResetTime(null);
  };

  const decrementQuota = () => {
      const currentCount = QUOTA_LIMIT - remainingQuota;
      const newCount = currentCount + 1;
      let resetTime = nextResetTime;
      
      if (!resetTime && newCount > 0) {
          resetTime = Date.now() + RESET_PERIOD_MS;
      }

      const newData = { count: newCount, resetTime };
      setStorageData(newData);
      
      setRemainingQuota(QUOTA_LIMIT - newCount);
      setNextResetTime(resetTime);
  };

  const handleApplyPromo = (code: string): { success: boolean, message: string } => {
    // Normalize input
    const normalizedCode = code.trim().toUpperCase();

    // Check if code is in the allowed list
    if (!PROMO_CODES.includes(normalizedCode)) {
        return { success: false, message: "Geçersiz promosyon kodu." };
    }

    /* Single use check removed as per user request to allow entry whenever quota is full */

    // Apply Promo
    const currentCount = QUOTA_LIMIT - remainingQuota;

    // Get credits for this code
    const credits = PROMO_DATA[normalizedCode] || 1;

    // Reduce count (Adding credits)
    const newCount = currentCount - credits;
    const newData = { count: newCount, resetTime: nextResetTime };
    
    setStorageData(newData);
    
    setRemainingQuota(QUOTA_LIMIT - newCount);
    
    return { success: true, message: `Tebrikler! +${credits} Masal hakkı eklendi.` };
  };

  const handleFormSubmit = async (input: UserInput) => {
    if (remainingQuota <= 0 && userRole !== 'admin') {
        setErrorMsg("Hakkınız dolmuştur. Lütfen sürenin dolmasını bekleyin veya promosyon kodu kullanın.");
        return;
    }

    setErrorMsg(null);
    setAppState(AppState.GeneratingStory);

    try {
      // 1. Generate Text Structure
      const generatedStory = await generateStoryText(input);
      
      // Decrement quota
      if (userRole !== 'admin') {
        decrementQuota();
      }

      // Set Cooldown Target (60 seconds from now)
      if (userRole !== 'admin') {
        setCooldownTarget(Date.now() + 60000);
      }

      // 2. Start Image and Audio Generation Phase
      setAppState(AppState.GeneratingImages);
      setLoadingProgress(0);

      const totalTasks = generatedStory.pages.length * 2 + 1; // Pages * (Image + Audio) + Cover Image
      let completedTasks = 0;

      const updateProgress = () => {
        completedTasks++;
        setLoadingProgress((completedTasks / totalTasks) * 100);
      };

      // Generate Cover Image
      const coverPromise = generateIllustration(`${generatedStory.coverImagePrompt} . Cinematic lighting, highly detailed cover art, title space at top.`)
        .then(url => {
            updateProgress();
            return url;
        });

      // Generate Page Images and Audio
      const pagesPromise = Promise.all(
        generatedStory.pages.map(async (page) => {
            let imageUrl = page.imageUrl;
            let audioBase64 = page.audioBase64;

            // Image Task
            const imageTask = async () => {
                try {
                    const fullPrompt = `${page.imagePrompt} . High quality, children's book illustration, warm lighting, 4k, detailed.`;
                    imageUrl = await generateIllustration(fullPrompt);
                } catch (e) {
                    console.error(`Failed to generate image for page ${page.pageNumber}`, e);
                } finally {
                    updateProgress();
                }
            };

            // Audio Task
            const audioTask = async () => {
                try {
                   audioBase64 = await generateSpeech(page.text);
                } catch (e) {
                   console.error(`Failed to generate audio for page ${page.pageNumber}`, e);
                } finally {
                   updateProgress();
                }
            };

            await Promise.all([imageTask(), audioTask()]);

            return { ...page, imageUrl, audioBase64 };
        })
      );

      const [coverUrl, pagesWithAssets] = await Promise.all([coverPromise, pagesPromise]);

      setStoryData({ 
        ...generatedStory, 
        coverImageUrl: coverUrl, 
        pages: pagesWithAssets 
      });
      
      setAppState(AppState.Reading);

    } catch (err: any) {
      console.error(err);
      setErrorMsg("Üzgünüz, masalı oluştururken sihirli bir hata oluştu. Lütfen tekrar deneyin.");
      setAppState(AppState.Error);
    }
  };

  const resetApp = () => {
    // Check for cooldown
    if (cooldownTarget && Date.now() < cooldownTarget && userRole !== 'admin') {
        setAppState(AppState.Cooldown);
        return;
    }

    setStoryData(null);
    setAppState(AppState.Input);
    setLoadingProgress(0);
    setErrorMsg(null);
    checkQuota(); // Re-check quota when returning to home
  };

  // Helper to render content based on state
  const renderContent = () => {
    switch (appState) {
      case AppState.Input:
        return (
            <BookForm 
                onSubmit={handleFormSubmit} 
                isSubmitting={false} 
                remainingQuota={remainingQuota}
                nextResetTime={nextResetTime}
                onApplyPromo={handleApplyPromo}
                isAdmin={userRole === 'admin'}
                userName={userName}
            />
        );
      
      case AppState.GeneratingStory:
        return <LoadingScreen status="story" />;

      case AppState.GeneratingImages:
        return <LoadingScreen status="images" progress={loadingProgress} />;

      case AppState.Reading:
        return storyData ? <StoryViewer story={storyData} onReset={resetApp} userEmail={userEmail} /> : null;
      
      case AppState.Cooldown:
        return cooldownTarget ? <CooldownView target={cooldownTarget} onComplete={() => setAppState(AppState.Input)} /> : null;

      case AppState.Error:
        return (
          <div className="text-center p-8 bg-white rounded-3xl shadow-xl max-w-lg">
            <div className="text-5xl mb-4">😿</div>
            <h3 className="text-xl font-bold text-red-500 mb-2">Bir Hata Oluştu</h3>
            <p className="text-slate-600 mb-6">{errorMsg}</p>
            <button 
              onClick={resetApp}
              className="bg-indigo-500 text-white px-6 py-2 rounded-full font-bold hover:bg-indigo-600"
            >
              Tekrar Dene
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-4 md:px-8"
      style={{ paddingTop: 'var(--safe-top, 1rem)', paddingBottom: 'var(--safe-bottom, 1rem)' }}
    >
      <div className="max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[90vh]">
        {renderContent()}
        
        {appState === AppState.Input && (
          <footer className="mt-12 text-center text-slate-400 text-sm">
            <p>Gemini AI tarafından güçlendirilmiştir. ✨</p>
          </footer>
        )}
      </div>
    </div>
  );
}

export default App;
