import { Moon, Sun } from "lucide-react"
import { useTheme } from "../lib/theme-provider"
import { motion } from "motion/react"

export function ModeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`relative h-10 w-20 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-1 transition-colors ${className}`}
      role="switch"
      aria-checked={isDark}
    >
      <motion.div
        className="absolute top-1 h-8 w-8 rounded-full flex items-center justify-center shadow-md"
        animate={{
          x: isDark ? 36 : 4,
          backgroundColor: isDark ? "#f97316" : "#ffffff",
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30
        }}
      >
        {isDark ? (
          <Moon size={16} className="text-white" strokeWidth={2.5} />
        ) : (
          <Sun size={16} className="text-amber-500" strokeWidth={2.5} />
        )}
      </motion.div>
      
      <div className="absolute inset-0 flex items-center justify-between px-2">
        <Sun 
          size={14} 
          className={`transition-all duration-300 ${isDark ? 'opacity-30 text-slate-400' : 'opacity-100 text-amber-500'}`} 
          strokeWidth={2.5}
        />
        <Moon 
          size={14} 
          className={`transition-all duration-300 ${isDark ? 'opacity-100 text-white' : 'opacity-30 text-slate-400'}`} 
          strokeWidth={2.5}
        />
      </div>
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}