import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { branchService } from "../services/supabase";
import BranchForm from "../components/BranchManager/BranchForm";
import "../styles/main.scss";

const BranchManagement = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  // 지점 정보 받아오기 (임시)
  const fetchBranches = async () => {
    try {
      setLoading(true);
      const data = await branchService.getBranches();
      setBranches(data);
    } catch (error) {
      console.error("Failed to fetch branches:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBranch = async (branchData) => {
    try {
      await branchService.createBranch(branchData);
      setShowForm(false);
      fetchBranches();
    } catch (error) {
      console.error("Failed to create branch:", error);
    }
  };

  const handleUpdateBranch = async (id, updates) => {
    try {
      await branchService.updateBranch(id, updates);
      setEditingBranch(null);
      fetchBranches();
    } catch (error) {
      console.error("Failed to update branch:", error);
    }
  };

  // const handleDeleteBranch = async (id) => {
  //   if (window.confirm("정말로 이 지점을 삭제하시겠습니까?")) {
  //     try {
  //       // 삭제 로직 구현 필요
  //       fetchBranches();
  //     } catch (error) {
  //       console.error("Failed to delete branch:", error);
  //     }
  //   }
  // };

  if (loading) {
    return (
      <div className="page">
        <div className="loading">
          <div className="loading__spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="branch-management__header">
        <div>
          <h1 className="branch-management__title">지점 관리</h1>
          <p className="branch-management__subtitle">
            등록된 지점들을 관리하세요
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="branch-management__add-button"
        >
          <span>➕</span>새 지점 등록
        </button>
      </div>

      {/* 지점 목록 */}
      <div className="branch-management__grid">
        {branches.map((branch) => (
          <div key={branch.id} className="branch-management__card">
            <div className="branch-management__card-image">
              {branch.images && branch.images.length > 0 ? (
                <img src={branch.images[0]} alt={branch.name} />
              ) : (
                <span className="placeholder">🏢</span>
              )}
            </div>

            <div className="branch-management__card-content">
              <h3 className="branch-management__card-title">{branch.name}</h3>

              <div className="branch-management__card-info">
                <div className="branch-management__card-info-item">
                  <span>📍</span>
                  <span>{branch.address}</span>
                </div>
                <div className="branch-management__card-info-item">
                  <span>📞</span>
                  <span>{branch.phone}</span>
                </div>
              </div>

              <div className="branch-management__card-actions">
                <div className="branch-management__card-actions-left">
                  <Link
                    to={`/layout/${branch.id}`}
                    className="branch-management__action-button branch-management__action-button--layout"
                  >
                    <span>📐</span>
                    레이아웃
                  </Link>
                  <button
                    onClick={() => setEditingBranch(branch)}
                    className="branch-management__action-button branch-management__action-button--edit"
                  >
                    <span>✏️</span>
                    수정
                  </button>
                </div>

                {/* <button
                  onClick={() => handleDeleteBranch(branch.id)}
                  className="branch-management__card-actions-right"
                >
                  <span>🗑️</span>
                </button> */}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 지점 등록/수정 폼 모달 */}
      {(showForm || editingBranch) && (
        <div className="modal__overlay">
          <div className="modal__content">
            <BranchForm
              branch={editingBranch}
              onSubmit={editingBranch ? handleUpdateBranch : handleCreateBranch}
              onCancel={() => {
                setShowForm(false);
                setEditingBranch(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchManagement;
