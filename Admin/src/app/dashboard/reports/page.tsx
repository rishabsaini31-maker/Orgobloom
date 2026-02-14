"use client";

import { useState } from "react";
import toast from "react-hot-toast";

const reportTypes = [
  {
    id: "sales",
    name: "Sales Report",
    description: "Revenue, orders, and average order value trends",
    metrics: [
      "Total Revenue",
      "Total Orders",
      "Average Order Value",
      "Growth %",
    ],
  },
  {
    id: "customers",
    name: "Customer Report",
    description: "New customers, repeat rate, and lifetime value",
    metrics: [
      "New Customers",
      "Repeat Customers",
      "Customer Lifetime Value",
      "Churn Rate",
    ],
  },
  {
    id: "products",
    name: "Product Report",
    description: "Top sellers, stock turns, and product performance",
    metrics: [
      "Top Selling Products",
      "Stock Turnover",
      "Margin Analysis",
      "Low Stock Items",
    ],
  },
  {
    id: "fraud",
    name: "Fraud Report",
    description: "Risk scores, blocked customers, and fraud patterns",
    metrics: [
      "High Risk Customers",
      "Blocked Transactions",
      "Fraud Score Trends",
      "Prevention Rate",
    ],
  },
  {
    id: "payments",
    name: "Payment Report",
    description: "Payment methods, success rates, and refunds",
    metrics: [
      "Total Transactions",
      "Success Rate",
      "Refunds",
      "Payment Methods",
    ],
  },
  {
    id: "inventory",
    name: "Inventory Report",
    description: "Stock levels, movements, and valuation",
    metrics: ["Total Items", "Stock Value", "Movements", "Reorder Points"],
  },
];

interface GeneratedReport {
  id: string;
  type: string;
  name: string;
  generatedAt: string;
  status: "pending" | "ready" | "error";
}

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "1y">(
    "30d",
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([
    {
      id: "1",
      type: "sales",
      name: "Sales Report - Last 30 Days",
      generatedAt: new Date(Date.now() - 86400000).toISOString(),
      status: "ready",
    },
    {
      id: "2",
      type: "customers",
      name: "Customer Report - Last 30 Days",
      generatedAt: new Date(Date.now() - 172800000).toISOString(),
      status: "ready",
    },
  ]);

  const handleGenerateReport = async () => {
    if (!selectedReport) {
      toast.error("Please select a report type");
      return;
    }

    setIsGenerating(true);
    try {
      // Simulate report generation
      const reportName =
        reportTypes.find((r) => r.id === selectedReport)?.name || "Report";

      const newReport: GeneratedReport = {
        id: Date.now().toString(),
        type: selectedReport,
        name: `${reportName} - Last ${dateRange}`,
        generatedAt: new Date().toISOString(),
        status: "pending",
      };

      setGeneratedReports([newReport, ...generatedReports]);

      // Simulate delay and status change
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setGeneratedReports((reports) =>
        reports.map((r) =>
          r.id === newReport.id ? { ...r, status: "ready" } : r,
        ),
      );

      toast.success("Report generated successfully!");
      setSelectedReport(null);
    } catch (error) {
      toast.error("Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = (format: "csv" | "pdf") => {
    toast.success(`Exporting as ${format.toUpperCase()}...`);
  };

  const handleDelete = (reportId: string) => {
    if (confirm("Are you sure you want to delete this report?")) {
      setGeneratedReports(generatedReports.filter((r) => r.id !== reportId));
      toast.success("Report deleted");
    }
  };

  const selectedReportData = reportTypes.find((r) => r.id === selectedReport);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Reports & Analytics</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Report Generator */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold mb-6">Generate Report</h2>

            {/* Date Range Selection */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 text-sm"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="1y">Last Year</option>
              </select>
            </div>

            {/* Report Type Selection */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-700 mb-3">
                Report Type
              </label>
              <div className="space-y-2">
                {reportTypes.map((report) => (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReport(report.id)}
                    className={`w-full text-left px-3 py-3 rounded-lg border-2 transition ${
                      selectedReport === report.id
                        ? "border-primary-600 bg-primary-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <p className="text-xs font-semibold text-gray-900">
                      {report.name}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {report.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Report Metrics */}
            {selectedReportData && (
              <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs font-semibold text-blue-900 mb-2">
                  Metrics Included:
                </p>
                <ul className="space-y-1">
                  {selectedReportData.metrics.map((metric) => (
                    <li key={metric} className="text-xs text-blue-700">
                      • {metric}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerateReport}
              disabled={isGenerating || !selectedReport}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 font-medium text-sm"
            >
              {isGenerating ? "Generating..." : "Generate Report"}
            </button>
          </div>
        </div>

        {/* Generated Reports */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold mb-6">Recent Reports</h2>

            {generatedReports.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">
                  No reports generated yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {generatedReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">
                        {report.name}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Generated:{" "}
                        {new Date(report.generatedAt).toLocaleDateString()} at{" "}
                        {new Date(report.generatedAt).toLocaleTimeString()}
                      </p>
                      <div className="mt-2 flex gap-1">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            report.status === "ready"
                              ? "bg-green-100 text-green-700"
                              : report.status === "pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {report.status === "ready"
                            ? "Ready"
                            : report.status === "pending"
                              ? "Processing"
                              : "Error"}
                        </span>
                      </div>
                    </div>

                    {report.status === "ready" && (
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleExport("pdf")}
                          className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition text-xs font-medium"
                        >
                          PDF
                        </button>
                        <button
                          onClick={() => handleExport("csv")}
                          className="px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition text-xs font-medium"
                        >
                          CSV
                        </button>
                        <button
                          onClick={() => handleDelete(report.id)}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition text-xs font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Export */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
            <h3 className="text-sm font-bold mb-4">Scheduled Reports</h3>
            <p className="text-xs text-gray-600 mb-4">
              Set up automatic report generation and email delivery
            </p>
            <button className="w-full px-4 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition font-medium text-sm">
              Configure Scheduled Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
