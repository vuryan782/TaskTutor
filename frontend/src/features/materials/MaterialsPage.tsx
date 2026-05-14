import { useState, useEffect, useRef } from "react";
import { BookOpen, ChevronRight, Search, Upload, Loader2, Trash2 } from "lucide-react";
import { supabase } from "../../supabaseClient";
import type { Material } from "../../types/study";

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("materials")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMaterials(data || []);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load materials");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const user = userData.user;

      if (!user) {
        throw new Error("Must be logged in to upload");
      }

      // Upload to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}_${file.name}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("study-materials")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const fileUrl = uploadData.path;

      // Insert into DB
      const { error: dbError } = await supabase.from("materials").insert({
        user_id: user.id,
        title: file.name,
        file_url: fileUrl,
        file_type: fileExt || "unknown",
        size_bytes: file.size,
      });

      if (dbError) throw dbError;

      // Refresh list
      await fetchMaterials();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteMaterial = async (material: Material) => {
    if (!window.confirm("Are you sure you want to delete this material? This may delete associated quizzes.")) return;
    
    setError(null);
    try {
      if (material.file_url) {
        // Try to remove from storage, ignore error if file not found
        await supabase.storage.from("study-materials").remove([material.file_url]);
      }
      
      const { error: dbError } = await supabase.from("materials").delete().eq("id", material.id);
      if (dbError) throw dbError;
      
      setMaterials(prev => prev.filter(m => m.id !== material.id));
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to delete material");
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#e8e8ed] mb-2">Study Materials</h1>
          <p className="text-[#8b8b9e]">Manage and organize your learning resources</p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="bg-[#7c5cfc] hover:bg-[#6a4ce0] disabled:opacity-50 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
        >
          {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
          {isUploading ? "Uploading..." : "Upload Files"}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
          accept=".pdf,.docx,.txt"
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      )}

      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-[#2a2a3a] rounded-xl p-12 text-center bg-[#1c1c27] hover:bg-[#222233] transition-colors cursor-pointer"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="bg-[#7c5cfc]/10 rounded-full p-4">
            <Upload className="w-8 h-8 text-[#7c5cfc]" />
          </div>
          <div>
            <p className="text-[#e8e8ed] font-medium mb-1">Drop files here or click to browse</p>
            <p className="text-sm text-[#5c5c72]">PDF, DOCX, TXT supported (Max 10MB)</p>
          </div>
        </div>
      </div>

      <div className="bg-[#16161e] rounded-xl border border-[#2a2a3a]">
        <div className="p-6 border-b border-[#2a2a3a]">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#e8e8ed]">Your Materials ({materials.length})</h2>
            <div className="relative">
              <Search className="w-5 h-5 text-[#5c5c72] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search materials..."
                className="pl-10 pr-4 py-2 bg-[#1c1c27] border border-[#2a2a3a] text-[#e8e8ed] placeholder:text-[#5c5c72] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7c5cfc]/50 focus:border-[#7c5cfc]"
              />
            </div>
          </div>
        </div>
        <div className="divide-y divide-[#2a2a3a]">
          {isLoading ? (
            <div className="p-6 flex justify-center">
              <Loader2 className="w-8 h-8 text-[#7c5cfc] animate-spin" />
            </div>
          ) : materials.length === 0 ? (
            <div className="p-6 text-center text-[#5c5c72]">
              No materials yet. Upload one above!
            </div>
          ) : (
            materials.map((material) => (
              <div key={material.id} className="p-6 hover:bg-[#1c1c27] transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#7c5cfc]/10 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-[#7c5cfc]" />
                    </div>
                    <div>
                      <p className="font-medium text-[#e8e8ed]">{material.title}</p>
                      <p className="text-sm text-[#5c5c72]">
                        {formatSize(material.size_bytes)} • {new Date(material.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="text-[#7c5cfc] hover:text-[#6a4ce0] flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-[#7c5cfc]/10 transition-colors">
                      View <ChevronRight className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteMaterial(material)}
                      className="text-[#ef4444] hover:text-[#dc2626] flex items-center justify-center p-2 rounded-lg hover:bg-[#ef4444]/10 transition-colors"
                      title="Delete material"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
