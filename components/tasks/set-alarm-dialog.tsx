import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Settings2 } from "lucide-react";
import { AlarmSoundType } from "@/components/providers/timer-context";
import { Smartphone, Music2, Bell } from "lucide-react";
import { Check } from "lucide-react";

export default function SetAlarmDialog({
  playPreview,
  alarmSound,
  setAlarmSound,
}: {
  playPreview: () => void;
  alarmSound: AlarmSoundType;
  setAlarmSound: (sound: AlarmSoundType) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Dialog>
        <DialogTrigger asChild>
          <button className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors bg-zinc-900/50 p-2 rounded-full border border-white/5">
            <Settings2 className="size-4" />
          </button>
        </DialogTrigger>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white w-full max-w-sm">
          <DialogHeader>
            <DialogTitle>Timer Settings</DialogTitle>
          </DialogHeader>
          <div className="pt-4 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-zinc-400">
                  Alarm Sound
                </label>
                <button
                  onClick={playPreview}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                >
                  Test Sound
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {[
                  {
                    id: "digital",
                    name: "Digital",
                    icon: Smartphone,
                    desc: "Sharp electronic beep",
                  },
                  {
                    id: "chime",
                    name: "Zen Chime",
                    icon: Music2,
                    desc: "Soft harmonic tones",
                  },
                  {
                    id: "bell",
                    name: "Bell",
                    icon: Bell,
                    desc: "Ring with decay",
                  },
                ].map((sound) => (
                  <button
                    key={sound.id}
                    onClick={() => setAlarmSound(sound.id as AlarmSoundType)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border transition-all",
                      alarmSound === sound.id
                        ? "bg-zinc-900 border-blue-500/50 text-white"
                        : "bg-transparent border-zinc-800 text-zinc-400 hover:bg-zinc-900/50",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "p-2 rounded-lg",
                          alarmSound === sound.id
                            ? "bg-blue-500/10 text-blue-400"
                            : "bg-zinc-800 text-zinc-500",
                        )}
                      >
                        <sound.icon className="size-4" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-medium">{sound.name}</div>
                        <div className="text-[10px] text-zinc-500">
                          {sound.desc}
                        </div>
                      </div>
                    </div>
                    {alarmSound === sound.id && (
                      <Check className="size-4 text-blue-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
