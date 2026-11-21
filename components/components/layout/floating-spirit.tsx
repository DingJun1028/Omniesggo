"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Command } from "lucide-react";
import { useAppContext } from "@/lib/context/app-context";

const hotkeys = [
  { key: "K", desc: "喚醒精靈" },
  { key: "D", desc: "儀表板" },
  { key: "J", desc: "AI 治理" },
  { key: "L", desc: "切換語言" },
];

import { SentientSpiritHub } from "@/components/ui/sentient-spirit-hub";

export function FloatingSpirit() {
  const { isSpiritOpen, setIsSpiritOpen, setActiveTab, lang, setLang } = useAppContext();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case "k":
            e.preventDefault();
            setIsSpiritOpen(!isSpiritOpen);
            break;
          case "d":
            e.preventDefault();
            setActiveTab("dashboard");
            break;
          case "j":
            e.preventDefault();
            setActiveTab("junaikey");
            break;
          case "l":
            e.preventDefault();
            setLang(lang === "zh" ? "en" : "zh");
            break;
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSpiritOpen, setIsSpiritOpen, setActiveTab, lang, setLang]);

  return <SentientSpiritHub variant="floating" />;
}
