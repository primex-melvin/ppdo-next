import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface KPICardsRowProps {
  totalProjects: number;
  ongoing: number;
  completed: number;
  delayed: number;
  accentColor?: string;
}

export function KPICardsRow({
  totalProjects,
  ongoing,
  completed,
  delayed,
  accentColor = "#15803D",
}: KPICardsRowProps) {
  const kpiCards = [
    {
      label: "Total Projects",
      value: totalProjects,
      color: "text-zinc-900 dark:text-zinc-50",
      tooltip: "All projects across all statuses for the selected year",
    },
    {
      label: "Ongoing",
      value: ongoing,
      color: "text-blue-600 dark:text-blue-500",
      tooltip: "Projects currently in progress with status marked as 'ongoing'",
    },
    {
      label: "Completed",
      value: completed,
      color: "text-emerald-600 dark:text-emerald-500",
      tooltip: "Projects that have been successfully completed and marked as 'completed'",
    },
    {
      label: "Delayed",
      value: delayed,
      color: "text-red-600 dark:text-red-500",
      tooltip: "Projects behind schedule with status marked as 'delayed'",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {kpiCards.map((card) => (
        <Tooltip key={card.label} delayDuration={0}>
          <TooltipTrigger asChild>
            <div
              className="group relative bg-white dark:bg-zinc-900 p-5 sm:p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm hover:shadow-md transition-all duration-200 cursor-default"
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 uppercase font-semibold tracking-wide">
                  {card.label}
                </p>
                <Info className="w-3.5 h-3.5 text-zinc-400 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className={`text-3xl sm:text-4xl font-bold ${card.color}`}>
                {card.value}
              </p>
            </div>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="max-w-[200px] text-center"
          >
            {card.tooltip}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
