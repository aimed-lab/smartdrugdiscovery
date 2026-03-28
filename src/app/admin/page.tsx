"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AgentConsole } from "@/components/agent-console";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

const pipelineData = [
  { stage: "Hit ID", count: 245 },
  { stage: "Hit-to-Lead", count: 82 },
  { stage: "Lead Opt", count: 34 },
  { stage: "Preclinical", count: 12 },
  { stage: "Phase I", count: 5 },
  { stage: "Phase II", count: 2 },
];

const targetDistribution = [
  { name: "Kinases", value: 35 },
  { name: "GPCRs", value: 25 },
  { name: "Ion Channels", value: 15 },
  { name: "Nuclear Receptors", value: 12 },
  { name: "Proteases", value: 13 },
];

const activityTrend = [
  { month: "Oct", compounds: 12, experiments: 8 },
  { month: "Nov", compounds: 19, experiments: 14 },
  { month: "Dec", compounds: 25, experiments: 18 },
  { month: "Jan", compounds: 32, experiments: 22 },
  { month: "Feb", compounds: 38, experiments: 28 },
  { month: "Mar", compounds: 45, experiments: 35 },
];

const COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#f59e0b", "#ef4444"];

export default function Dashboard() {
  const [tab, setTab] = useState<"dashboard" | "agent">("dashboard");

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Admin</h1>
          <p className="text-muted-foreground mt-1">Platform administration and pipeline overview</p>
        </div>
        <div className="flex rounded-lg border overflow-hidden text-sm font-medium">
          <button
            onClick={() => setTab("dashboard")}
            className={`px-4 py-2 transition-colors ${tab === "dashboard" ? "bg-primary text-primary-foreground" : "hover:bg-accent text-muted-foreground"}`}>
            Dashboard
          </button>
          <button
            onClick={() => setTab("agent")}
            className={`px-4 py-2 transition-colors border-l ${tab === "agent" ? "bg-primary text-primary-foreground" : "hover:bg-accent text-muted-foreground"}`}>
            🤖 Agent
          </button>
        </div>
      </div>

      {tab === "agent" ? (
        <AgentConsole />
      ) : (
      <div className="space-y-8">

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Projects" value="8" change="+2 this month" />
        <StatCard title="Compounds" value="380" change="+45 this month" />
        <StatCard title="Targets" value="24" change="+3 this month" />
        <StatCard title="Experiments" value="156" change="12 in progress" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pipeline Funnel</CardTitle>
            <CardDescription>Compounds by development stage</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pipelineData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="stage" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(221.2, 83.2%, 53.3%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Target Distribution</CardTitle>
            <CardDescription>Compounds by target class</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={targetDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {targetDistribution.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 justify-center">
              {targetDistribution.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[index] }}
                  />
                  {entry.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activity Trend</CardTitle>
          <CardDescription>Compounds added and experiments run over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={activityTrend}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="compounds"
                stroke="hsl(221.2, 83.2%, 53.3%)"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="experiments"
                stroke="hsl(262.1, 83.3%, 57.8%)"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { action: "Compound SDD-0245 passed ADMET screening", time: "2 hours ago", type: "success" },
              { action: "New target BRAF V600E added to Project Melanoma", time: "5 hours ago", type: "info" },
              { action: "Experiment EXP-089 completed with positive results", time: "1 day ago", type: "success" },
              { action: "3 compounds failed Lipinski Ro5 filter", time: "1 day ago", type: "warning" },
              { action: "Project Alzheimer's moved to Lead Optimization", time: "2 days ago", type: "info" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div
                  className={`h-2 w-2 rounded-full ${
                    item.type === "success"
                      ? "bg-green-500"
                      : item.type === "warning"
                      ? "bg-yellow-500"
                      : "bg-blue-500"
                  }`}
                />
                <span className="flex-1">{item.action}</span>
                <span className="text-muted-foreground text-xs">{item.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  change,
}: {
  title: string;
  value: string;
  change: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{change}</p>
      </CardContent>
    </Card>
  );
}
