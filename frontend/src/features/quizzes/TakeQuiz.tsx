import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle, ChevronRight, XCircle, Loader2 } from "lucide-react";
import { supabase } from "../../supabaseClient";
import type { Quiz, Question } from "../../types/study";

interface TakeQuizProps {
  quizId: string;
  onBack: () => void;
}

export default function TakeQuiz({ quizId, onBack }: TakeQuizProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  const fetchQuiz = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", quizId)
        .single();
        
      if (error) throw error;
      setQuiz(data as Quiz);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load quiz");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionSelect = (optionIndex: number) => {
    if (isFinished) return;
    setSelectedOptions((prev) => ({
      ...prev,
      [currentIndex]: optionIndex
    }));
  };

  const currentQuestion = quiz?.questions[currentIndex];
  const hasAnsweredCurrent = selectedOptions[currentIndex] !== undefined;

  const handleNext = () => {
    if (!quiz) return;
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    if (!quiz) return;
    
    let calculatedScore = 0;
    quiz.questions.forEach((q, idx) => {
      if (selectedOptions[idx] === q.correctAnswerIndex) {
        calculatedScore++;
      }
    });

    setScore(calculatedScore);
    setIsFinished(true);
    setIsSaving(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (userId) {
        await supabase.from("quiz_results").insert({
          user_id: userId,
          quiz_id: quizId,
          score: calculatedScore,
          total_questions: quiz.questions.length
        });
      }
    } catch (err) {
      console.error("Failed to save score", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-xl flex flex-col items-center">
        <p>{error || "Quiz not found"}</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-red-100 rounded-lg">Go Back</button>
      </div>
    );
  }

  if (isFinished) {
    const percentage = Math.round((score / quiz.questions.length) * 100);
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <button onClick={onBack} className="text-gray-500 flex items-center gap-2 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" /> Back to Quizzes
        </button>

        <div className="bg-white rounded-xl p-8 border-2 border-purple-200 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Complete!</h2>
          <p className="text-gray-600 mb-6">{quiz.title}</p>
          
          <div className="text-5xl font-bold text-purple-600 mb-2">
            {percentage}%
          </div>
          <p className="text-gray-500 mb-8">
            You scored {score} out of {quiz.questions.length}
          </p>
          
          {isSaving ? (
            <div className="text-sm text-gray-500 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Saving results...
            </div>
          ) : (
            <p className="text-sm text-green-600 flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" /> Results saved!
            </p>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-lg text-gray-900 mt-8">Review Answers</h3>
          {quiz.questions.map((q, idx) => {
            const userAnswer = selectedOptions[idx];
            const isCorrect = userAnswer === q.correctAnswerIndex;
            
            return (
              <div key={idx} className={`p-4 rounded-xl border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-start gap-3">
                  {isCorrect ? (
                    <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900 mb-2">{q.text}</p>
                    <div className="text-sm space-y-1">
                      <p className={isCorrect ? "text-green-700" : "text-red-700 line-through opacity-75"}>
                        Your answer: {q.options[userAnswer]}
                      </p>
                      {!isCorrect && (
                        <p className="text-green-700 font-medium">
                          Correct: {q.options[q.correctAnswerIndex]}
                        </p>
                      )}
                      <p className="text-gray-600 mt-2 italic text-xs">
                        Explanation: {q.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-gray-500 flex items-center gap-2 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" /> Exit Quiz
        </button>
        <span className="text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
          Question {currentIndex + 1} of {quiz.questions.length}
        </span>
      </div>

      <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{currentQuestion?.text}</h2>
        </div>

        <div className="space-y-3">
          {currentQuestion?.options.map((opt, idx) => {
            const isSelected = selectedOptions[currentIndex] === idx;
            return (
              <button
                key={idx}
                onClick={() => handleOptionSelect(idx)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                  isSelected 
                    ? 'border-purple-600 bg-purple-50 text-purple-900' 
                    : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50 text-gray-700'
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleNext}
            disabled={!hasAnsweredCurrent}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors font-medium"
          >
            {currentIndex === quiz.questions.length - 1 ? "Finish Quiz" : "Next Question"}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
