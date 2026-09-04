"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Loader2, FileText, CheckCircle2, Shield, Cpu, Database, ScanSearch } from "lucide-react";

const STEPS = [
  { label: "Upload", desc: "Secure file transfer", icon: <UploadCloud className="w-4 h-4" /> },
  { label: "Storage", desc: "Encrypted vault", icon: <Database className="w-4 h-4" /> },
  { label: "OCR", desc: "Text extraction", icon: <ScanSearch className="w-4 h-4" /> },
  { label: "AI Extract", desc: "Entity recognition", icon: <Cpu className="w-4 h-4" /> },
  { label: "Validated", desc: "Schema verified", icon: <Shield className="w-4 h-4" /> },
];

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"" | "uploading" | "processing" | "completed">("");
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();

  const handleUpload = async () => {
    if (!file) return;
    setStatus("uploading");
    setCurrentStep(0);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", "lab_report");

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/documents`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (data.success) {
      setCurrentStep(1);
      pollStatus(data.data.documentId);
    }
  };

  const pollStatus = (docId: string) => {
    setStatus("processing");
    let step = 1;
    const stepInterval = setInterval(() => {
      if (step < 4) { step++; setCurrentStep(step); }
    }, 800);

    const interval = setInterval(async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/documents/${docId}`);
      const data = await res.json();
      if (data.success && data.data.status === "completed") {
        clearInterval(interval);
        clearInterval(stepInterval);
        setCurrentStep(4);
        setStatus("completed");
        setTimeout(() => router.push("/"), 1200);
      }
    }, 1000);
  };

  return (
    <div className="max-w-2xl mx-auto px-6 pt-16 animate-slide-up">
      <div className="text-center mb-10">
        <p className="text-[#5a6d8f] text-xs font-medium uppercase tracking-widest mb-1">Document Ingestion</p>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Upload Medical Record</h1>
      </div>

      <div className="bg-[#151d35] border border-[#1c2744] rounded-3xl p-8">
        {/* Upload Zone */}
        <label className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-2xl cursor-pointer transition-all mb-6 ${
          file
            ? "border-cyan-500/40 bg-cyan-500/5"
            : "border-[#283556] bg-[#0a0e1a]/50 hover:border-[#3d4f73] hover:bg-[#1c2744]/30"
        }`}>
          <div className="flex flex-col items-center justify-center">
            {file ? (
              <>
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-3">
                  <FileText className="w-5 h-5 text-cyan-400" />
                </div>
                <p className="text-sm font-medium text-white">{file.name}</p>
                <p className="text-xs text-[#5a6d8f] mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-xl bg-[#1c2744] border border-[#283556] flex items-center justify-center mb-3 group-hover:border-[#3d4f73] transition-colors">
                  <UploadCloud className="w-5 h-5 text-[#5a6d8f]" />
                </div>
                <p className="text-sm font-medium text-[#8494b0]">Click or drag file to upload</p>
                <p className="text-xs text-[#5a6d8f] mt-1">PDF, PNG, JPG up to 10MB</p>
              </>
            )}
          </div>
          <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </label>

        {/* Processing Pipeline Visualization */}
        {status && (
          <div className="mb-6 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              {STEPS.map((step, i) => (
                <div key={i} className="flex flex-col items-center flex-1">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 border transition-all duration-300 ${
                    i <= currentStep
                      ? i === currentStep && status !== 'completed'
                        ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                        : "bg-teal-500/10 border-teal-500/30 text-teal-400"
                      : "bg-[#1c2744] border-[#283556] text-[#5a6d8f]"
                  }`}>
                    {i < currentStep ? <CheckCircle2 className="w-4 h-4" /> : step.icon}
                  </div>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                    i <= currentStep ? "text-white" : "text-[#5a6d8f]"
                  }`}>{step.label}</span>
                  <span className="text-[9px] text-[#5a6d8f] hidden sm:block">{step.desc}</span>
                </div>
              ))}
            </div>
            {/* Progress bar */}
            <div className="h-0.5 bg-[#1c2744] rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleUpload}
          disabled={!file || status !== ""}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg bg-gradient-to-r from-cyan-500 to-teal-500 text-[#0a0e1a] hover:opacity-90 shadow-cyan-500/20"
        >
          {status === "" && "Process Document"}
          {status === "uploading" && <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>}
          {status === "processing" && <><Loader2 className="w-4 h-4 animate-spin" /> AI Processing...</>}
          {status === "completed" && <><CheckCircle2 className="w-4 h-4" /> Complete</>}
        </button>
      </div>
    </div>
  );
}
