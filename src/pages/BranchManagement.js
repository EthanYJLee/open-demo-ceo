import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { branchService } from "../services/supabase";
import BranchForm from "../components/BranchManager/BranchForm";

const BranchManagement = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);

  useEffect(() => {
    fetchBranches();
  }, []);

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

  const handleDeleteBranch = async (id) => {
    if (window.confirm("정말로 이 지점을 삭제하시겠습니까?")) {
      try {
        // 삭제 로직 구현 필요
        fetchBranches();
      } catch (error) {
        console.error("Failed to delete branch:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">지점 관리</h1>
          <p className="text-gray-600 mt-2">등록된 지점들을 관리하세요</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <span className="mr-2">➕</span>새 지점 등록
        </button>
      </div>

      {/* 지점 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map((branch) => (
          <div
            key={branch.id}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            <div className="h-48 bg-gray-200 flex items-center justify-center">
              {branch.images && branch.images.length > 0 ? (
                <img
                  src={branch.images[0]}
                  alt={branch.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-400 text-4xl">🏢</span>
              )}
            </div>

            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {branch.name}
              </h3>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">📍</span>
                  <span>{branch.address}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">📞</span>
                  <span>{branch.phone}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <Link
                    to={`/layout/${branch.id}`}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center"
                  >
                    <span className="mr-1">📐</span>
                    레이아웃
                  </Link>
                  <button
                    onClick={() => setEditingBranch(branch)}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm flex items-center"
                  >
                    <span className="mr-1">✏️</span>
                    수정
                  </button>
                </div>

                <button
                  onClick={() => handleDeleteBranch(branch.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <span className="text-xl">🗑️</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 지점 등록/수정 폼 모달 */}
      {(showForm || editingBranch) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
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
