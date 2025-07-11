import React from "react";
import "../../styles/Toolbar.scss";

const Toolbar = ({ onAddElement, onDeleteSelected, selectedId }) => {
  const tools = [
    {
      id: "space",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M3 3h18v18H3V3zm2 2v14h14V5H5z" />
        </svg>
      ),
      label: "공간",
      action: () => onAddElement("space"),
      tooltip: "공간 추가 (룸, 복도, 화장실 등 매장 내 구역)",
    },
    {
      id: "room",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
      ),
      label: "방",
      action: () => onAddElement("room"),
      tooltip: "방/좌석 추가 (공간 내부에 1인 좌석/칸막이)",
    },
    {
      id: "door",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M19 19V5c0-1.1-.9-2-2-2H7c-1.1 0-2 .9-2 2v14H3v2h18v-2h-2zm-8-6c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
        </svg>
      ),
      label: "문",
      action: () => onAddElement("door"),
      tooltip: "문 추가 (공간 경계에 출입구 배치)",
    },
    {
      id: "text",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M2.5 4v3h5v12h3V7h5V4H2.5zM21.5 9h-9v3h3v7h3v-7h3V9z" />
        </svg>
      ),
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
    <div className="toolbar">
      <div className="toolbar__header">
        <h3 className="toolbar__title">도구</h3>
        <p className="toolbar__subtitle">요소 추가</p>
      </div>

      <div className="toolbar__tools">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={tool.action}
            className="toolbar__button"
            title={tool.tooltip}
          >
            <div className="toolbar__icon">{tool.icon}</div>
            <span className="toolbar__label">{tool.label}</span>
          </button>
        ))}
      </div>

      <div className="toolbar__divider">
        <div className="toolbar__divider-line"></div>
        <span className="toolbar__divider-text">편집</span>
        <div className="toolbar__divider-line"></div>
      </div>

      <div className="toolbar__actions">
        <button
          className={`toolbar__button toolbar__button--delete${
            selectedId
              ? " toolbar__button--active"
              : " toolbar__button--disabled"
          }`}
          title="선택된 요소 삭제"
          onClick={selectedId ? handleDelete : undefined}
          disabled={!selectedId}
        >
          <div className="toolbar__icon toolbar__icon--delete">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
            </svg>
          </div>
          <span className="toolbar__label">삭제</span>
        </button>
      </div>

      {/* <div className="toolbar__footer">
        <div className="toolbar__tip">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
          </svg>
          <span>요소를 클릭하여 선택하고 속성을 편집하세요</span>
        </div>
      </div> */}
    </div>
  );
};

export default Toolbar;
