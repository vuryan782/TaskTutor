export function generateStudyPlanItems({
  startDate,
  endDate,
  priority,
  topics,
}: {
  startDate: string;
  endDate: string;
  priority: "low" | "medium" | "high";
  topics: string[];
}) {
  const items: { title: string; date: string }[] = [];

  const start = new Date(startDate);
  const end = new Date(endDate);

  const totalDays =
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  let step = 1;

  if (priority === "low") step = 2;
  if (priority === "medium") step = 1;
  if (priority === "high") step = 1;

  let current = new Date(start);
  let topicIndex = 0;

  for (let i = 0; i < totalDays && topicIndex < topics.length; i += step) {
    items.push({
      title: topics[topicIndex],
      date: current.toISOString().split("T")[0],
    });

    topicIndex++;
    current.setDate(current.getDate() + step);
  }

  items.push({
    title: "Final Review",
    date: end.toISOString().split("T")[0],
  });

  return items;
}