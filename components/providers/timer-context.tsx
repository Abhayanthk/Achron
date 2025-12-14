'use client'
import React, { createContext, useContext, useEffect, useState, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import axios from "axios"
import { useUser } from "@clerk/nextjs"

export type SessionType = "DEEP WORK" | "FLOW" | "CODING" | "LEARNING" | "WRITING" | "CUSTOM"
export type AlarmSoundType = "digital" | "chime" | "bell"

interface TimerState {
  isActive: boolean
  timeLeft: number
  duration: number
  sessionType: SessionType | string
  sessionName?: string
}

export interface TimerPreset {
    id: string
    name: string
    duration: number
    type: SessionType | string
    color: string
}

const DEFAULT_PRESETS: TimerPreset[] = [
    { id: "1", name: "Deep Work", duration: 90 * 60, type: "DEEP WORK", color: "bg-blue-500" },
//     { id: "2", name: "Flow State", duration: 45 * 60, type: "FLOW", color: "bg-purple-500" },
//     { id: "3", name: "Quick Focus", duration: 25 * 60, type: "CODING", color: "bg-emerald-500" },
//     { id: "4", name: "Learning", duration: 60 * 60, type: "LEARNING", color: "bg-amber-500" },
]

interface TimerContextType extends TimerState {
  start: () => void
  pause: () => void
  reset: () => void
  setSession: (duration: number, type: SessionType | string, name?: string, id?: string) => void
  toggle: () => void
  formatTime: (seconds: number) => string
  presets: TimerPreset[]
  addPreset: (preset: Omit<TimerPreset, "id">) => Promise<any>
  isLoadingPresets: boolean
  alarmSound: AlarmSoundType
  setAlarmSound: (sound: AlarmSoundType) => void
  playPreview: () => void
}

const TimerContext = createContext<TimerContextType | undefined>(undefined)

const DEFAULT_DURATION = 25 * 60

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser()
  
  // Timer Configuration State
  const [duration, setDuration] = useState(DEFAULT_DURATION)
  const [sessionType, setSessionType] = useState<SessionType | string>("DEEP WORK")
  const [sessionName, setSessionName] = useState<string | undefined>(undefined)
  const [currentTimerId, setCurrentTimerId] = useState<string | null>(null)
  
  // Settings
  const [alarmSound, setAlarmSound] = useState<AlarmSoundType>("digital")

  // Timer Execution State
  const [status, setStatus] = useState<'IDLE' | 'RUNNING' | 'PAUSED'>('IDLE')
  const [startTime, setStartTime] = useState<number | null>(null) // When current segment started
  const [accumulatedTime, setAccumulatedTime] = useState(0) // Seconds elapsed before current segment
  const [timeLeft, setTimeLeft] = useState(DEFAULT_DURATION)
  
  const workerRef = useRef<Worker | null>(null)
  
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  
  
  // Audio Context Ref for synthetic sound (no file needed)
  const audioContextRef = useRef<AudioContext | null>(null)
  
  const queryClient = useQueryClient();

  // Derived check for UI compatibility
  const isActive = status === 'RUNNING';

  // Fetch User Presets (unchanged)... 
  const { data: userPresets = [], isLoading: isLoadingPresets } = useQuery({
    queryKey: ['timers'],
    queryFn: async () => {
        const res = await axios.get('/api/timer/get');
        return res.data.timers.map((t: any) => ({
            id: t.id,
            name: t.name,
            duration: t.duration,
            type: t.type || "CUSTOM",
            color: t.color || "bg-pink-500" 
        }));
    }
  });
  const presets = [...DEFAULT_PRESETS, ...userPresets];

  // Helper to find preset ID -> unused but kept for ref if needed
  
  // Add Preset Mutation (unchanged)...
  const addTimerMutation = useMutation({
      mutationFn: async (newTimer: Omit<TimerPreset, "id">) => {
          const res = await axios.post('/api/timer/add', {
              name: newTimer.name,
              duration: newTimer.duration, 
              type: newTimer.type,
              color: newTimer.color
          });
          return res.data;
      },
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['timers'] });
      }
  });
  const addPreset = async (preset: Omit<TimerPreset, "id">) => {
      return await addTimerMutation.mutateAsync(preset);
  }

  // Load state (simplified for new logic)
  useEffect(() => {
    const savedState = localStorage.getItem("achron-timer-state")
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        setDuration(parsed.duration)
        setSessionType(parsed.sessionType)
        setSessionName(parsed.sessionName)
        setCurrentTimerId(parsed.currentTimerId || null) 
        if (parsed.activeSessionId) setActiveSessionId(parsed.activeSessionId)
        if (parsed.alarmSound) setAlarmSound(parsed.alarmSound)
        
        // Restore Status (RUNNING or PAUSED)
        if (parsed.status === 'RUNNING') {
             setStatus('RUNNING')
             setStartTime(parsed.startTime)
             setAccumulatedTime(parsed.accumulatedTime || 0)
             // timeLeft will be auto-calculated by tick effect immediately
        } else if (parsed.status === 'PAUSED') {
            setStatus('PAUSED')
            setAccumulatedTime(parsed.accumulatedTime || 0)
            setTimeLeft(parsed.duration - (parsed.accumulatedTime || 0))
        }
      } catch (e) {
        console.error("Failed to parse timer state", e)
      }
    }
    // Request Notification Permission
    if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
    }
  }, [])

  // Initialize Worker
  useEffect(() => {
    workerRef.current = new Worker('/timer-worker.js');
    
    workerRef.current.onmessage = (e) => {
        if (e.data.type === 'TICK') {
           // This forces a re-render/check in the active effect below?
           // No, we need to trigger the update logic here or have the effect depend on something the worker touches?
           // Actually, best pattern: The Worker drives the state update directly or we use a ref to hold state and force update?
           // Existing logic uses `useEffect` with `interval`. We want to replace that `setInterval`.
           // So we'll emit an event or update a state that triggers calculation.
           // However, updating React state 10 times a second is fine.
           // Let's make `onmessage` trigger the "tick" logic directly.
        }
    }
    
    return () => {
        workerRef.current?.terminate();
    }
  }, [])
  
  // Timer Tick Logic (Driven by Worker or Interval)
  useEffect(() => {
     // We will move the logic into the Worker's onmessage handler effectively,
     // but we need access to latest state (duration, startTime, etc.)
     // To avoid stale closures, we can use a ref for the latest state OR
     // use the fact that `useEffect` re-binds.
     // But `useEffect` re-binding every 100ms is expensive if we tear down the worker.
     // Better: Keep worker running, but updating a `tick` state?
     // Actually, simplest migration:
     // The existing `useEffect` at line 180 sets up an interval.
     // We will DELETE that useEffect and put the logic in the worker.onmessage
     
  }, []) 
  // Wait, I can't put it in the empty dependency array effect above easily without Refs.
  // Re-creating the worker effect matches the `status` dependency? 
  // No, we don't want to recreate the worker.
  
  // Ref approach for state to avoid closure staleness in the static worker callback
  const statusRef = useRef(status);
  const startTimeRef = useRef(startTime);
  const accumulatedTimeRef = useRef(accumulatedTime);
  const durationRef = useRef(duration);
  const activeSessionIdRef = useRef(activeSessionId);
  
  useEffect(() => {
      statusRef.current = status;
      startTimeRef.current = startTime;
      accumulatedTimeRef.current = accumulatedTime;
      durationRef.current = duration;
      activeSessionIdRef.current = activeSessionId;
      
      // Control Worker
      if (status === 'RUNNING') {
          workerRef.current?.postMessage({ command: 'START', interval: 100 });
      } else {
          workerRef.current?.postMessage({ command: 'STOP' });
      }
      
  }, [status, startTime, accumulatedTime, duration, activeSessionId])

  useEffect(() => {
    if (!workerRef.current) return;
    
    workerRef.current.onmessage = () => {
        if (statusRef.current === 'RUNNING' && startTimeRef.current) {
            const now = Date.now()
            const elapsed = (now - startTimeRef.current) / 1000
            const totalElapsed = accumulatedTimeRef.current + elapsed
            const remaining = Math.max(0, durationRef.current - totalElapsed)
            
            setTimeLeft(remaining)

            if (remaining <= 0) {
                finish()
            }
        }
    }
  }, []) // Bind once. Uses refs for latest data.
  // Save state
  useEffect(() => {
    localStorage.setItem("achron-timer-state", JSON.stringify({
      status,
      startTime,
      accumulatedTime,
      timeLeft,
      duration,
      sessionType,
      sessionName,
      activeSessionId, 
      currentTimerId,
      alarmSound
    }))
  }, [status, startTime, accumulatedTime, timeLeft, duration, sessionType, sessionName, activeSessionId, currentTimerId, alarmSound])

  // End Session Helper (unchanged mostly, but we might use PATCH inside logic)
  const endSession = async (id: string, passedDuration?: number): Promise<{ sessionId: string, duration: number } | null> => {
      try {
          const res = await axios.post('/api/session/end', { 
            userId: user?.id,
            sessionId: id,
            duration: passedDuration !== undefined ? Math.floor(passedDuration) : undefined
          });
          const duration = res.data.duration;
          queryClient.invalidateQueries({ queryKey: ['analytics'] });
          queryClient.invalidateQueries({ queryKey: ['balance'] });
          return { sessionId: id, duration };
      } catch (err) {
          console.error("Failed to end session", err);
          return null;
      }
  }
  
  // Update Session Helper (PATCH)
  const updateSession = async (id: string, duration: number, statusStr: string) => {
      try {
          await axios.patch(`/api/session/${id}`, { duration, status: statusStr });
      } catch (err) {
          console.error("Failed to update session", err);
      }
  }

  // Timer Tick Effect REMOVED (Replaced by Worker)
  /* 
  useEffect(() => {
    let interval: NodeJS.Timeout
    ... 
  */

  // Play Sound Helper (Synthetic Beep)
  const playAlarm = () => {
      try {
          const Ctx = window.AudioContext || (window as any).webkitAudioContext;
          if (!Ctx) return;
          
          // Reuse context or create new if closed
          let ctx = audioContextRef.current;
          if (!ctx || ctx.state === 'closed') {
              ctx = new Ctx();
              audioContextRef.current = ctx;
          }
          
          if (alarmSound === 'chime') {
             // Chime: Two tones via FM synthesisish or just simple harmony
             const now = ctx.currentTime;
             
             const osc1 = ctx.createOscillator();
             const osc2 = ctx.createOscillator();
             const gain = ctx.createGain();
             
             osc1.connect(gain);
             osc2.connect(gain);
             gain.connect(ctx.destination);
             
             osc1.type = 'triangle';
             osc2.type = 'sine';
             
             osc1.frequency.setValueAtTime(523.25, now); // C5
             osc2.frequency.setValueAtTime(659.25, now); // E5
             
             gain.gain.setValueAtTime(0, now);
             gain.gain.linearRampToValueAtTime(0.3, now + 0.1);
             gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
             
             osc1.start(now);
             osc2.start(now);
             osc1.stop(now + 2.0);
             osc2.stop(now + 2.0);
             
          } else if (alarmSound === 'bell') {
             // Bell: Additive symptoms
             const now = ctx.currentTime;
             const fundamental = 440;
             const ratios = [1, 2, 3, 4.2];
             
             ratios.forEach((ratio, i) => {
                 const osc = ctx.createOscillator();
                 const gain = ctx.createGain();
                 
                 osc.connect(gain);
                 gain.connect(ctx.destination);
                 
                 osc.frequency.value = fundamental * ratio;
                 osc.type = i === 0 ? 'sine' : 'triangle';
                 
                 gain.gain.setValueAtTime(0, now);
                 gain.gain.linearRampToValueAtTime(0.2 / (i+1), now + 0.05);
                 gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5 - (i*0.2));
                 
                 osc.start(now);
                 osc.stop(now + 1.5);
             });
          } else {
             // Default Digital
             const now = ctx.currentTime;
             const osc = ctx.createOscillator();
             const gain = ctx.createGain();
             
             osc.connect(gain);
             gain.connect(ctx.destination);
             
             osc.type = 'sine';
             osc.frequency.setValueAtTime(880, now);
             osc.frequency.exponentialRampToValueAtTime(440, now + 0.5);
             
             gain.gain.setValueAtTime(0.3, now);
             gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
             
             osc.start(now);
             osc.stop(now + 0.5);
          }
          
      } catch (e) {
          console.error("Audio playback error", e);
          toast.error("Timer Finished!");
      }
  }

  // --- ACTIONS ---

  const start = async () => {
      if (status === 'RUNNING') return;
      
      const now = Date.now();
      
      if (status === 'IDLE') {
          // Start NEW session
           setStartTime(now);
           setStatus('RUNNING');
           
           if (currentTimerId) {
                try {
                    const res = await axios.post('/api/session/start', { timerId: currentTimerId });
                    setActiveSessionId(res.data.sessionId);
                } catch (err: any) {
                    console.error("Failed to start session", err);
                }
           }
            
            // Prime Audio Context on user interaction
            if (!audioContextRef.current) {
                 const Ctx = window.AudioContext || (window as any).webkitAudioContext;
                 if (Ctx) {
                     audioContextRef.current = new Ctx();
                     // Resume if suspended (browser policy)
                     if (audioContextRef.current.state === 'suspended') {
                         audioContextRef.current.resume();
                     }
                 }
            } else if (audioContextRef.current.state === 'suspended') {
                audioContextRef.current.resume();
            }
      } else if (status === 'PAUSED') {
          // RESUME existing session
          setStartTime(now);
          setStatus('RUNNING');
          // No API call needed strictly, or we could update status to ACTIVE
          if (activeSessionId) {
              updateSession(activeSessionId, accumulatedTime, 'ACTIVE');
          }
      }
  }

  const pause = async () => {
    if (statusRef.current !== 'RUNNING' || !startTimeRef.current) return;

    const now = Date.now();
    const elapsedSegment = (now - startTimeRef.current) / 1000;
    const newAccumulated = accumulatedTimeRef.current + elapsedSegment;

    setAccumulatedTime(newAccumulated);
    setStartTime(null);
    setStatus('PAUSED');
    
    // Sync with DB: Update duration & status, but DO NOT END
    const currentSessionId = activeSessionIdRef.current;
    if (currentSessionId) {
        updateSession(currentSessionId, newAccumulated, 'PAUSED');
        
        // Notify user session is recorded (safe)
        if (newAccumulated > 0) {
             const mins = Math.max(1, Math.ceil(newAccumulated / 60))
             const toastId = toast("Timer Paused", {
                 description: `Recorded ${mins} minutes so far.`,
                 action: {
                     label: "Undo",
                     onClick: async () => {
                         try {
                             await axios.delete(`/api/session/${currentSessionId}`)
                             queryClient.invalidateQueries({ queryKey: ['analytics'] })
                             queryClient.invalidateQueries({ queryKey: ['balance'] })
                             setActiveSessionId(null)
                             setStatus('IDLE')
                             setAccumulatedTime(0)
                             setTimeLeft(durationRef.current)
                             toast.success("Session deleted")
                             toast.dismiss(toastId)
                         } catch (e) {
                             toast.error("Failed to delete")
                         }
                     }
                 }
             })
        }
    }
  }
  
  const finish = async () => {
    // Calculate final time
    const now = Date.now();
    let finalDuration = accumulatedTimeRef.current;
    if (startTimeRef.current) {
        finalDuration += (now - startTimeRef.current) / 1000;
    }
    
    // Reset State
    setStatus('IDLE');
    setStartTime(null);
    setAccumulatedTime(0);
    setTimeLeft(durationRef.current); // Reset UI to full duration for next round
    
    playAlarm();
    
    // System Notification
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Timer Finished!", {
            body: "Your session is complete.",
            icon: "/icon.png" // Fallback or valid path
        });
    }
    
    const currentSessionId = activeSessionIdRef.current;
    if (currentSessionId) {
       // Call END to finalize (adds XP, marks COMPLETED)
       // We can rely on backend to calc duration if we passed start time?
       // But our `endSession` route does `diff = now - startTime`.
       // This works perfectly since we started the session in DB at `start()`.
       // We just need to make sure we didn't "complete" it already.
       
       const result = await endSession(currentSessionId, finalDuration)
       setActiveSessionId(null)
       
       if (result) {
           const mins = Math.ceil(result.duration / 60)
           toast.success(`Session Completed!`, {
               description: `You focused for ${mins} minutes.`,
               icon: '🎉'
           })
       }
    }
  }
  
  const reset = async () => {
    // Capture current progress
    let currentDuration = accumulatedTimeRef.current;
    if (statusRef.current === 'RUNNING' && startTimeRef.current) {
        currentDuration += (Date.now() - startTimeRef.current) / 1000;
    }

    setStatus('IDLE');
    setStartTime(null);
    setAccumulatedTime(0);
    setTimeLeft(durationRef.current); 
    
    const currentSessionId = activeSessionIdRef.current;
    if (currentSessionId) {
         // End the session (ABORT or just COMPLETED logic? User just hit reset)
         // Usually Reset = "I'm done check stats".
         const result = await endSession(currentSessionId, currentDuration);
         setActiveSessionId(null);
         
         if (result && result.duration > 0) { 
             const mins = Math.max(1, Math.ceil(result.duration / 60))
             const toastId = toast("Session Reset", {
                 description: `Saved ${mins} mins.`,
                 action: {
                     label: "Undo",
                     onClick: async () => {
                         try {
                             await axios.delete(`/api/session/${result.sessionId}`)
                             queryClient.invalidateQueries({ queryKey: ['analytics'] })
                             queryClient.invalidateQueries({ queryKey: ['balance'] })
                             toast.success("Session deleted")
                             toast.dismiss(toastId)
                         } catch (e) {
                             toast.error("Failed to delete")
                         }
                     }
                 }
             })
         }
    }
  }

  const toggle = () => {
      if (status === 'RUNNING') {
          pause()
      } else {
          start()
      }
  }

  const setSession = (newDuration: number, newType: SessionType | string, newName?: string, newId?: string) => {
    // If running, end current
    if (status === 'RUNNING' || status === 'PAUSED') {
        if (activeSessionId) {
            endSession(activeSessionId);
            setActiveSessionId(null);
        }
    }
    
    setStatus('IDLE')
    setStartTime(null)
    setAccumulatedTime(0)
    setDuration(newDuration)
    setTimeLeft(newDuration)
    setSessionType(newType)
    setSessionName(newName)

    // Try to match preset if no ID passed (backwards compat)
    if (newId) {
        setCurrentTimerId(newId);
    } else {
        const match = presets.find(p => p.duration === newDuration && p.type === newType);
        setCurrentTimerId(match ? match.id : null);
    }
  }
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <TimerContext.Provider value={{
      isActive,
      timeLeft,
      duration,
      sessionType,
      sessionName,
      start,
      pause,
      reset,
      toggle,
      setSession,
      formatTime,
      presets,
      addPreset,
      isLoadingPresets,
      alarmSound,
      setAlarmSound,
      playPreview: playAlarm
    }}>
      {children}
    </TimerContext.Provider>
  )
}

export function useTimer() {
  const context = useContext(TimerContext)
  if (context === undefined) {
    throw new Error("useTimer must be used within a TimerProvider")
  }
  return context
}
