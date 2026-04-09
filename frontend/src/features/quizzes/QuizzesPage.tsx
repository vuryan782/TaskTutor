import { useState, useEffect } from "react";
import { FileQuestion, Menu, Plus, Play, Loader2, ArrowRight } from "lucide-react";
import { generateQuizFromNotes } from "./generateQuiz";
import type { Quiz, Material } from "../../types/study";
import { supabase } from "../../supabaseClient";
import TakeQuiz from "./TakeQuiz";

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [quizzesRes, materialsRes] = await Promise.all([
        supabase.from("quizzes").select("*").order("created_at", { ascending: false }),
        supabase.from("materials").select("*").order("created_at", { ascending: false })
      ]);

      if (quizzesRes.error) throw quizzesRes.error;
      if (materialsRes.error) throw materialsRes.error;

      setQuizzes(quizzesRes.data || []);
      setMaterials(materialsRes.data || []);
      if (materialsRes.data && materialsRes.data.length > 0) {
        setSelectedMaterialId(materialsRes.data[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to load data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateRealQuiz = async () => {
    if (!selectedMaterialId) return;
    setIsGenerating(true);
    setError(null);

    try {
      const material = materials.find(m => m.id === selectedMaterialId);
      if (!material) throw new Error("Material not found");

      const { data: fileData, error: downloadError } = await supabase.storage
        .from("study-materials")
        .download(material.file_url);

      if (downloadError) throw downloadError;
      if (!fileData) throw new Error("Could not download file content");
      
      const text = await fileData.text();

      const quizData = await generateQuizFromNotes(`Title: ${material.title}\n\nContents: ${text}`);

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      
      const { data, error: dbError } = await supabase.from("quizzes").insert({
        user_id: userId,
        material_id: material.id,
        title: quizData.title,
        topic: quizData.topic,
        questions: quizData.questions
      }).select().single();

      if (dbError) throw dbError;

      setQuizzes([data, ...quizzes]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Quiz generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  if (activeQuizId) {
    return <TakeQuiz quizId={activeQuizId} onBack={() => setActiveQuizId(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Quizzes</h1>
          <p className="text-gray-600">Create and manage your practice quizzes</p>
        </div>
      </div>

      <div className="bg-white border-2 border-purple-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Generate New Quiz</h2>
        <p className="text-gray-600 mb-4">Select an uploaded material to generate a custom quiz using AI.</p>
        
        {error && <div className="text-red-600 bg-red-50 p-3 rounded-lg mb-4">{error}</div>}

        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <select 
            value={selectedMaterialId} 
            onChange={(e) => setSelectedMaterialId(e.target.value)}
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
          >
            {materials.length === 0 && <option value="">No materials available</option>}
            {materials.map(m => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </select>
          <button 
            onClick={handleGenerateRealQuiz}
            disabled={isGenerating || materials.length === 0}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
            {isGenerating ? "Generating Quiz..." : "Generate from Material"}
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Your Quizzes ({quizzes.length})</h2>
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 text-purple-600 animate-spin" /></div>
        ) : quizzes.length === 0 ? (
          <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-500">
            No quizzes generated yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 hover:shadow-lg transition-shadow flex flex-col items-start justify-between">
                <div className="w-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-purple-600 rounded-lg p-3">
                      <FileQuestion className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{quiz.title}</h3>
                  <p className="text-xs text-purple-700 font-medium mb-2">{quiz.topic}</p>
                  <p className="text-sm text-gray-600 mb-4">
                    {quiz.questions ? quiz.questions.length : 0} questions • {quiz.created_at ? new Date(quiz.created_at).toLocaleDateString() : 'Just now'}
                  </p>
                </div>
                <div className="w-full flex items-center gap-2 mt-auto">
                  <button 
                    onClick={() => setActiveQuizId(quiz.id || null)}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors text-sm font-medium"
                  >
                    Take Quiz
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
