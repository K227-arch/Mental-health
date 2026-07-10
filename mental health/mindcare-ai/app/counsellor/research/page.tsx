"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function ResearchInsightsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/research")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)] text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin text-[24px] mr-2">progress_activity</span>
        Loading research data...
      </div>
    );
  }

  if (!data) return <div className="p-8 text-center text-on-surface-variant">No research data available.</div>;

  const severityColors = ["#4caf50", "#8bc34a", "#ff9800", "#f44336", "#9c27b0"];
  const severityData = Object.entries(data.phq9Data.severityDistribution).map(([key, value], i) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1"),
    value: value as number,
    color: severityColors[i],
  }));

  const triggerData = data.triggers.topCauses.slice(0, 8);
  const featureData = data.aiSystemPreferences.featureImportance.slice(0, 10).map((f: any) => ({
    name: f.feature.length > 25 ? f.feature.slice(0, 25) + "..." : f.feature,
    rating: f.avgRating,
    important: f.percentVeryImportant,
  }));

  return (
    <div className="p-4 md:p-8 max-w-[1200px] mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-on-surface">Research Insights</h1>
        <p className="text-on-surface-variant mt-1">
          Data from {data.meta.totalResponses} MUST student survey responses ({data.meta.collectionPeriod})
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <div className="text-xs text-on-surface-variant font-medium mb-1">Total Responses</div>
          <div className="text-3xl font-black text-primary">{data.meta.totalResponses}</div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <div className="text-xs text-on-surface-variant font-medium mb-1">Avg PHQ-9 Score</div>
          <div className="text-3xl font-black text-error">{data.phq9Data.averageScore}</div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <div className="text-xs text-on-surface-variant font-medium mb-1">Suffer in Silence</div>
          <div className="text-3xl font-black text-on-surface">{data.awareness.studentsSufferInSilence}%</div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <div className="text-xs text-on-surface-variant font-medium mb-1">Would Use AI Tool</div>
          <div className="text-3xl font-black text-secondary">{data.technologyAcceptance.willingToUseAIChatbot}%</div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PHQ-9 Severity Distribution */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">donut_large</span>
            PHQ-9 Severity Distribution
          </h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={severityData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {severityData.map((entry: any, index: number) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Depression Triggers */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-error text-[18px]">warning</span>
            Top Depression Triggers
          </h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={triggerData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#c1c7cf40" />
                <XAxis type="number" tick={{ fontSize: 10 }} unit="%" />
                <YAxis dataKey="cause" type="category" tick={{ fontSize: 9 }} width={100} />
                <Tooltip />
                <Bar dataKey="percentage" fill="#c2185b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Feature Preferences */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[18px]">smart_toy</span>
            AI System Feature Preferences
          </h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#c1c7cf40" />
                <XAxis dataKey="name" tick={{ fontSize: 8 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} unit="%" />
                <Tooltip />
                <Bar dataKey="important" fill="#006a64" radius={[4, 4, 0, 0]} name="% Very Important" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Barriers to Seeking Help */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">block</span>
            Barriers to Seeking Help
          </h3>
          <div className="space-y-2">
            {data.barriers.reasonsNotSeeking.slice(0, 7).map((b: any) => (
              <div key={b.reason} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-on-surface font-medium">{b.reason}</span>
                    <span className="text-xs text-on-surface-variant">{b.percentage}%</span>
                  </div>
                  <div className="w-full bg-surface-container-high rounded-full h-2">
                    <div className="bg-primary rounded-full h-2" style={{ width: `${b.percentage}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Qualitative Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Experiences */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">format_quote</span>
            Student Experiences (Anonymized)
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {data.qualitativeInsights.experiences.map((exp: string, i: number) => (
              <div key={i} className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30">
                <p className="text-xs text-on-surface italic leading-relaxed">&ldquo;{exp}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>

        {/* Student Goals */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[18px]">flag</span>
            Student Goals & Aspirations
          </h3>
          <div className="space-y-2">
            {data.qualitativeInsights.goals.map((goal: string, i: number) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-secondary-container/20 rounded-lg">
                <span className="material-symbols-outlined text-secondary text-[16px] shrink-0">check_circle</span>
                <span className="text-xs text-on-surface">{goal}</span>
              </div>
            ))}
          </div>

          <h4 className="text-sm font-bold text-on-surface mt-6 mb-3">Key Recommendations</h4>
          <div className="space-y-2">
            {data.qualitativeInsights.recommendations.slice(0, 5).map((rec: string, i: number) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-primary font-bold text-xs mt-0.5">{i + 1}.</span>
                <span className="text-xs text-on-surface leading-relaxed">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Technology Acceptance */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[18px]">devices</span>
          Technology Acceptance Among Students
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "Own Smartphone", value: data.technologyAcceptance.smartphoneOwnership },
            { label: "Comfortable with Apps", value: data.technologyAcceptance.comfortWithHealthApps },
            { label: "Would Use AI Chatbot", value: data.technologyAcceptance.willingToUseAIChatbot },
            { label: "Trust AI for MH", value: data.technologyAcceptance.trustAIForMentalHealth },
            { label: "Prefer Digital", value: data.technologyAcceptance.preferDigitalOverPhysical },
            { label: "Continue if Useful", value: data.technologyAcceptance.wouldContinueUsingIfUseful },
          ].map((item) => (
            <div key={item.label} className="text-center p-3 bg-surface-container-low rounded-xl">
              <div className="text-2xl font-black text-primary">{item.value}%</div>
              <div className="text-[10px] text-on-surface-variant mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
