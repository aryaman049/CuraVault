"use client";
import { useEffect, useState } from "react";
import { Shield, Clock, FileText, Activity, Pill, ClipboardList, FileSearch, Lock } from "lucide-react";

export default function SharedPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/documents`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // For demo purposes, we just show completed documents to the doctor
          setDocuments(data.data.documents.filter((d: any) => d.status === "completed").reverse());
        }
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

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 animate-slide-up pb-20">
      {/* Trust Header */}
      <div className="bg-[#151d35] border border-[#1c2744] rounded-2xl p-6 mb-8 text-center sm:text-left flex flex-col sm:flex-row items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
          <Shield className="w-8 h-8 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white mb-2">Secure Provider Access</h1>
          <p className="text-[#5a6d8f] text-xs sm:text-sm">
            You have been granted temporary access to review this patient's medical history. 
            This secure session is actively monitored.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Shared Records</h2>
        <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" /> Expires in 30m
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin"></div>
        </div>
      ) : documents.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-[#283556] rounded-3xl bg-[#151d35]/50 animate-slide-up delay-1">
          <Lock className="w-10 h-10 text-[#283556] mx-auto mb-3" />
          <p className="text-[#5a6d8f] text-sm">No records available for this session.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {documents.map((doc: any, index: number) => {
            const meta = getCategoryMeta(doc.category);
            return (
              <div
                key={doc.documentId}
                className="bg-[#151d35] border border-[#1c2744] rounded-2xl p-5 animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-xl ${meta.bg} border ${meta.border} shrink-0`}>
                    <span className={meta.color}>{meta.icon}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-white capitalize">{doc.category.replace(/_/g, ' ')}</h3>
                      <span className="text-xs text-[#5a6d8f]">{new Date(doc.createdAt).toLocaleDateString()}</span>
                    </div>

                    {doc.entities && (
                      <div className="grid grid-cols-2 gap-4 text-sm mt-3 pt-3 border-t border-[#1c2744]">
                        <div>
                          <span className="text-[10px] uppercase tracking-widest font-semibold text-[#5a6d8f] block mb-0.5">Provider</span>
                          <span className="text-sm font-medium text-[#b3bdd0] truncate block">{doc.entities.provider?.name || "—"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase tracking-widest font-semibold text-[#5a6d8f] block mb-0.5">Doctor</span>
                          <span className="text-sm font-medium text-[#b3bdd0] truncate block">{doc.entities.provider?.doctor || "—"}</span>
                        </div>

                        {doc.entities.findings && doc.entities.findings.length > 0 && (
                          <div className="col-span-2 mt-2">
                            <span className="text-[10px] uppercase tracking-widest font-semibold text-[#5a6d8f] block mb-2">Key Findings</span>
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
