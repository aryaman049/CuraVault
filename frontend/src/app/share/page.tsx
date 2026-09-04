"use client";
import { useEffect, useState } from "react";
import { Shield, Copy, Trash2, CheckCircle2, Plus, Lock, Clock } from "lucide-react";
import QRCode from "react-qr-code";

export default function SharePage() {
  const [sessions, setSessions] = useState([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [selectedCats, setSelectedCats] = useState<string[]>(["lab_report", "prescription"]);

  const CATEGORIES = ["lab_report", "prescription", "discharge_summary", "scan_report", "other"];

  const fetchSessions = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/share/sessions`);
    const data = await res.json();
    if (data.success) setSessions(data.data.sessions);
  };

  useEffect(() => { fetchSessions(); }, []);

  const createShare = async () => {
    setCreating(true);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/share/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ allowedCategories: selectedCats }),
    });
    const data = await res.json();
    if (data.success) fetchSessions();
    setCreating(false);
  };

  const deleteShare = async (id: string) => {
    await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/share/sessions/${id}`, { method: "DELETE" });
    fetchSessions();
  };

  const copyToClipboard = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleCat = (c: string) => {
    setSelectedCats((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 pt-10 animate-slide-up">
      {/* Header */}
      <div className="mb-10">
        <p className="text-[#5a6d8f] text-xs font-medium uppercase tracking-widest mb-1">Access Control</p>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Temporary Access Tokens</h1>
      </div>

      {/* Create Section */}
      <div className="bg-[#151d35] border border-[#1c2744] rounded-3xl p-6 mb-10 animate-slide-up delay-1">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              Generate New Token
            </h2>
            <p className="text-sm text-[#5a6d8f] mb-4">Select categories to share. Token expires in 30 minutes.</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => toggleCat(c)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all capitalize ${
                    selectedCats.includes(c)
                      ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                      : "bg-[#1c2744] border-[#283556] text-[#5a6d8f] hover:text-[#8494b0]"
                  }`}
                >
                  {c.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={createShare}
            disabled={creating || selectedCats.length === 0}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-[#0a0e1a] px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/20 disabled:opacity-40 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Generate
          </button>
        </div>
      </div>

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sessions.map((s: any, index: number) => (
          <div
            key={s.sessionId}
            className="bg-[#151d35] border border-[#1c2744] rounded-3xl overflow-hidden hover:border-[#283556] transition-all animate-slide-up"
            style={{ animationDelay: `${(index + 2) * 50}ms` }}
          >
            {/* QR Code Section */}
            <div className="p-8 flex flex-col items-center border-b border-[#1c2744] bg-[#0f1629] relative">
              <button
                onClick={() => deleteShare(s.sessionId)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-[#151d35] border border-[#1c2744] text-[#5a6d8f] hover:text-red-400 hover:border-red-500/30 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="bg-white p-3 rounded-2xl mb-5">
                <QRCode value={s.shareUrl} size={120} style={{ height: "auto", width: "100%" }} />
              </div>

              <div className="flex items-center gap-2 bg-[#151d35] border border-[#1c2744] px-3 py-2 rounded-xl w-full">
                <Lock className="w-3 h-3 text-[#5a6d8f] shrink-0" />
                <span className="text-[11px] font-mono text-[#5a6d8f] truncate flex-1">{s.shareUrl}</span>
                <button
                  onClick={() => copyToClipboard(s.shareUrl, s.sessionId)}
                  className="text-[#5a6d8f] hover:text-cyan-400 transition-colors shrink-0"
                >
                  {copiedId === s.sessionId ? (
                    <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Info Section */}
            <div className="p-5 space-y-4">
              <div>
                <span className="text-[10px] uppercase tracking-widest font-semibold text-[#5a6d8f] block mb-2">Permissions</span>
                <div className="flex gap-1.5 flex-wrap">
                  {s.allowedCategories.map((c: string) => (
                    <span key={c} className="text-[10px] font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded capitalize">
                      {c.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest font-semibold text-[#5a6d8f]">Expires</span>
                <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3" /> 30 min
                </span>
              </div>
            </div>
          </div>
        ))}

        {sessions.length === 0 && (
          <div className="col-span-full py-20 text-center border border-dashed border-[#283556] rounded-3xl bg-[#151d35]/50 animate-slide-up delay-2">
            <Lock className="w-10 h-10 text-[#283556] mx-auto mb-3" />
            <p className="text-[#5a6d8f] text-sm">No active share sessions. Your vault is locked.</p>
          </div>
        )}
      </div>
    </div>
  );
}
