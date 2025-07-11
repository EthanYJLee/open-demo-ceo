import React, { useState, useEffect } from "react";
import { branchService } from "../services/supabase";
import "../styles/main.scss";

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
      color: "stats__card-icon--blue",
      change: "+12%",
    },
    {
      title: "총 공간 수",
      value: stats.totalSpaces,
      icon: "👥",
      color: "stats__card-icon--green",
      change: "+8%",
    },
    {
      title: "이번 달 예약",
      value: stats.totalReservations,
      icon: "📅",
      color: "stats__card-icon--purple",
      change: "+15%",
    },
    {
      title: "이번 달 매출",
      value: `₩${stats.revenue.toLocaleString()}`,
      icon: "📈",
      color: "stats__card-icon--orange",
      change: "+23%",
    },
  ];

  if (loading) {
    return (
      <div className="page">
        <div className="loading">
          <div className="loading__spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="error">
          <div className="error__content">
            <div className="error__icon">⚠️</div>
            <p className="error__message">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn btn--primary"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__header-title">대시보드</h1>
        <p className="page__header-subtitle">
          지점 관리 현황을 한눈에 확인하세요
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="dashboard__stats">
        <div className="grid grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <div key={index} className="stats__card">
              <div className="stats__card-header">
                <div className={`stats__card-icon ${stat.color}`}>
                  <span>{stat.icon}</span>
                </div>
                <div className="stats__card-content">
                  <p className="stats__card-title">{stat.title}</p>
                  <p className="stats__card-value">{stat.value}</p>
                </div>
              </div>
              <div className="stats__card-change">
                <span className="stats__card-change-value">{stat.change}</span>
                <span className="stats__card-change-label">지난 달 대비</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 최근 활동 */}
      <div className="dashboard__recent-activity">
        <div className="card__header">
          <h2 className="card__title">최근 활동</h2>
        </div>
        <div className="card__body">
          <div className="activity">
            <div className="activity__item">
              <div className="activity__indicator activity__indicator--green"></div>
              <span className="activity__content">
                새로운 지점이 등록되었습니다: 강남점
              </span>
              <span className="activity__time">2시간 전</span>
            </div>
            <div className="activity__item">
              <div className="activity__indicator activity__indicator--blue"></div>
              <span className="activity__content">
                홍대점 레이아웃이 업데이트되었습니다
              </span>
              <span className="activity__time">5시간 전</span>
            </div>
            <div className="activity__item">
              <div className="activity__indicator activity__indicator--purple"></div>
              <span className="activity__content">
                새로운 예약이 생성되었습니다
              </span>
              <span className="activity__time">1일 전</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
