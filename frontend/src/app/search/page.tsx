"use client";
import { useState } from "react";
import { Search, Sparkles, Target, ArrowRight, FileText } from "lucide-react";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: any) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (data.success) setResults(data.data.results);
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-6 pt-16 animate-slide-up">
      <div className="text-center mb-10">
        <p className="text-[#5a6d8f] text-xs font-medium uppercase tracking-widest mb-1">AI-Powered</p>
        <h1 className="text-2xl font-semibold tracking-tight text-white mb-2">Search Medical Records</h1>
        <p className="text-[#5a6d8f] text-sm">Use natural language to find information across your entire history.</p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative mb-10">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-[#5a6d8f]" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. hemoglobin levels, diabetes medications, blood tests 2025..."
          className="block w-full pl-11 pr-24 py-4 bg-[#151d35] border border-[#1c2744] rounded-2xl text-sm text-white placeholder-[#5a6d8f] focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 outline-none transition-all"
        />
        <button
          type="submit"
          className="absolute right-2 top-2 bottom-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-[#0a0e1a] text-xs font-semibold px-4 rounded-xl transition-opacity hover:opacity-90 flex items-center gap-1.5"
        >
          Search <ArrowRight className="w-3 h-3" />
        </button>
      </form>

      {/* Suggestions */}
      {!searched && (
        <div className="animate-slide-up delay-1">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-[#5a6d8f] mb-3">Try searching</p>
          <div className="flex flex-wrap gap-2">
            {["hemoglobin levels", "blood pressure history", "medications prescribed", "lab results"].map((s) => (
              <button
                key={s}
                onClick={() => { setQuery(s); }}
                className="text-xs text-[#8494b0] bg-[#151d35] border border-[#1c2744] px-3 py-1.5 rounded-lg hover:border-[#283556] hover:text-white transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center py-16 animate-fade-in">
          <div className="flex items-center gap-2 text-cyan-400">
            <Sparkles className="w-4 h-4 animate-pulse-soft" />
            <span className="text-sm font-medium">Searching with AI...</span>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="space-y-3">
        {results.map((r: any, i: number) => (
          <div
            key={i}
            className="bg-[#151d35] border border-[#1c2744] p-5 rounded-2xl hover:border-[#283556] transition-all animate-slide-up"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-semibold text-white flex items-center gap-2 capitalize">
                <Target className="w-4 h-4 text-cyan-400" />
                {r.category.replace(/_/g, " ")}
              </span>
              <span className="text-[10px] font-semibold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full">
                {(r.score * 100).toFixed(0)}% match
              </span>
            </div>
            <p className="text-sm text-[#8494b0] leading-relaxed bg-[#0a0e1a] p-4 rounded-xl border border-[#1c2744]">
              &ldquo;{r.snippet}&rdquo;
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
