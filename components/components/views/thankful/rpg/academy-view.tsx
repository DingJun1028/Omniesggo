import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CheckCircle2, PlayCircle, Award, Clock, X, Loader2, Sparkles, BrainCircuit } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleGenAI, Type } from "@google/genai";
import Markdown from "react-markdown";

const COURSES = [
  { id: 1, title: "碳盤查基礎 (Carbon Footprint Basics - ISO 14064)", desc: "了解溫室氣體盤查的基本概念與實務操作 (GHG Accounting Concepts).", progress: 100, status: "completed", coins: 50, duration: "2h" },
  { id: 2, title: "循環經濟與減廢策略 (Circular Economy)", desc: "探索如何將線性經濟轉型為循環經濟，減少企業廢棄物 (Waste Reduction Strategies).", progress: 45, status: "in-progress", coins: 100, duration: "3h" },
  { id: 3, title: "企業社會責任與利害關係人 (CSR & Stakeholders)", desc: "學習如何與利害關係人溝通，建立良好的企業形象 (Communication Strategies).", progress: 0, status: "not-started", coins: 80, duration: "1.5h" },
  { id: 4, title: "綠色供應鏈管理 (Green Supply Chain)", desc: "掌握供應商評鑑與綠色採購的關鍵要素 (Green Procurement).", progress: 0, status: "not-started", coins: 120, duration: "4h" },
];

interface QuizData {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export function AcademyView() {
  const [selectedCourse, setSelectedCourse] = useState<typeof COURSES[0] | null>(null);
  const [quizState, setQuizState] = useState<"idle" | "loading" | "active" | "result">("idle");
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [earnedCoins, setEarnedCoins] = useState(0);

  const startQuiz = async (course: typeof COURSES[0]) => {
    setSelectedCourse(course);
    setQuizState("loading");
    setQuizData(null);
    setSelectedOption(null);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Missing Gemini API Key");

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a multiple-choice question about: ${course.title}. The question and options should be in Traditional Chinese (zh-TW), following the "英標繁博" style (Traditional Chinese with English in parentheses where professional terms are used).`,
        config: {
          systemInstruction: "You are an expert ESG educator. Generate a challenging but fair multiple-choice question.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING, description: "The quiz question" },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Exactly 4 options for the answer"
              },
              correctAnswerIndex: { type: Type.INTEGER, description: "The index (0-3) of the correct option" },
              explanation: { type: Type.STRING, description: "Explanation of why the answer is correct" }
            },
            required: ["question", "options", "correctAnswerIndex", "explanation"]
          }
        }
      });

      const data = JSON.parse(response.text || "{}") as QuizData;
      setQuizData(data);
      setQuizState("active");
    } catch (error) {
      console.error("Failed to generate quiz:", error);
      setQuizState("idle");
      alert("無法生成測驗，請稍後再試 (Unable to generate quiz, please try again later).");
    }
  };

  const handleAnswer = (index: number) => {
    if (quizState !== "active") return;
    setSelectedOption(index);
    setQuizState("result");
    
    if (quizData && index === quizData.correctAnswerIndex) {
      setEarnedCoins(prev => prev + 10);
    }
  };

  const closeQuiz = () => {
    setSelectedCourse(null);
    setQuizState("idle");
    setQuizData(null);
    setSelectedOption(null);
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">永續學堂課程 (Academy Courses)</h2>
        <Badge className="bg-blue-100 text-blue-700 border-none px-3 py-1 text-sm flex items-center gap-1">
          <Award className="w-4 h-4" />
          目前學分 (Credits): 12 | 永續幣 (Coins): {1250 + earnedCoins}
        </Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {COURSES.map(course => (
          <GlassCard key={course.id} className="p-6 flex flex-col h-full hover:border-blue-200 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-500" />
              </div>
              {course.status === "completed" && <Badge className="bg-emerald-100 text-emerald-700 border-none"><CheckCircle2 className="w-3 h-3 mr-1 inline"/> 已完成 (Completed)</Badge>}
              {course.status === "in-progress" && <Badge className="bg-amber-100 text-amber-700 border-none">進行中 (In Progress)</Badge>}
              {course.status === "not-started" && <Badge className="bg-slate-100 text-slate-700 border-none">未開始 (Not Started)</Badge>}
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{course.title}</h3>
            <p className="text-sm text-slate-500 mb-6 flex-1">{course.desc}</p>
            
            <div className="space-y-4 mt-auto">
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span className="flex items-center gap-1"><Clock className="w-4 h-4"/> {course.duration}</span>
                <span className="flex items-center gap-1 text-amber-600 font-bold"><Award className="w-4 h-4"/> +{course.coins} 幣 (Coins)</span>
              </div>
              
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-slate-500">
                  <span>學習進度 (Progress)</span>
                  <span>{course.progress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-1000 ${course.progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${course.progress}%` }} />
                </div>
              </div>
              
