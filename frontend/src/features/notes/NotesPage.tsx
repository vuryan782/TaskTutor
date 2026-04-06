import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Trash2, Copy, Download, FileText } from "lucide-react";

interface SavedNote {
  id: number;
  title: string;
  text: string;
  date: string;
}

// Extend window to include webkit prefixed SpeechRecognition
const SpeechRecognitionAPI =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export default function NotesPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [liveText, setLiveText] = useState("");
  const [finalText, setFinalText] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([]);
  const [supported, setSupported] = useState(true);
  const [copyMsg, setCopyMsg] = useState("");

  const recognitionRef = useRef<any>(null);
  const finalTextRef = useRef("");

  useEffect(() => {
    if (!SpeechRecognitionAPI) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let interim = "";
      let newFinal = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          newFinal += transcript + " ";
        } else {
          interim += transcript;
        }
      }
      if (newFinal) {
        finalTextRef.current += newFinal;
        setFinalText(finalTextRef.current);
      }
      setLiveText(finalTextRef.current + interim);
    };

    recognition.onerror = (event: any) => {
      if (event.error !== "no-speech") {
        setIsRecording(false);
      }
    };

    recognition.onend = () => {
      // Auto-restart if still recording (browser stops after silence)
      if (recognitionRef.current?._shouldRestart) {
        recognition.start();
      } else {
        setIsRecording(false);
      }
    };

    recognitionRef.current = recognition;
  }, []);

  const startRecording = () => {
    if (!recognitionRef.current) return;
    finalTextRef.current = finalText;
    recognitionRef.current._shouldRestart = true;
    recognitionRef.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current._shouldRestart = false;
    recognitionRef.current.stop();
    setIsRecording(false);
  };

  const saveNote = () => {
    const text = finalText.trim();
    if (!text) return;
    const note: SavedNote = {
      id: Date.now(),
      title: noteTitle.trim() || `Note ${new Date().toLocaleTimeString()}`,
      text,
      date: new Date().toLocaleString(),
    };
    setSavedNotes((prev) => [note, ...prev]);
    setFinalText("");
    setLiveText("");
    setNoteTitle("");
    finalTextRef.current = "";
  };

  const deleteNote = (id: number) => {
    setSavedNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const copyNote = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyMsg("Copied!");
    setTimeout(() => setCopyMsg(""), 2000);
  };

  const downloadNote = (note: SavedNote) => {
    const blob = new Blob([`${note.title}\n${note.date}\n\n${note.text}`], {
      type: "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${note.title.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearCurrent = () => {
    if (isRecording) stopRecording();
    setFinalText("");
    setLiveText("");
    setNoteTitle("");
    finalTextRef.current = "";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Voice Note Taker</h1>
        <p className="text-gray-600">Record your voice and convert it to text notes instantly</p>
      </div>

      {!supported && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          Your browser does not support speech recognition. Please use Chrome or Edge.
        </div>
      )}

      {/* Recorder */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Note title (optional)"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Live transcript area */}
        <div
          className={`min-h-[140px] rounded-lg border-2 p-4 text-gray-800 text-sm leading-relaxed whitespace-pre-wrap transition-colors ${
            isRecording ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"
          }`}
        >
          {liveText || (
            <span className="text-gray-400 italic">
              {isRecording ? "Listening…" : "Press Record to start speaking"}
            </span>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {!isRecording ? (
            <button
              onClick={startRecording}
              disabled={!supported}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
            >
              <Mic className="w-5 h-5" />
              Record
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-800 text-white px-5 py-2.5 rounded-lg font-medium transition-colors animate-pulse"
            >
              <MicOff className="w-5 h-5" />
              Stop
            </button>
          )}

          <button
            onClick={saveNote}
            disabled={!finalText.trim()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
          >
            <FileText className="w-5 h-5" />
            Save Note
          </button>

          <button
            onClick={() => copyNote(liveText)}
            disabled={!liveText}
            className="flex items-center gap-2 border border-gray-300 hover:bg-gray-100 disabled:opacity-40 text-gray-700 px-4 py-2.5 rounded-lg text-sm transition-colors"
          >
            <Copy className="w-4 h-4" />
            {copyMsg || "Copy"}
          </button>

          <button
            onClick={clearCurrent}
            disabled={!liveText}
            className="flex items-center gap-2 border border-gray-300 hover:bg-gray-100 disabled:opacity-40 text-gray-700 px-4 py-2.5 rounded-lg text-sm transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>

      {/* Saved notes */}
      {savedNotes.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Saved Notes ({savedNotes.length})</h2>
          {savedNotes.map((note) => (
            <div key={note.id} className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{note.title}</h3>
                  <p className="text-xs text-gray-500">{note.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyNote(note.text)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Copy"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => downloadNote(note)}
                    className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{note.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
