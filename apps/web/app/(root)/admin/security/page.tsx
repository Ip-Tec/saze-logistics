// app/(root)/admin/security/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import DataTable from "@/components/admin/people/DataTable";
import ActionButton from "@/components/admin/people/ActionButton";
import { supabase } from "@shared/supabaseClient";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface LogRow {
  id: string;
  timestamp: string;
  category: string;
  level: string;
  message: string;
  metadata: any;
}

export default function SecurityLogsPage() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalCount, setTotalCount] = useState(0);
  const [filterLevel, setFilterLevel] = useState<string | null>(null);

  // Fetch paginated logs
  const fetchLogs = async () => {
    setLoading(true);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("logs")
      .select("*", { count: "exact" })
      .order("timestamp", { ascending: false });

    if (filterLevel) {
      query = query.eq("level", filterLevel);
    }

    const { data, error, count } = await query.range(from, to);
    if (error) {
      console.error("Error loading logs:", error.message);
    } else {
      setLogs(data || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [page, filterLevel]);

  // Data for error-rate chart (last 24h, hourly buckets)
  const [allRecent, setAllRecent] = useState<LogRow[]>([]);
  useEffect(() => {
    async function fetchRecent() {
      const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const { data } = await supabase
        .from("logs")
        .select("timestamp,level")
        .gte("timestamp", since);
      setAllRecent(data as LogRow[]);
    }
    fetchRecent();
  }, []);

  const errorSeries = useMemo(() => {
    // bucket into hours
    const buckets: Record<string, number> = {};
    allRecent
      .filter((l) => l.level === "error")
      .forEach((l) => {
        const hour = new Date(l.timestamp).toISOString().slice(0, 13); // "YYYY-MM-DDTHH"
        buckets[hour] = (buckets[hour] || 0) + 1;
      });

    // fill last 24 points
    const arr = [];
    for (let i = 23; i >= 0; i--) {
      const d = new Date();
      d.setHours(d.getHours() - i);
      const hour = d.toISOString().slice(0, 13);
      arr.push({ hour: hour.slice(11), errors: buckets[hour] || 0 });
    }
    return arr;
  }, [allRecent]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const columns = [
    {
      header: "Time",
      accessor: (l: LogRow) => new Date(l.timestamp).toLocaleString(),
    },
    { header: "Level", accessor: (l: LogRow) => l.level },
    { header: "Category", accessor: (l: LogRow) => l.category },
    { header: "Message", accessor: (l: LogRow) => l.message },
    {
      header: "Actions",
      accessor: (l: LogRow) => (
        <ActionButton
          label="Details"
          onClick={() => alert(JSON.stringify(l.metadata, null, 2))}
        />
      ),
    },
  ];

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-semibold">Security & Logs</h1>

      {/* 1. Server Status Placeholder */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-medium mb-2">Server Status</h2>
        <p className="text-green-600 font-semibold">
          🟢 All systems operational
        </p>
      </div>

      {/* 2. Error Rate (Last 24 h) */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-medium mb-2">Error Rate (Hourly, 24 h)</h2>
        <div style={{ width: "100%", height: 200 }}>
          <ResponsiveContainer>
            <LineChart data={errorSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="errors" stroke="#ef4444" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Logs Table */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <h2 className="text-lg font-medium">Audit Logs</h2>

        {/* Filter by level */}
        <div className="flex items-center space-x-4">
          <label className="font-medium">Level:</label>
          {["all", "info", "warning", "error"].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl === "all" ? null : lvl)}
              className={
                filterLevel === lvl || (lvl === "all" && !filterLevel)
                  ? "px-3 py-1 bg-blue-600 text-white rounded"
                  : "px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              }
            >
              {lvl.toUpperCase()}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-gray-600">Loading logs…</div>
        ) : (
          <>
            <DataTable<LogRow> columns={columns} data={logs} />

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
