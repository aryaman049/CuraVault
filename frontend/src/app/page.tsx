"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Plus, Activity, Stethoscope, Loader2, CheckCircle2, Clock, FileSearch, Pill, ClipboardList } from "lucide-react";

export default function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/documents`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setDocuments(data.data.documents.reverse());
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getCategoryMeta = (category: string) => {
    const map: Record<string, { icon: any; color: string; bg: string; border: string }> = {
      lab_report: { icon: <Activity className="w-4 h-4" />, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
      prescription: { icon: <Pill className="w-4 h-4" />, color: "text-teal-400", bg: "bg-teal-500/10", border: "border-teal-500/20" },
      discharge_summary: { icon: <ClipboardList className="w-4 h-4" />, color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
      scan_report: { icon: <FileSearch className="w-4 h-4" />, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
      other: { icon: <FileText className="w-4 h-4" />, color: "text-[#8494b0]", bg: "bg-[#283556]/50", border: "border-[#283556]" },
    };
    return map[category] || map.other;
  };

  const stats = [
    { label: "Total Records", value: documents.length, icon: <FileText className="w-4 h-4 text-cyan-400" /> },
    { label: "Processed", value: documents.filter((d: any) => d.status === "completed").length, icon: <CheckCircle2 className="w-4 h-4 text-teal-400" /> },
    { label: "Processing", value: documents.filter((d: any) => d.status === "processing").length, icon: <Loader2 className="w-4 h-4 text-amber-400" /> },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 pt-10">
      {/* Header */}
      <div className="flex justify-between items-start mb-10 animate-slide-up">
        <div>
          <p className="text-[#5a6d8f] text-xs font-medium uppercase tracking-widest mb-1">Dashboard</p>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Medical Timeline</h1>
        </div>
        <Link href="/upload" className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-[#0a0e1a] px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/20">
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Upload Record
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-10 animate-slide-up delay-1">
        {stats.map((s, i) => (
          <div key={i} className="bg-[#151d35] border border-[#1c2744] rounded-2xl p-5 hover:border-[#283556] transition-colors">
            <div className="flex items-center gap-2 mb-3">
              {s.icon}
              <span className="text-[10px] uppercase tracking-widest font-semibold text-[#5a6d8f]">{s.label}</span>
            </div>
            <div className="text-3xl font-semibold text-white">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Document List */}
      {loading ? (
        <div className="flex flex-col items-center py-20">
          <div className="relative w-12 h-12 mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-[#1c2744]"></div>
            <div className="absolute inset-0 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-[#5a6d8f] text-sm">Loading records...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-[#151d35] border border-[#1c2744] rounded-3xl p-16 text-center animate-slide-up delay-2">
          <div className="w-16 h-16 rounded-2xl bg-[#1c2744] border border-[#283556] flex items-center justify-center mx-auto mb-5">
            <FileText className="w-7 h-7 text-[#5a6d8f]" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No records yet</h3>
          <p className="text-[#5a6d8f] text-sm max-w-sm mx-auto">Upload your first medical document to see AI-powered extraction in action.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc: any, index: number) => {
            const meta = getCategoryMeta(doc.category);
            return (
              <div
                key={doc.documentId}
                className="bg-[#151d35] border border-[#1c2744] rounded-2xl p-5 hover:border-[#283556] transition-all group animate-slide-up"
                style={{ animationDelay: `${(index + 2) * 50}ms` }}
              >
                <div className="flex items-start gap-4">
                  {/* Category Icon */}
                  <div className={`p-2.5 rounded-xl ${meta.bg} border ${meta.border}`}>
                    <span className={meta.color}>{meta.icon}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Title Row */}
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-semibold text-white capitalize">{doc.category.replace(/_/g, ' ')}</h3>
                      <div className="flex items-center gap-2">
                        {doc.status === 'processing' && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />}
                        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          doc.status === 'completed'
                            ? 'text-teal-400 bg-teal-500/10 border-teal-500/20'
                            : doc.status === 'failed'
                            ? 'text-red-400 bg-red-500/10 border-red-500/20'
                            : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                        }`}>
                          {doc.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-[#5a6d8f]">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(doc.createdAt).toLocaleDateString()}</span>
                    </div>

                    {/* Extracted Entities */}
                    {doc.entities && (
                      <div className="mt-4 pt-4 border-t border-[#1c2744]">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
                          <InfoCell label="Provider" value={doc.entities.provider?.name} />
                          <InfoCell label="Doctor" value={doc.entities.provider?.doctor} />
                          <InfoCell label="Date" value={doc.entities.issuedDate} />
                        </div>

                        {doc.entities.findings && doc.entities.findings.length > 0 && (
                          <div>
                            <span className="text-[10px] uppercase tracking-widest font-semibold text-[#5a6d8f] block mb-2">Findings</span>
                            <div className="flex gap-2 flex-wrap">
                              {doc.entities.findings.map((f: any, i: number) => (
                                <div key={i} className="bg-[#0a0e1a] border border-[#1c2744] px-3 py-1.5 rounded-lg flex items-baseline gap-2">
                                  <span className="text-xs text-[#8494b0]">{f.test}</span>
                                  <span className="text-sm font-semibold text-cyan-400">{f.value}</span>
                                  <span className="text-[10px] text-[#5a6d8f]">{f.unit}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <span className="text-[10px] uppercase tracking-widest font-semibold text-[#5a6d8f] block mb-0.5">{label}</span>
      <span className="text-sm font-medium text-[#b3bdd0]">{value || "—"}</span>
    </div>
  );
}
