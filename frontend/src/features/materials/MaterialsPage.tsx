import { BookOpen, ChevronRight, Search, Upload } from "lucide-react";

export default function MaterialsPage() {
  const materials = [
    { name: "Biology_Notes.pdf", size: "2.4 MB", date: "Today", type: "pdf" },
    { name: "Chemistry_Ch5.docx", size: "1.8 MB", date: "Yesterday", type: "docx" },
    { name: "Physics_Formulas.txt", size: "45 KB", date: "2 days ago", type: "txt" },
    { name: "Math_Problems.pdf", size: "3.1 MB", date: "3 days ago", type: "pdf" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Study Materials</h1>
          <p className="text-gray-600">Manage and organize your learning resources</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors">
          <Upload className="w-5 h-5" />
          Upload Files
        </button>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
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
          {materials.map((material, index) => (
            <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{material.name}</p>
                    <p className="text-sm text-gray-500">
                      {material.size} • {material.date}
                    </p>
                  </div>
                </div>
                <button className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  View <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
