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

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Study Materials</h1>
          <p className="text-gray-600">Manage and organize your learning resources</p>
        </div>
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
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
        className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="bg-blue-100 rounded-full p-4">
            <Upload className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <p className="text-gray-900 font-medium mb-1">Drop files here or click to browse</p>
            <p className="text-sm text-gray-500">PDF, DOCX, TXT supported (Max 10MB)</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Your Materials ({materials.length})</h2>
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search materials..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {isLoading ? (
            <div className="p-6 flex justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : materials.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No materials yet. Upload one above!
            </div>
          ) : (
            materials.map((material) => (
              <div key={material.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{material.title}</p>
                      <p className="text-sm text-gray-500">
                        {formatSize(material.size_bytes)} • {new Date(material.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
                    View <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
