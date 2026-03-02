"use client";

// @ts-nocheck

import { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Gift, Users, TrendingUp, Award } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface LoyaltyDashboard {
  summary: {
    totalMembers: number;
    totalActiveRewards: number;
    totalPointsInCirculation: number;
  };
  membersByTier: Array<{ tier: string; count: number }>;
  avgPointsByTier: Array<{ tier: string; avgPoints: number }>;
}

const TIER_COLORS: Record<string, string> = {
  BRONZE: "#CD7F32",
  SILVER: "#C0C0C0",
  GOLD: "#FFD700",
  PLATINUM: "#E5E4E2",
};

export default function LoyaltyDashboard() {
  const [dashboard, setDashboard] = useState<LoyaltyDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/loyalty/admin/dashboard", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setDashboard(response.data);
    } catch (error) {
      toast.error("Failed to load loyalty dashboard");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Failed to load dashboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Loyalty Program</h1>
        <Link
          href="/admin/loyalty/settings"
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Manage Rewards
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Members</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {dashboard.summary.totalMembers.toLocaleString()}
              </p>
            </div>
            <Users className="w-12 h-12 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">
                Active Rewards
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {dashboard.summary.totalActiveRewards}
              </p>
            </div>
            <Gift className="w-12 h-12 text-orange-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">
                Points Circulation
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {(dashboard.summary.totalPointsInCirculation / 1000).toFixed(1)}
                K
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">
                Tier Distribution
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {dashboard.membersByTier.length}
              </p>
            </div>
            <Award className="w-12 h-12 text-purple-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Members by Tier */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Members by Tier
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dashboard.membersByTier.map((item) => ({
                  name: item.tier,
                  value: item.count || 0,
                }))}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {dashboard.membersByTier.map((item) => (
                  <Cell
                    key={`cell-${item.tier}`}
                    fill={TIER_COLORS[item.tier] || "#8884d8"}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number | string | undefined) =>
                  Number(value ?? 0).toLocaleString()
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Average Points by Tier */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Average Points by Tier
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={dashboard.avgPointsByTier.map((item) => ({
                tier: item.tier,
                avgPoints: Number(item.avgPoints) || 0,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tier" />
              <YAxis />
              <Tooltip
                formatter={(value: number | string | undefined) =>
                  Number(value ?? 0).toLocaleString()
                }
              />
              <Bar dataKey="avgPoints" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tier Breakdown Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Tier Breakdown
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Tier
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Members
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Avg Points
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  % of Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {dashboard.membersByTier.map((tier) => {
                const avgData = dashboard.avgPointsByTier.find(
                  (a) => a.tier === tier.tier,
                );
                const percentage = (
                  ((tier.count || 0) / (dashboard.summary.totalMembers || 1)) *
                  100
                ).toFixed(1);
                return (
                  <tr
                    key={tier.tier}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: TIER_COLORS[tier.tier] }}
                        ></div>
                        <span className="font-medium text-gray-900">
                          {tier.tier}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {(tier.count || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {Number(avgData?.avgPoints || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-gray-700">{percentage}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