              <button 
                onClick={() => startQuiz(course)}
                className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors mt-4 ${course.status === 'completed' ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              >
                {course.status === 'completed' ? <><BrainCircuit className="w-4 h-4"/> 隨堂測驗 (Quick Quiz)</> : <><PlayCircle className="w-4 h-4"/> 繼續學習 (Continue Learning)</>}
              </button>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Quiz Modal */}
      <AnimatePresence>
        {selectedCourse && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm pointer-events-auto"
              onClick={closeQuiz}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden relative z-10 pointer-events-auto flex flex-col max-h-[90vh]"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <BrainCircuit className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">AI 隨堂測驗 (AI Quick Quiz)</h3>
                    <p className="text-xs text-slate-500">{selectedCourse.title}</p>
                  </div>
                </div>
                <button onClick={closeQuiz} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                {quizState === "loading" && (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
                    <p className="text-sm font-medium animate-pulse">精靈正在為您生成專屬考題 (AI Generating Quiz)...</p>
                  </div>
                )}

                {quizData && (quizState === "active" || quizState === "result") && (
                  <div className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                      <p className="text-slate-800 font-medium leading-relaxed">{quizData.question}</p>
                    </div>

                    <div className="space-y-3">
                      {quizData.options.map((option, idx) => {
                        const isSelected = selectedOption === idx;
                        const isCorrect = idx === quizData.correctAnswerIndex;
                        const showResult = quizState === "result";
                        
                        let btnClass = "border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-700";
                        
                        if (showResult) {
                          if (isCorrect) {
                            btnClass = "border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500";
                          } else if (isSelected && !isCorrect) {
                            btnClass = "border-rose-500 bg-rose-50 text-rose-800 ring-1 ring-rose-500";
                          } else {
                            btnClass = "border-slate-200 bg-slate-50 text-slate-400 opacity-50";
                          }
                        } else if (isSelected) {
                          btnClass = "border-blue-500 bg-blue-50 text-blue-800 ring-1 ring-blue-500";
                        }

                        return (
                          <button
                            key={idx}
                            onClick={() => handleAnswer(idx)}
                            disabled={showResult}
                            className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${btnClass}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                showResult 
                                  ? (isCorrect ? 'bg-emerald-500 text-white' : (isSelected ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-500'))
                                  : 'bg-slate-100 text-slate-500'
                              }`}>
                                {String.fromCharCode(65 + idx)}
                              </div>
                              <span className="text-sm">{option}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {quizState === "result" && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-5 rounded-xl border ${
                          selectedOption === quizData.correctAnswerIndex 
                            ? "bg-emerald-50 border-emerald-200" 
                            : "bg-amber-50 border-amber-200"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {selectedOption === quizData.correctAnswerIndex ? (
                            <>
                              <Sparkles className="w-5 h-5 text-emerald-600" />
                              <h4 className="font-bold text-emerald-800">答對了！獲得 10 枚永續幣 (Correct! +10 Coins)</h4>
                            </>
                          ) : (
                            <>
                              <BrainCircuit className="w-5 h-5 text-amber-600" />
                              <h4 className="font-bold text-amber-800">再接再厲 (Try Again)!</h4>
                            </>
                          )}
                        </div>
                        <div className="text-sm text-slate-700 prose prose-sm max-w-none">
                          <Markdown>{quizData.explanation}</Markdown>
                        </div>
                        
                        <button 
                          onClick={() => startQuiz(selectedCourse)}
                          className="mt-4 w-full py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          再來一題 (Another Question)
                        </button>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
