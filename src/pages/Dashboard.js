import React, { useState, useEffect } from "react";
import { branchService } from "../services/supabase";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalBranches: 0,
    totalSpaces: 0,
    totalReservations: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const branches = await branchService.getBranches();
        setStats((prev) => ({
          ...prev,
          totalBranches: branches.length,
        }));
      } catch (error) {
        console.error("Failed to fetch stats:", error);
        setError("데이터를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "총 지점 수",
      value: stats.totalBranches,
      icon: "🏢",
      color: "bg-blue-500",
      change: "+12%",
    },
    {
      title: "총 공간 수",
      value: stats.totalSpaces,
      icon: "👥",
      color: "bg-green-500",
      change: "+8%",
    },
    {
      title: "이번 달 예약",
      value: stats.totalReservations,
      icon: "📅",
      color: "bg-purple-500",
      change: "+15%",
    },
    {
      title: "이번 달 매출",
      value: `₩${stats.revenue.toLocaleString()}`,
      icon: "📈",
      color: "bg-orange-500",
      change: "+23%",
    },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 text-2xl mb-4">⚠️</div>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-primary-500 text-white px-4 py-2 rounded-lg"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
        <p className="text-gray-600 mt-2">지점 관리 현황을 한눈에 확인하세요</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <span className="text-2xl text-white">{stat.icon}</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-green-600 font-medium">
                {stat.change}
              </span>
              <span className="text-sm text-gray-500 ml-1">지난 달 대비</span>
            </div>
          </div>
        ))}
      </div>

      {/* 최근 활동 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">최근 활동</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-600">
                새로운 지점이 등록되었습니다: 강남점
              </span>
              <span className="text-xs text-gray-400 ml-auto">2시간 전</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-600">
                홍대점 레이아웃이 업데이트되었습니다
              </span>
              <span className="text-xs text-gray-400 ml-auto">5시간 전</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-600">
                새로운 예약이 생성되었습니다
              </span>
              <span className="text-xs text-gray-400 ml-auto">1일 전</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
