import { useState } from "react";
import { supabase } from "./supabaseClient";
import { generateStudyPlanItems } from "./revisionPlanner";

export default function RevisionPlannerPage() {
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [topics, setTopics] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{ title: string; date: string }[]>([]);
  const [message, setMessage] = useState("");

  const validatePlanInputs = () => {
    if (!subject.trim()) {
      return "Please enter a subject.";
    }

    if (!startDate || !endDate) {
      return "Please select both a start date and end date.";
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      return "End date cannot be earlier than start date.";
    }

    const diffDays =
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (diffDays < 14) {
      return "Study plans must be at least 2 weeks long.";
    }

    if (diffDays > 28) {
      return "Study plans cannot be longer than 4 weeks.";
    }

    const topicList = topics
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    if (topicList.length === 0) {
      return "Please enter at least one topic.";
    }

    return "";
  };

  const handleGeneratePreview = () => {
    const validationError = validatePlanInputs();

    if (validationError) {
      setMessage(validationError);
      setPreview([]);
      return;
    }

    const topicList = topics
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const items = generateStudyPlanItems({
      startDate,
      endDate,
      priority,
      topics: topicList,
    });

    setPreview(items);
    setMessage("");
  };

  const handleSavePlan = async () => {
    const validationError = validatePlanInputs();

    if (validationError) {
      setMessage(validationError);
      return;
    }

    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) {
      setMessage("You must be logged in.");
      return;
    }

    setLoading(true);

    try {
      const { data: plan, error: planError } = await supabase
        .from("study_plans")
        .insert([
          {
            user_id: auth.user.id,
            subject,
            priority,
            start_date: startDate,
            end_date: endDate,
          },
        ])
        .select()
        .single();

      if (planError) throw planError;

      const tasks = preview.map((item) => ({
        user_id: auth.user.id,
        title: item.title,
        description: `Study topic for ${subject}`,
        priority,
        status: "pending",
        due_date: new Date(item.date).toISOString(),
        study_plan_id: plan.id,
      }));

      const { error: taskError } = await supabase.from("tasks").insert(tasks);
      if (taskError) throw taskError;

      setMessage("Study plan created.");
      setPreview([]);
      setSubject("");
      setPriority("medium");
      setStartDate("");
      setEndDate("");
      setTopics("");
      window.location.reload();
    } catch (err: any) {
      setMessage(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-[#e8e8ed]">Study Plan Generator</h1>
        <p className="text-[#8b8b9e]">
          Automatically generate a structured study plan.
        </p>
      </div>

      <div className="bg-[#16161e] p-6 rounded-xl border border-[#2a2a3a] space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#8b8b9e] mb-2">
            Subject
          </label>
          <input
            placeholder="e.g. Operating Systems"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-[#1c1c27] border border-[#2a2a3a] text-[#e8e8ed] placeholder:text-[#5c5c72] p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7c5cfc]/50 focus:border-[#7c5cfc]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#8b8b9e] mb-2">
            Priority
          </label>
          <select
            value={priority}
            onChange={(e) =>
              setPriority(e.target.value as "low" | "medium" | "high")
            }
            className="w-full bg-[#1c1c27] border border-[#2a2a3a] text-[#e8e8ed] p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7c5cfc]/50 focus:border-[#7c5cfc]"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
        </div>

        <div className="flex gap-4">
          <div className="w-full">
            <label className="block text-sm font-medium text-[#8b8b9e] mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-[#1c1c27] border border-[#2a2a3a] text-[#e8e8ed] p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7c5cfc]/50 focus:border-[#7c5cfc]"
            />
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium text-[#8b8b9e] mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-[#1c1c27] border border-[#2a2a3a] text-[#e8e8ed] p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7c5cfc]/50 focus:border-[#7c5cfc]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#8b8b9e] mb-2">
            Topics (comma separated)
          </label>
          <input
            placeholder="Processes, Threads, Scheduling, Memory, Deadlocks"
            value={topics}
            onChange={(e) => setTopics(e.target.value)}
            className="w-full bg-[#1c1c27] border border-[#2a2a3a] text-[#e8e8ed] placeholder:text-[#5c5c72] p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7c5cfc]/50 focus:border-[#7c5cfc]"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleGeneratePreview}
            className="bg-[#1c1c27] hover:bg-[#222233] text-[#e8e8ed] border border-[#2a2a3a] px-4 py-2 rounded-lg transition-colors"
          >
            Generate Preview
          </button>

          <button
            onClick={handleSavePlan}
            disabled={preview.length === 0 || loading}
            className="bg-[#7c5cfc] hover:bg-[#6a4ce0] text-white px-4 py-2 rounded-lg disabled:opacity-60 transition-colors"
          >
            {loading ? "Saving..." : "Save Plan"}
          </button>
        </div>

        {message && <p className="text-sm text-[#8b8b9e]">{message}</p>}
      </div>

      {preview.length > 0 && (
        <div className="bg-[#16161e] p-6 rounded-xl border border-[#2a2a3a]">
          <h2 className="text-lg font-semibold text-[#e8e8ed] mb-3">Generated Plan</h2>

          <div className="space-y-2">
            {preview.map((item, i) => (
              <div key={i} className="p-2 bg-[#1c1c27] border border-[#2a2a3a] rounded-lg">
                <div className="text-sm font-medium text-[#e8e8ed]">{item.title}</div>
                <div className="text-xs text-[#5c5c72]">{item.date}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
