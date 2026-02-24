"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Achievement = {
  title: string;
  details?: string;
  date?: string;
  image?: string;
};

export default function PlayerAchievementsGallery({ achievements }: { achievements: Achievement[] }) {
  const [preview, setPreview] = useState<Achievement | null>(null);

  const sorted = useMemo(() => {
    return [...achievements].sort((a, b) => {
      const at = a?.date ? new Date(a.date).getTime() : 0;
      const bt = b?.date ? new Date(b.date).getTime() : 0;
      return bt - at;
    });
  }, [achievements]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setPreview(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!sorted.length) {
    return <p className="mt-2 text-white/70">No achievements added yet.</p>;
  }

  return (
    <>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {sorted.map((item, idx) => (
          <motion.article
            key={`${item.title}-${idx}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: idx * 0.03 }}
            className="group overflow-hidden rounded-xl border border-white/10 bg-black/20"
          >
            {item.image ? (
              <button type="button" className="block w-full overflow-hidden" onClick={() => setPreview(item)}>
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-40 w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </button>
            ) : null}
            <div className="p-3">
              <p className="font-medium text-white">{item.title}</p>
              {item.date ? <p className="mt-1 text-xs text-pitch-200">{formatDate(item.date)}</p> : null}
              <p className="mt-2 text-sm text-white/75">{item.details || "No details provided."}</p>
            </div>
          </motion.article>
        ))}
      </div>

      <AnimatePresence>
        {preview?.image ? (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreview(null)}
          >
            <motion.div
              className="glass-panel relative w-full max-w-4xl overflow-hidden p-0"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="absolute right-3 top-3 z-10 rounded-full bg-black/60 px-3 py-1 text-sm text-white hover:bg-black/80"
              >
                Close
              </button>
              <img src={preview.image} alt={preview.title} className="max-h-[78vh] w-full object-contain bg-black/30" />
              <div className="border-t border-white/10 p-4">
                <p className="text-base font-semibold text-white">{preview.title}</p>
                {preview.date ? <p className="mt-1 text-xs text-pitch-200">{formatDate(preview.date)}</p> : null}
                <p className="mt-2 text-sm text-white/75">{preview.details || "No details provided."}</p>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function formatDate(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  return date.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "2-digit" });
}
