import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import clsx from "clsx";
import "../../styles/main.scss";

const Sidebar = () => {
  const location = useLocation();

  const navigation = [
    { name: "대시보드", href: "/", icon: "🏠" },
    { name: "지점 관리", href: "/branches", icon: "🏢" },
    { name: "설정", href: "/settings", icon: "⚙️" },
  ];

  // 렌더박스
  const [menuPosition, setMenuPosition] = useState(null);
  const menuRef = useRef(null);
  const handleFooterClick = (e) => {
    e.preventDefault();
    // setMenuPosition({ x: e.clientX, y: e.clientY });
    setMenuPosition({ x: e.clientX, y: 50 });
  };

  // 사이드바 푸터의 바깥 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuPosition(null);
      }
    };
    console.log(menuPosition);
    if (menuPosition) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuPosition]);

  return (
    <div className="sidebar">
      <div className="sidebar__header">
        <h1 className="sidebar__title">Open Demo CEO</h1>
      </div>

      <nav className="sidebar__nav">
        <div className="sidebar__nav-list">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={clsx(
                  "sidebar__nav-item",
                  isActive && "sidebar__nav-item--active"
                )}
              >
                <span className="sidebar__nav-icon">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      <div
        className="sidebar__footer"
        onClick={(e) => {
          // console.log("navigate to settings");
          handleFooterClick(e);
        }}
        style={{ cursor: "pointer" }}
      >
        <div className="sidebar__user">
          <div className="sidebar__user-avatar">
            <span>A</span>
          </div>
          <div className="sidebar__user-info">
            <p className="sidebar__user-info-name">관리자</p>
            <p className="sidebar__user-info-email">admin@example.com</p>
          </div>
        </div>
      </div>
      {/* 렌더박스 (팝업 메뉴) */}
      {menuPosition && (
        <div
          ref={menuRef}
          className="popup-menu"
          style={{
            position: "fixed",
            // top: menuPosition.y,
            bottom: menuPosition.y,
            left: menuPosition.x,
            backgroundColor: "white",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            borderRadius: "8px",
            padding: "8px 0",
            zIndex: 9999,
            minWidth: "120px",
          }}
        >
          <div
            className="popup-menu__item"
            onClick={() => {
              console.log("설정으로 이동");
              setMenuPosition(null);
            }}
            style={{ padding: "8px 16px", cursor: "pointer", color: "black" }}
          >
            설정
          </div>
          <div
            className="popup-menu__item"
            onClick={() => {
              console.log("로그아웃 실행");
              setMenuPosition(null);
            }}
            style={{ padding: "8px 16px", cursor: "pointer", color: "black" }}
          >
            로그아웃
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
