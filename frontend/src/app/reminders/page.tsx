"use client";
import { useEffect, useState } from "react";
import { Bell, Calendar, ArrowRight, AlertCircle, Clock } from "lucide-react";

export default function RemindersPage() {
  const [reminders, setReminders] = useState([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reminders`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setReminders(data.data.reminders);
      });
  }, []);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "overdue":
        return { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", icon: <AlertCircle className="w-3.5 h-3.5" /> };
      case "upcoming":
        return { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: <Clock className="w-3.5 h-3.5" /> };
      default:
        return { color: "text-teal-400", bg: "bg-teal-500/10", border: "border-teal-500/20", icon: <Bell className="w-3.5 h-3.5" /> };
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 pt-16 animate-slide-up">
      <div className="text-center mb-10">
        <p className="text-[#5a6d8f] text-xs font-medium uppercase tracking-widest mb-1">AI-Generated</p>
        <h1 className="text-2xl font-semibold tracking-tight text-white mb-2">Action Items</h1>
        <p className="text-[#5a6d8f] text-sm">Follow-ups and tasks automatically detected from your documents.</p>
      </div>

      <div className="space-y-3">
        {reminders.map((r: any, i: number) => {
          const statusStyle = getStatusStyle(r.status);
          return (
            <div
              key={r.reminderId}
              className="bg-[#151d35] border border-[#1c2744] p-5 rounded-2xl hover:border-[#283556] transition-all flex items-center gap-4 group animate-slide-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {/* Status Indicator */}
              <div className={`p-2.5 rounded-xl ${statusStyle.bg} border ${statusStyle.border}`}>
                <span className={statusStyle.color}>{statusStyle.icon}</span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-white truncate pr-4">{r.note}</h3>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border whitespace-nowrap ${statusStyle.color} ${statusStyle.bg} ${statusStyle.border}`}>
                    {r.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-[#5a6d8f]">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Due: {r.dueDate}
                  </span>
                  <span className="capitalize">{r.type.replace(/_/g, " ")}</span>
                </div>
              </div>

              {/* Arrow */}
              <ArrowRight className="w-4 h-4 text-[#283556] group-hover:text-cyan-400 transition-colors shrink-0" />
            </div>
          );
        })}

        {reminders.length === 0 && (
          <div className="py-20 text-center border border-dashed border-[#283556] rounded-3xl bg-[#151d35]/50 animate-slide-up delay-1">
            <Bell className="w-10 h-10 text-[#283556] mx-auto mb-3" />
            <p className="text-[#5a6d8f] text-sm">No action items detected yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
