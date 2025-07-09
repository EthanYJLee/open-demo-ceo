import React from "react";

const Toolbar = ({ onAddElement, onDeleteSelected, selectedId }) => {
  const tools = [
    {
      id: "space",
      icon: "⬛",
      label: "공간",
      action: () => onAddElement("space"),
      tooltip: "공간 추가 (룸, 복도, 화장실 등 매장 내 구역)",
    },
    {
      id: "room",
      icon: "⬜",
      label: "방",
      action: () => onAddElement("room"),
      tooltip: "방/좌석 추가 (공간 내부에 1인 좌석/칸막이)",
    },
    {
      id: "door",
      icon: "🚪",
      label: "문",
      action: () => onAddElement("door"),
      tooltip: "문 추가 (공간 경계에 출입구 배치)",
    },
    {
      id: "text",
      icon: "📝",
      label: "텍스트",
      action: () => onAddElement("text"),
      tooltip: "텍스트 추가 (라벨, 안내문 등)",
    },
  ];

  // 삭제 버튼 클릭 시 확인창
  const handleDelete = () => {
    if (selectedId && window.confirm("정말 삭제할까요?")) {
      onDeleteSelected();
    }
  };

  return (
    <div className="p-2 space-y-2">
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={tool.action}
          className="w-12 h-12 flex items-center justify-center bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
          title={tool.tooltip}
        >
          <span className="text-lg">{tool.icon}</span>
        </button>
      ))}
      <div className="border-t border-gray-200 pt-2">
        <button
          className={`w-12 h-12 flex items-center justify-center rounded-lg transition-colors ${
            selectedId
              ? "bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-300"
              : "bg-gray-100 border border-gray-200 cursor-not-allowed"
          }`}
          title="선택된 요소 삭제"
          onClick={selectedId ? handleDelete : undefined}
          disabled={!selectedId}
        >
          <span className="text-lg text-red-600">🗑️</span>
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
