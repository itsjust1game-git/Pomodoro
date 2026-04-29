/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Square, 
  History,
  Timer as TimerIcon,
  ChevronLeft,
  Trash2
} from 'lucide-react';

const DEFAULT_DURATION = 25 * 60; // 25 minutes in seconds
const MIN_DURATION = 5 * 60;    // 5 minutes
const MAX_DURATION = 180 * 60;  // 3 hours

type View = 'timer' | 'sessions';

interface Session {
  id: string;
  duration: number;
  timestamp: Date;
  completed: boolean;
}

export default function App() {
  const [view, setView] = useState<View>('timer');
  const [duration, setDuration] = useState(DEFAULT_DURATION);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_DURATION);
  const [isActive, setIsActive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sessions, setSessions] = useState<Session[]>(() => {
    const saved = localStorage.getItem('pomodoro-sessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((s: any) => ({
          ...s,
          timestamp: new Date(s.timestamp)
        }));
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  
  useEffect(() => {
    localStorage.setItem('pomodoro-sessions', JSON.stringify(sessions));
  }, [sessions]);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const recordSession = useCallback((completed: boolean) => {
    const sessionDuration = duration - timeLeft;
    if (sessionDuration < 10 && !completed) return; // Don't record tiny accidental sessions unless finished

    const newSession: Session = {
      id: Math.random().toString(36).substr(2, 9),
      duration: completed ? duration : sessionDuration,
      timestamp: new Date(),
      completed
    };
    setSessions(prev => [newSession, ...prev]);
  }, [duration, timeLeft]);

  const handleStart = () => {
    if (timeLeft > 0) {
      setIsActive(true);
    }
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(duration);
  };

  const handleEnd = () => {
    if (isActive || timeLeft < duration) {
      recordSession(timeLeft === 0);
    }
    setIsActive(false);
    setTimeLeft(duration);
  };

  const handleDurationChange = (newMins: number) => {
    const newSeconds = Math.max(MIN_DURATION, Math.min(MAX_DURATION, newMins * 60));
    setDuration(newSeconds);
    if (!isActive) {
      setTimeLeft(newSeconds);
    }
  };

  const tick = useCallback(() => {
    setTimeLeft((prev) => {
      if (prev <= 1) {
        setIsActive(false);
        recordSession(true);
        return 0;
      }
      return prev - 1;
    });
  }, [recordSession]);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(tick, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, tick]);

  const progress = ((duration - timeLeft) / duration) * 100;

  const totalFocusTime = sessions.reduce((acc, s) => acc + s.duration, 0);

  return (
    <div className="w-full h-screen bg-app-bg text-text-main font-sans flex flex-col items-center justify-between p-8 md:p-12 overflow-hidden select-none">
      {/* Background Glow */}
      <div className="absolute w-[500px] h-[500px] bg-accent opacity-[0.03] blur-[100px] pointer-events-none -z-10" />

      {/* Header Navigation */}
      <nav className="w-full flex justify-between items-center opacity-80 z-50">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-accent shadow-[0_0_10px_#F59E0B]"></div>
          <span className="text-xs font-semibold tracking-widest uppercase">Deep Focus</span>
        </div>
        <div className="hidden sm:flex space-x-8 text-[11px] font-medium tracking-wide uppercase">
          <button 
            onClick={() => setView('timer')}
            className={`transition-all pb-1 border-b ${view === 'timer' ? 'border-accent opacity-100' : 'border-transparent opacity-40 hover:opacity-100'}`}
          >
            Timer
          </button>
          <button 
            onClick={() => setView('sessions')}
            className={`transition-all pb-1 border-b ${view === 'sessions' ? 'border-accent opacity-100' : 'border-transparent opacity-40 hover:opacity-100'}`}
          >
            Sessions
          </button>
        </div>
        <div className="sm:hidden flex items-center space-x-4">
          <button 
            className="opacity-40"
            onClick={() => setView(view === 'timer' ? 'sessions' : 'timer')}
          >
            <History className="w-4 h-4" />
          </button>
        </div>
      </nav>

      <AnimatePresence mode="wait">
        {view === 'timer' ? (
          <motion.main 
            key="timer-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="flex-1 w-full flex flex-col items-center justify-center pt-8"
          >
            {/* Timer Display */}
            <div className="relative flex flex-col items-center">
              <div className="w-[300px] h-[300px] md:w-[420px] md:h-[420px] rounded-full border border-white/5 flex items-center justify-center relative">
                <svg className="absolute w-full h-full -rotate-90">
                  <circle 
                    cx="50%" 
                    cy="50%" 
                    r="48%" 
                    fill="none" 
                    stroke="rgba(255,255,255,0.03)" 
                    strokeWidth="1" 
                  />
                  <motion.circle
                    cx="50%"
                    cy="50%"
                    r="48%"
                    fill="none"
                    stroke="var(--color-accent)"
                    strokeWidth="4"
                    strokeDasharray="100 100"
                    animate={{ strokeDashoffset: 100 - progress }}
                    transition={{ type: "tween", ease: "linear" }}
                    className="opacity-80"
                    strokeLinecap="round"
                    pathLength="100"
                  />
                </svg>

                <div className="flex flex-col items-center">
                  <motion.span 
                    key={timeLeft}
                    initial={{ opacity: 0.9 }}
                    animate={{ opacity: 1 }}
                    className="text-6xl md:text-8xl font-light tracking-tighter text-white tabular-nums"
                  >
                    {formatTime(timeLeft)}
                  </motion.span>
                  <span className="text-[10px] md:text-xs font-semibold tracking-[0.4em] uppercase opacity-40 mt-4">
                    {isActive ? 'Focus Phase' : timeLeft === 0 ? 'Session Complete' : 'Paused'}
                  </span>
                </div>
              </div>
            </div>

            {/* Timer Specific Controls (Only showing here to keep clean separation) */}
            <div className="w-full max-w-3xl mt-12 space-y-12">
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-40">Set Duration</span>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => handleDurationChange(25)}
                          className="text-[9px] font-bold uppercase tracking-widest text-accent/40 hover:text-accent transition-colors"
                        >
                          Default
                        </button>
                        <span className="text-sm font-mono text-accent">{formatTime(duration)}</span>
                      </div>
                    </div>
                    <div className="relative h-1 w-full bg-white/5 rounded-full">
                      <div 
                        className="absolute left-0 top-0 h-full bg-accent rounded-full transition-all" 
                        style={{ width: `${(duration / MAX_DURATION) * 100}%` }}
                      />
                      <input 
                        type="range"
                        min="5"
                        max="180"
                        step="5"
                        value={duration / 60}
                        onChange={(e) => handleDurationChange(parseInt(e.target.value))}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer"
                      />
                      <div 
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-[#0A0C10] shadow-xl shadow-black pointer-events-none transition-all"
                        style={{ left: `calc(${(duration / MAX_DURATION) * 100}% - 8px)` }}
                      />
                    </div>
                    <div className="flex justify-between px-1">
                      <span className="text-[9px] opacity-30">5M</span>
                      <span className="text-[9px] opacity-30">30M</span>
                      <span className="text-[9px] opacity-30">1H</span>
                      <span className="text-[9px] opacity-30">2H</span>
                      <span className="text-[9px] opacity-30">3H</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between pb-8">
                <div className="flex space-x-6 md:space-x-12">
                  <button 
                    onClick={handleEnd}
                    className="group flex flex-col items-center space-y-2 opacity-50 hover:opacity-100 transition-opacity"
                  >
                    <div className="w-10 h-10 border border-white/10 rounded-full flex items-center justify-center group-hover:bg-white/5 transition-colors">
                      <Square className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-widest">End</span>
                  </button>
                  <button 
                    onClick={handleReset}
                    className="group flex flex-col items-center space-y-2 opacity-50 hover:opacity-100 transition-opacity"
                  >
                    <div className="w-10 h-10 border border-white/10 rounded-full flex items-center justify-center group-hover:bg-white/5 transition-colors">
                      <RotateCcw className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-widest">Reset</span>
                  </button>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={isActive ? handlePause : handleStart}
                  className="bg-white text-black px-8 md:px-12 py-4 rounded-full font-bold text-[10px] md:text-xs uppercase tracking-[0.2em] shadow-2xl shadow-white/10"
                >
                  {isActive ? 'Pause Session' : 'Start Session'}
                </motion.button>

                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className={`group flex flex-col items-center space-y-2 transition-opacity ${showSettings ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`}
                >
                  <div className={`w-10 h-10 border border-white/10 rounded-full flex items-center justify-center transition-colors ${showSettings ? 'bg-accent/20 border-accent/30' : 'group-hover:bg-white/5'}`}>
                    <TimerIcon className={`w-4 h-4 ${showSettings ? 'text-accent' : 'text-white'}`} />
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-widest ${showSettings ? 'text-accent' : ''}`}>Duration</span>
                </button>
              </div>
            </div>
          </motion.main>
        ) : (
          <motion.main 
            key="sessions-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 w-full max-w-2xl flex flex-col pt-12 overflow-hidden"
          >
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-3xl font-light text-white mb-2">History</h2>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Your past focus sessions</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-mono text-accent">{formatTime(totalFocusTime)}</div>
                <div className="text-[9px] font-bold uppercase tracking-widest opacity-30 mt-1">Total Focused</div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {sessions.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center border border-white/5 rounded-3xl opacity-20">
                  <History className="w-12 h-12 mb-4" />
                  <span className="text-xs uppercase tracking-widest font-bold">No sessions recorded yet</span>
                </div>
              ) : (
                sessions.map((session) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={session.id}
                    className="bg-white/5 border border-white/5 p-4 rounded-2xl flex justify-between items-center group hover:bg-white/[0.07] transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-1.5 h-1.5 rounded-full ${session.completed ? 'bg-accent' : 'bg-white/20'}`} />
                      <div>
                        <div className="text-sm font-medium text-white">
                          {formatTime(session.duration)} Focus
                        </div>
                        <div className="text-[10px] opacity-30 uppercase font-mono mt-0.5">
                          {session.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {session.timestamp.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSessions(prev => prev.filter(s => s.id !== session.id))}
                      className="p-2 opacity-0 group-hover:opacity-100 text-white/20 hover:text-accent transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))
              )}
            </div>

            <button 
              onClick={() => setView('timer')}
              className="mt-8 flex items-center justify-center gap-2 py-4 border border-white/5 rounded-2xl text-[10px] uppercase font-bold tracking-widest opacity-40 hover:opacity-100 transition-all hover:bg-white/5"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Timer
            </button>
          </motion.main>
        )}
      </AnimatePresence>

      {/* Bottom Session Detail Decor */}
      <footer className="w-full max-w-3xl">
        <div className="w-full flex justify-between items-center text-[10px] opacity-30 font-medium border-t border-white/5 pt-6 hidden md:flex">
          <div className="flex space-x-6">
            <span>SESSION #{sessions.filter(s => s.completed).length + 1}</span>
            <span>OS: PM-V2</span>
          </div>
          <div className="flex space-x-6">
            <span>TRACKER ACTIVE</span>
            <span className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} /> 
              {isActive ? 'FLOW STATE' : 'IDLE'}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
