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
        <h1 className="text-3xl font-bold text-[#e8e8ed] mb-2">Voice Note Taker</h1>
        <p className="text-[#8b8b9e]">Record your voice and convert it to text notes instantly</p>
      </div>

      {!supported && (
        <div className="bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-xl p-4 text-[#ef4444]">
          Your browser does not support speech recognition. Please use Chrome or Edge.
        </div>
      )}

      {/* Recorder */}
      <div className="bg-[#16161e] rounded-xl border border-[#2a2a3a] p-6 space-y-4">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Note title (optional)"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            className="flex-1 bg-[#1c1c27] border border-[#2a2a3a] text-[#e8e8ed] placeholder:text-[#5c5c72] rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c5cfc]/50 focus:border-[#7c5cfc]"
          />
        </div>

        {/* Live transcript area */}
        <div
          className={`min-h-[140px] rounded-lg border-2 p-4 text-[#e8e8ed] text-sm leading-relaxed whitespace-pre-wrap transition-colors ${
            isRecording ? "border-[#ef4444]/50 bg-[#ef4444]/5" : "border-[#2a2a3a] bg-[#1c1c27]"
          }`}
        >
          {liveText || (
            <span className="text-[#5c5c72] italic">
              {isRecording ? "Listening..." : "Press Record to start speaking"}
            </span>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {!isRecording ? (
            <button
              onClick={startRecording}
              disabled={!supported}
              className="flex items-center gap-2 bg-[#ef4444] hover:bg-[#dc2626] disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
            >
              <Mic className="w-5 h-5" />
              Record
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 bg-[#5c5c72] hover:bg-[#6b6b82] text-white px-5 py-2.5 rounded-lg font-medium transition-colors animate-pulse"
            >
              <MicOff className="w-5 h-5" />
              Stop
            </button>
          )}

          <button
            onClick={saveNote}
            disabled={!finalText.trim()}
            className="flex items-center gap-2 bg-[#7c5cfc] hover:bg-[#6a4ce0] disabled:opacity-40 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
          >
            <FileText className="w-5 h-5" />
            Save Note
          </button>

          <button
            onClick={() => copyNote(liveText)}
            disabled={!liveText}
            className="flex items-center gap-2 bg-[#1c1c27] hover:bg-[#222233] border border-[#2a2a3a] disabled:opacity-40 text-[#e8e8ed] px-4 py-2.5 rounded-lg text-sm transition-colors"
          >
            <Copy className="w-4 h-4" />
            {copyMsg || "Copy"}
          </button>

          <button
            onClick={clearCurrent}
            disabled={!liveText}
            className="flex items-center gap-2 bg-[#1c1c27] hover:bg-[#222233] border border-[#2a2a3a] disabled:opacity-40 text-[#e8e8ed] px-4 py-2.5 rounded-lg text-sm transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>

      {/* Saved notes */}
      {savedNotes.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-[#e8e8ed]">Saved Notes ({savedNotes.length})</h2>
          {savedNotes.map((note) => (
            <div key={note.id} className="bg-[#16161e] rounded-xl border border-[#2a2a3a] p-5 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-[#e8e8ed]">{note.title}</h3>
                  <p className="text-xs text-[#5c5c72]">{note.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyNote(note.text)}
                    className="p-2 text-[#5c5c72] hover:text-[#60a5fa] hover:bg-[#60a5fa]/10 rounded-lg transition-colors"
                    title="Copy"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => downloadNote(note)}
                    className="p-2 text-[#5c5c72] hover:text-[#4ade80] hover:bg-[#4ade80]/10 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="p-2 text-[#5c5c72] hover:text-[#ef4444] hover:bg-[#ef4444]/10 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-[#8b8b9e] whitespace-pre-wrap leading-relaxed">{note.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
