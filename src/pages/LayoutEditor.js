import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Canvas from "../components/LayoutEditor/Canvas";
import Toolbar from "../components/LayoutEditor/Toolbar";
import PropertiesPanel from "../components/LayoutEditor/PropertiesPanel";
// import { layoutTemplates } from "../templates/layoutTemplates";
import { layoutService } from "../services/layoutService";
import "../styles/main.scss";
import { supabase } from "../services/supabase";

function uuid() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  // Fallback UUIDv4 generator
  const hex = [...Array(256)].map(
    (_, i) => (i < 16 ? "0" : "") + i.toString(16)
  );
  const r = () => (Math.random() * 256) | 0;
  return (
    hex[r()] +
    hex[r()] +
    hex[r()] +
    hex[r()] +
    "-" +
    hex[r()] +
    hex[r()] +
    "-4" +
    hex[r()].substr(1) +
    "-" +
    ((8 + (r() % 4)).toString(16) + hex[r()].substr(1)) +
    "-" +
    hex[r()] +
    hex[r()] +
    hex[r()] +
    hex[r()] +
    hex[r()] +
    hex[r()]
  );
}

// ====== 안전 클램프 유틸 (LayoutEditor.js 상단, 컴포넌트 바깥) ======
const STAGE_WIDTH = 800;
const STAGE_HEIGHT = 600;
const GRID_SIZE = 20;

const snapToGrid = (v) => Math.round(v / GRID_SIZE) * GRID_SIZE;

// 카테고리 라벨 (저장은 영문, 표시는 한글)
const CATEGORY_LABELS = {
  prayer: "기도실",
  lounge: "휴게실",
  bathroom: "화장실",
  storage: "창고",
  other: "기타",
};
const categoryToLabel = (v) => CATEGORY_LABELS[v] || v;

// rotation을 고려한 AABB offset (Canvas.js와 동일 규칙)
const rotationOffsets = (w, h, rotationDeg = 0) => {
  const r = ((rotationDeg % 360) + 360) % 360;
  if (r === 0) return { minX: 0, maxX: w, minY: 0, maxY: h };
  if (r === 90) return { minX: -h, maxX: 0, minY: 0, maxY: w };
  if (r === 180) return { minX: -w, maxX: 0, minY: -h, maxY: 0 };
  if (r === 270) return { minX: 0, maxX: h, minY: -w, maxY: 0 };
  // 비정규 각도는 보수적 근사
  const rad = (r * Math.PI) / 180;
  const boundW = Math.abs(w * Math.cos(rad)) + Math.abs(h * Math.sin(rad));
  const boundH = Math.abs(w * Math.sin(rad)) + Math.abs(h * Math.cos(rad));
  return { minX: 0, maxX: boundW, minY: 0, maxY: boundH };
};

// strokeWidth/2 + 1px 만큼 안전 여유
const getSafeMargin = (el) => (el?.style?.strokeWidth ?? 2) / 2 + 1;

// 전체 elements를 안전 클램프
const clampAllElementsSafe = (elements = []) => {
  return elements.map((el) => {
    const safe = getSafeMargin(el);
    const w = el.width ?? (el.type === "text" ? 60 : 0);
    const h = el.height ?? (el.type === "text" ? 20 : 0);
    const rot = el.rotation || 0;

    const { minX, maxX, minY, maxY } = rotationOffsets(w, h, rot);

    const minAllowedX = 0 - minX + safe;
    const maxAllowedX = STAGE_WIDTH - maxX - safe;
    const minAllowedY = 0 - minY + safe;
    const maxAllowedY = STAGE_HEIGHT - maxY - safe;

    return {
      ...el,
      x: snapToGrid(
        Math.min(
          Math.max(el.x, minAllowedX),
          Math.max(minAllowedX, maxAllowedX)
        )
      ),
      y: snapToGrid(
        Math.min(
          Math.max(el.y, minAllowedY),
          Math.max(minAllowedY, maxAllowedY)
        )
      ),
    };
  });
};

const DEFAULT_SPACE = () => ({
  id: uuid(),
  type: "space",
  x: 80,
  y: 80,
  width: 400,
  height: 250,
  name: "공간",
  spaceType: "room", // room, corridor, restroom 등
  style: { fill: "#f0f0f0", stroke: "#1976d2", strokeWidth: 2 },
});

const DEFAULT_ROOM = (parentId = null) => ({
  id: uuid(),
  type: "room",
  x: 120,
  y: 120,
  width: 60,
  height: 60,
  rotation: 0,
  parent: parentId, // 포함된 공간 id
  properties: {
    roomNumber: "",
    roomName: "방",
    capacity: 1,
    pricePerHour: 10000,
    category: "prayer",
  },
  style: {
    fill: "#e3f2fd",
    stroke: "#1976d2",
    strokeWidth: 2,
  },
});

const DEFAULT_DOOR = (parentId = null) => ({
  id: uuid(),
  type: "door",
  x: 100,
  y: 80,
  width: 40, // 실제 도면에 맞게 크기 조정
  height: 20, // 실제 도면에 맞게 크기 조정
  parent: parentId,
  direction: "right", // left/right/top/bottom
  style: { fill: "#ffe082", stroke: "#bfa600", strokeWidth: 2 },
});

const DEFAULT_TEXT = () => ({
  id: uuid(),
  type: "text",
  x: 120,
  y: 120,
  text: "텍스트",
  fontSize: 18,
  fill: "#333",
});

const DEFAULT_HALLWAY = (parentId = null) => ({
  id: uuid(),
  type: "hallway",
  x: 100,
  y: 100,
  width: 300,
  height: 60,
  parent: parentId,
  properties: {
    label: "복도",
    direction: "horizontal", // horizontal, vertical
  },
  style: {
    fill: "#f8fafc",
    stroke: "#475569",
    strokeWidth: 2,
  },
});

const LayoutEditor = () => {
  const { branchId } = useParams();
  const navigate = useNavigate();

  // 템플릿 선택 상태 (기본값 제거)
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  // elements: 빈 배열로 시작
  const [elements, setElements] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showProperties, setShowProperties] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showHelpPopup, setShowHelpPopup] = useState(false);
  // 방 분류(그룹) 관리 상태
  const [roomGroups, setRoomGroups] = useState([]); // [{id,name,category,capacity,pricePerHour}]
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupForm, setGroupForm] = useState({
    name: "",
    category: "prayer",
    capacity: 1,
    pricePerHour: 10000,
  });
  const [groupSearch, setGroupSearch] = useState("");
  const [groupErrors, setGroupErrors] = useState({});
  const [spacesReloadKey, setSpacesReloadKey] = useState(0);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "error",
  });
  const showToast = (message, type = "error") => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: "", type }), 2500);
  };

  // 층 관리 상태
  const [currentFloor, setCurrentFloor] = useState(1);
  const [floors, setFloors] = useState([]);
  const [showFloorModal, setShowFloorModal] = useState(false);
  const [editingFloor, setEditingFloor] = useState(null);
  const [editingFloorNumber, setEditingFloorNumber] = useState("");

  // 컴포넌트 마운트 시 저장된 레이아웃 불러오기
  useEffect(() => {
    loadFloors();
    console.log("********** LayoutEditor.js/line 113 **********");
    console.log("********** branchId **********");
    console.log(branchId);
    console.log("********** branchId **********");
  }, [branchId]);

  // 층 변경 시 해당 층의 레이아웃 불러오기
  useEffect(() => {
    if (currentFloor) {
      loadSavedLayout();
    }
  }, [currentFloor, branchId]);

  // 요소 변경 시 저장 필요 상태 업데이트
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [elements]);

  // 페이지 떠날 때 저장되지 않은 변경사항 확인
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue =
          "저장되지 않은 변경사항이 있습니다. 정말 나가시겠습니까?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // ===== 방 분류 로컬 저장/로드(지점별) =====
  const loadGroupsFromSupabase = async () => {
    try {
      if (!branchId) return;
      const { data, error } = await supabase
        .from("spaces")
        .select("id,name,category,capacity,price_per_hour")
        .eq("branch_id", branchId)
        .order("name", { ascending: true });
      if (!error && Array.isArray(data)) {
        setRoomGroups(
          data.map((s) => ({
            id: s.id,
            name: s.name,
            category: s.category || "other",
            capacity: s.capacity ?? 0,
            pricePerHour: s.price_per_hour ?? 0,
          }))
        );
      } else if (error) {
        console.error("loadGroupsFromSupabase error", error);
        // fallback to localStorage
        try {
          const raw = localStorage.getItem(`room_groups_${branchId}`);
          if (raw) setRoomGroups(JSON.parse(raw));
        } catch (_) {}
      }
    } catch (e) {
      console.error("loadGroupsFromSupabase unexpected", e);
    }
  };
  useEffect(() => {
    loadGroupsFromSupabase();
  }, [branchId]);
  useEffect(() => {
    // 여전히 로컬 백업 유지(네트워크 문제 대비)
    if (!branchId) return;
    try {
      localStorage.setItem(
        `room_groups_${branchId}`,
        JSON.stringify(roomGroups)
      );
    } catch (_) {}
  }, [roomGroups, branchId]);

  // 층 목록 불러오기
  const loadFloors = async () => {
    try {
      const floorsData = await layoutService.getAllFloors(branchId);
      if (floorsData && floorsData.length > 0) {
        setFloors(floorsData);
        setCurrentFloor(floorsData[0].floor || 1);
      } else {
        // 기본 1층 설정
        setFloors([{ floor: 1, name: "1층" }]);
        setCurrentFloor(1);
      }
    } catch (error) {
      console.log("층 정보를 불러올 수 없습니다. 기본 1층으로 설정합니다.");
      setFloors([{ floor: 1, name: "1층" }]);
      setCurrentFloor(1);
    }
  };

  // 저장된 레이아웃 불러오기
  const loadSavedLayout = async () => {
    setLoading(true);
    try {
      const savedLayout = await layoutService.getLayout(branchId, currentFloor);
      if (savedLayout) {
        // 로드 시 방 카테고리 기본값을 prayer로 보정
        const normalized = (savedLayout.elements || []).map((el) =>
          el?.type === "room"
            ? {
                ...el,
                properties: {
                  ...(el.properties || {}),
                  category: el.properties?.category ?? "prayer",
                },
              }
            : el
        );
        setElements(normalized);
        const cleaned = clampAllElementsSafe(normalized);
        setElements(cleaned);
        setSelectedTemplateId(savedLayout.template_id || "");
        setHasUnsavedChanges(false);
        console.log("저장된 레이아웃을 불러왔습니다:", savedLayout);
      } else {
        // 해당 층에 저장된 레이아웃이 없으면 빈 캔버스로 시작
        setElements([]);
        setSelectedTemplateId("");
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.log("저장된 레이아웃이 없습니다. 빈 캔버스로 시작합니다.");
      setElements([]);
      setSelectedTemplateId("");
      setHasUnsavedChanges(false);
    } finally {
      setLoading(false);
    }
  };

  // 템플릿 변경 핸들러 (템플릿이 없으므로 제거)
  const handleTemplateChange = (e) => {
    // 템플릿 기능 제거
  };

  // 층 변경 핸들러
  const handleFloorChange = (floor) => {
    if (hasUnsavedChanges) {
      if (
        window.confirm(
          "저장되지 않은 변경사항이 있습니다. 다른 층으로 이동하시겠습니까?"
        )
      ) {
        setCurrentFloor(floor);
        setSelectedIds([]);
        setShowProperties(false);
      }
    } else {
      setCurrentFloor(floor);
      setSelectedIds([]);
      setShowProperties(false);
    }
  };

  // 층 추가 핸들러
  const handleAddFloor = () => {
    const newFloor = Math.max(...floors.map((f) => f.floor), 0) + 1;
    const newFloorData = { floor: newFloor, name: `${newFloor}층` };
    setFloors([...floors, newFloorData]);
    setCurrentFloor(newFloor);
    setElements([]);
    setSelectedTemplateId("");
    setHasUnsavedChanges(false);
    setShowFloorModal(false);
  };

  // 층 삭제 핸들러
  const handleDeleteFloor = async (floorToDelete) => {
    if (floors.length <= 1) {
      alert("최소 1개의 층은 유지해야 합니다.");
      return;
    }

    if (window.confirm(`${floorToDelete}층을 삭제하시겠습니까?`)) {
      try {
        await layoutService.deleteLayout(branchId, floorToDelete);
        const updatedFloors = floors.filter((f) => f.floor !== floorToDelete);
        setFloors(updatedFloors);

        // 현재 층이 삭제된 층이면 첫 번째 층으로 이동
        if (currentFloor === floorToDelete) {
          setCurrentFloor(updatedFloors[0].floor);
        }
      } catch (error) {
        console.error("층 삭제 실패:", error);
        alert("층 삭제에 실패했습니다.");
      }
    }
  };

  // 층 편집 시작 핸들러
  const handleStartEditFloor = (floor) => {
    setEditingFloor(floor);
    setEditingFloorNumber(floor.floor.toString());
  };

  // 층 편집 취소 핸들러
  const handleCancelEditFloor = () => {
    setEditingFloor(null);
    setEditingFloorNumber("");
  };

  // 층 편집 저장 핸들러
  const handleSaveEditFloor = async () => {
    const newFloorNumber = parseInt(editingFloorNumber);

    if (isNaN(newFloorNumber) || newFloorNumber < 1) {
      alert("유효한 층 번호를 입력해주세요.");
      return;
    }

    // 중복된 층 번호가 있는지 확인
    const existingFloor = floors.find(
      (f) => f.floor === newFloorNumber && f !== editingFloor
    );
    if (existingFloor) {
      alert("이미 존재하는 층 번호입니다.");
      return;
    }

    try {
      // 기존 층의 레이아웃 데이터 백업
      const oldLayoutData = localStorage.getItem(
        `layout_${branchId}_${editingFloor.floor}`
      );

      // 새 층 번호로 레이아웃 데이터 이동
      if (oldLayoutData) {
        const parsedData = JSON.parse(oldLayoutData);
        parsedData.floor = newFloorNumber;
        localStorage.setItem(
          `layout_${branchId}_${newFloorNumber}`,
          JSON.stringify(parsedData)
        );
        localStorage.removeItem(`layout_${branchId}_${editingFloor.floor}`);
      }

      // Supabase에서도 업데이트 (있는 경우)
      try {
        await layoutService.updateFloorNumber(
          branchId,
          editingFloor.floor,
          newFloorNumber
        );
      } catch (error) {
        console.log("Supabase 업데이트 실패, 로컬 데이터만 업데이트:", error);
      }

      // 층 목록 업데이트
      const updatedFloors = floors.map((f) =>
        f === editingFloor
          ? { ...f, floor: newFloorNumber, name: `${newFloorNumber}층` }
          : f
      );
      setFloors(updatedFloors);

      // 현재 층이 수정된 층이면 현재 층 번호도 업데이트
      if (currentFloor === editingFloor.floor) {
        setCurrentFloor(newFloorNumber);
      }

      setEditingFloor(null);
      setEditingFloorNumber("");
    } catch (error) {
      console.error("층 번호 수정 실패:", error);
      alert("층 번호 수정에 실패했습니다.");
    }
  };

  // 요소 추가 핸들러
  const handleAddElement = (type) => {
    if (type === "space") {
      setElements((prev) => [...prev, DEFAULT_SPACE()]);
    } else if (type === "room") {
      setElements((prev) => [...prev, DEFAULT_ROOM()]);
    } else if (type === "door") {
      setElements((prev) => [...prev, DEFAULT_DOOR()]);
    } else if (type === "text") {
      setElements((prev) => [...prev, DEFAULT_TEXT()]);
    } else if (type === "hallway") {
      setElements((prev) => [...prev, DEFAULT_HALLWAY()]);
    }
  };

  // 요소 선택 핸들러 (단일/다중)
  const handleElementSelect = (id, multi = false) => {
    if (Array.isArray(id)) {
      setSelectedIds(id);
    } else if (multi) {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
      );
    } else if (id) {
      setSelectedIds([id]);
    } else {
      setSelectedIds([]);
    }
    setShowProperties(true);
  };

  // 요소 속성 변경 핸들러 (색상/폰트 등 스타일은 제한)
  const handleElementUpdate = (updatedElement) => {
    console.log(typeof updatedElement.x);
    console.log(typeof updatedElement.y);
    console.log(typeof updatedElement.width);
    console.log(typeof updatedElement.height);
    setElements((prev) =>
      prev.map((el) =>
        el.id === updatedElement.id
          ? {
              ...el,
              ...updatedElement,
              // 스타일 커스터마이즈 제한: 색상/폰트 등은 템플릿 값 고정
              style: el.style,
              fill: el.fill,
            }
          : el
      )
    );
  };

  // 삭제 핸들러
  const handleDeleteSelected = () => {
    if (selectedIds.length > 0) {
      setElements((prev) => prev.filter((el) => !selectedIds.includes(el.id)));
      setSelectedIds([]);
      setShowProperties(false);
    }
  };

  // 저장 핸들러
  const handleSave = async () => {
    // 모든 방이 공간에 연결되었는지 사전 검증
    const rooms = (elements || []).filter((el) => el?.type === "room");
    const isUuid = (s) =>
      typeof s === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        s
      );
    const unlinked = rooms.filter((r) => !isUuid(r?.properties?.spaceId || ""));
    if (unlinked.length > 0) {
      showToast(
        `연결되지 않은 방이 ${unlinked.length}개 있습니다. 모든 방의 공간을 연결해 주세요.`,
        "error"
      );
      return;
    }
    setLoading(true);
    try {
      const safeElements = clampAllElementsSafe(elements);
      const layoutData = {
        branchId,
        templateId: selectedTemplateId || "custom",
        elements: safeElements,
        floor: currentFloor,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await layoutService.saveLayout(layoutData);

      if (result.success) {
        setElements(safeElements);
        setHasUnsavedChanges(false);
        if (result.source === "local") {
          alert("레이아웃이 로컬에 저장되었습니다. (Supabase 연결 실패)");
        } else {
          alert("레이아웃이 저장되었습니다!");
        }
      } else {
        if (result.error === "UNLINKED_ROOMS") {
          showToast(
            `연결되지 않은 방이 ${
              result.count || 0
            }개 있습니다. 모든 방의 공간을 연결해 주세요.`,
            "error"
          );
          return;
        }
        alert("레이아웃 저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("레이아웃 저장 실패:", error);
      alert("레이아웃 저장에 실패했습니다: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 초기화 핸들러
  const handleReset = () => {
    if (
      window.confirm("모든 변경사항을 취소하고 빈 캔버스로 되돌리시겠습니까?")
    ) {
      setElements([]);
      setSelectedTemplateId("");
      setSelectedIds([]);
      setShowProperties(false);
      setHasUnsavedChanges(false);
    }
  };

  // ====== 분류 저장/삭제 ↔ spaces 동기화 ======
  const validateGroup = () => {
    const e = {};
    if (!groupForm.name || !groupForm.name.trim())
      e.name = "분류명을 입력하세요";
    if (
      Number.isNaN(Number(groupForm.capacity)) ||
      Number(groupForm.capacity) < 0
    )
      e.capacity = "0 이상의 숫자";
    if (
      Number.isNaN(Number(groupForm.pricePerHour)) ||
      Number(groupForm.pricePerHour) < 0
    )
      e.pricePerHour = "0 이상의 숫자";
    setGroupErrors(e);
    return Object.keys(e).length === 0;
  };

  const refreshSpaces = async () => {
    try {
      const { error } = await supabase.from("spaces").select("id").limit(1);
      if (error) console.error("spaces ping error", error);
    } catch (e) {
      console.error("spaces ping unexpected", e);
    } finally {
      setSpacesReloadKey((k) => k + 1);
      // 그룹 목록도 최신화
      await loadGroupsFromSupabase();
    }
  };

  const upsertSpaceForGroup = async (group, previousName) => {
    try {
      if (!branchId || !group?.name) return;
      const payload = {
        branch_id: branchId,
        name: group.name,
        description: "", // ensure NOT NULL columns are satisfied
        category: group.category,
        capacity: group.capacity,
        price_per_hour: group.pricePerHour,
        is_available: true,
      };
      if (previousName && previousName !== group.name) {
        const { error: err1 } = await supabase
          .from("spaces")
          .update(payload)
          .eq("branch_id", branchId)
          .eq("name", previousName);
        if (!err1) return refreshSpaces();
      }
      const { error } = await supabase
        .from("spaces")
        .upsert(payload, { onConflict: "branch_id,name" });
      if (error) console.error("spaces upsert error", error);
      await refreshSpaces();
    } catch (e) {
      console.error("spaces upsert unexpected", e);
    }
  };

  const deleteSpaceByGroup = async (group) => {
    try {
      if (!branchId || !group?.name) return;
      const { error } = await supabase
        .from("spaces")
        .delete()
        .eq("branch_id", branchId)
        .eq("name", group.name);
      if (error) console.error("spaces delete error", error);
      await refreshSpaces();
    } catch (e) {
      console.error("spaces delete unexpected", e);
    }
  };

  const startEditGroup = (g) => {
    setEditingGroup(g);
    setGroupForm({
      name: g?.name || "",
      category: g?.category || "prayer",
      capacity: g?.capacity || 1,
      pricePerHour: g?.pricePerHour || 10000,
    });
    setShowGroupModal(true);
  };
  const resetGroupForm = () => {
    setEditingGroup(null);
    setGroupForm({
      name: "",
      category: "prayer",
      capacity: 1,
      pricePerHour: 10000,
    });
    setGroupErrors({});
  };
  const saveGroup = async () => {
    if (!validateGroup()) return;
    if (editingGroup) {
      const prevName = editingGroup.name;
      const updated = { ...editingGroup, ...groupForm };
      setRoomGroups((prev) =>
        prev.map((g) => (g.id === editingGroup.id ? updated : g))
      );
      setEditingGroup(null);
      await upsertSpaceForGroup(updated, prevName);
    } else {
      const newGroup = { id: uuid(), ...groupForm };
      setRoomGroups((prev) => [...prev, newGroup]);
      await upsertSpaceForGroup(newGroup);
    }
    resetGroupForm();
    await loadGroupsFromSupabase();
  };
  const deleteGroup = async (groupId) => {
    const target = roomGroups.find((g) => g.id === groupId);
    setRoomGroups((prev) => prev.filter((g) => g.id !== groupId));
    if (editingGroup?.id === groupId) resetGroupForm();
    await deleteSpaceByGroup(target);
    await loadGroupsFromSupabase();
  };

  const selectedElements = elements.filter((el) => selectedIds.includes(el.id));

  if (loading) {
    return (
      <div className="loading">
        <div className="loading__spinner"></div>
      </div>
    );
  }

  return (
    <div className="layout-editor">
      {toast.visible && (
        <div
          style={{
            position: "fixed",
            top: 16,
            right: 16,
            zIndex: 9999,
            background: toast.type === "error" ? "#fee2e2" : "#ecfeff",
            color: "#111827",
            border: `1px solid ${
              toast.type === "error" ? "#ef4444" : "#06b6d4"
            }`,
            padding: "10px 14px",
            borderRadius: 8,
            boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
            maxWidth: 360,
          }}
        >
          {toast.message}
        </div>
      )}
      {/* 헤더 */}
      <div className="layout-editor__header">
        <div className="layout-editor__header-content">
          <div className="layout-editor__header-left">
            <button
              onClick={() => navigate("/branches")}
              className="layout-editor__header-back-button"
            >
              <span>⬅️</span>
            </button>
            <div className="layout-editor__header-title-section">
              <h1 className="layout-editor__header-title">레이아웃 편집</h1>
              <button
                onClick={() => setShowHelpPopup(true)}
                className="layout-editor__header-help-button"
                title="레이아웃 예시 보기"
              >
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            <p className="layout-editor__header-subtitle">
              공간 배치도를 편집하세요
            </p>
          </div>

          {/* 층 선택 및 관리 */}
          <div className="layout-editor__header-right">
            <div className="layout-editor__header-floor-controls">
              <label>층:</label>
              <select
                value={currentFloor}
                onChange={(e) => handleFloorChange(parseInt(e.target.value))}
              >
                {floors.map((floor, index) => (
                  <option
                    key={`floor-${floor.floor}-${index}`}
                    value={floor.floor}
                  >
                    {floor.name}
                  </option>
                ))}
              </select>
              <button onClick={() => setShowFloorModal(true)} title="층 관리">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <button
                onClick={() => setShowGroupModal(true)}
                title="방 분류 배치"
                style={{
                  marginLeft: 6,
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  background: "white",
                  whiteSpace: "nowrap",
                }}
              >
                분류 배치
              </button>
            </div>

            {/* 저장 버튼 */}
            <div className="layout-editor__header-save-controls">
              {hasUnsavedChanges && (
                <span className="layout-editor__header-save-controls-warning">
                  저장되지 않은 변경사항
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={loading}
                className="layout-editor__header-save-controls-save-button"
              >
                {loading ? (
                  <div className="btn--loading">
                    <span>저장 중...</span>
                  </div>
                ) : (
                  "저장"
                )}
              </button>
              {hasUnsavedChanges && (
                <button
                  onClick={handleReset}
                  className="layout-editor__header-save-controls-reset-button"
                >
                  초기화
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="layout-editor__main">
        {/* 툴바 */}
        <div className="layout-editor__toolbar">
          <Toolbar
            onAddElement={handleAddElement}
            onDeleteSelected={handleDeleteSelected}
            selectedIds={selectedIds}
          />
        </div>

        {/* 캔버스 */}
        <div className="layout-editor__canvas">
          <Canvas
            elements={elements}
            selectedIds={selectedIds}
            onElementSelect={handleElementSelect}
            onElementUpdate={handleElementUpdate}
          />
        </div>

        {/* 속성 패널 공간: 항상 w-80 차지 */}
        <div className="layout-editor__properties">
          {showProperties && selectedElements.length === 1 ? (
            <PropertiesPanel
              key={spacesReloadKey}
              element={selectedElements[0]}
              onUpdate={handleElementUpdate}
              onClose={() => setShowProperties(false)}
            />
          ) : null}
        </div>
      </div>

      {/* 방 분류 배치 모달 */}
      {showGroupModal && (
        <div className="layout-editor__modal">
          <div
            className="layout-editor__modal-content"
            style={{ maxWidth: 980 }}
          >
            <div className="layout-editor__modal-header">
              <h2 className="layout-editor__modal-header-title">
                방 분류 배치
              </h2>
              <button
                onClick={() => {
                  setShowGroupModal(false);
                  resetGroupForm();
                }}
                className="layout-editor__modal-header-close"
                title="닫기"
              >
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            <div className="layout-editor__modal-body">
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  flexWrap: "wrap",
                  alignItems: "flex-start",
                }}
              >
                {/* 목록 */}
                <div style={{ flex: 1, minWidth: 380 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <h3
                      className="layout-editor__modal-section-title"
                      style={{ margin: 0 }}
                    >
                      분류 목록
                    </h3>
                    <input
                      type="text"
                      placeholder="분류 검색"
                      value={groupSearch}
                      onChange={(e) => setGroupSearch(e.target.value)}
                      className="layout-editor__modal-floor-edit-input"
                      style={{ maxWidth: 240 }}
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {roomGroups
                      .filter((g) =>
                        g.name.toLowerCase().includes(groupSearch.toLowerCase())
                      )
                      .map((g) => (
                        <div
                          key={g.id}
                          style={{
                            border: "1px solid #e2e8f0",
                            borderRadius: 12,
                            padding: 12,
                            display: "grid",
                            gridTemplateColumns: "1fr auto auto",
                            gap: 12,
                            alignItems: "center",
                            background: "#fff",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              minWidth: 200,
                            }}
                          >
                            <span
                              style={{
                                width: 10,
                                height: 10,
                                background: "#2563eb",
                                borderRadius: 999,
                              }}
                            ></span>
                            <strong
                              style={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {g.name}
                            </strong>
                            <span style={{ color: "#64748b", fontSize: 12 }}>
                              · {categoryToLabel(g.category)}
                            </span>
                          </div>
                          <span style={{ color: "#334155", minWidth: 170 }}>
                            {g.capacity}명 ·{" "}
                            {Number(g.pricePerHour || 0).toLocaleString()}
                            원/시간
                          </span>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              onClick={() => startEditGroup(g)}
                              title="편집"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => deleteGroup(g.id)}
                              title="삭제"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    {roomGroups.length === 0 && (
                      <div style={{ color: "#64748b", fontSize: 13 }}>
                        아직 분류가 없습니다. 우측에서 분류를 추가하세요.
                      </div>
                    )}
                  </div>
                </div>
                {/* 구분선 */}
                <div
                  style={{
                    width: 1,
                    alignSelf: "stretch",
                    background: "#e2e8f0",
                  }}
                />
                {/* 새 분류 추가 */}
                <div style={{ flex: 1, minWidth: 320 }}>
                  <h3
                    className="layout-editor__modal-section-title"
                    style={{ marginTop: 2 }}
                  >
                    {editingGroup ? "분류 편집" : "새 분류 추가"}
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "100px 1fr",
                      rowGap: 10,
                      columnGap: 10,
                      alignItems: "center",
                    }}
                  >
                    <label>분류명</label>
                    <input
                      type="text"
                      value={groupForm.name}
                      onChange={(e) =>
                        setGroupForm({ ...groupForm, name: e.target.value })
                      }
                      placeholder="예: 1인 기도실"
                      className="layout-editor__modal-floor-edit-input"
                      style={{ minWidth: 220 }}
                    />
                    {groupErrors.name ? (
                      <span
                        style={{
                          gridColumn: "2 / 3",
                          color: "#ef4444",
                          fontSize: 12,
                        }}
                      >
                        {groupErrors.name}
                      </span>
                    ) : null}
                    <label>카테고리</label>
                    <select
                      value={groupForm.category}
                      onChange={(e) =>
                        setGroupForm({ ...groupForm, category: e.target.value })
                      }
                    >
                      <option value="prayer">기도실</option>
                      <option value="lounge">휴게실</option>
                      <option value="bathroom">화장실</option>
                      <option value="storage">창고</option>
                      <option value="other">기타</option>
                    </select>
                    <label>정원</label>
                    <input
                      type="number"
                      value={groupForm.capacity}
                      onChange={(e) =>
                        setGroupForm({
                          ...groupForm,
                          capacity: parseInt(e.target.value || 0),
                        })
                      }
                      placeholder="0"
                      style={{ minWidth: 120 }}
                    />
                    {groupErrors.capacity ? (
                      <span
                        style={{
                          gridColumn: "2 / 3",
                          color: "#ef4444",
                          fontSize: 12,
                        }}
                      >
                        {groupErrors.capacity}
                      </span>
                    ) : null}
                    <label>요금(원/시간)</label>
                    <input
                      type="number"
                      value={groupForm.pricePerHour}
                      onChange={(e) =>
                        setGroupForm({
                          ...groupForm,
                          pricePerHour: parseInt(e.target.value || 0),
                        })
                      }
                      placeholder="0"
                      style={{ minWidth: 140 }}
                    />
                    {groupErrors.pricePerHour ? (
                      <span
                        style={{
                          gridColumn: "2 / 3",
                          color: "#ef4444",
                          fontSize: 12,
                        }}
                      >
                        {groupErrors.pricePerHour}
                      </span>
                    ) : null}
                    <div></div>
                    <button
                      onClick={saveGroup}
                      className="layout-editor__modal-add-button"
                      style={{ minWidth: 280 }}
                    >
                      {editingGroup ? "저장" : "추가"}
                    </button>
                    <div></div>
                    <button
                      onClick={resetGroupForm}
                      className="layout-editor__modal-floor-edit-cancel"
                    >
                      초기화
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 층 관리 모달 */}
      {showFloorModal && (
        <div className="layout-editor__modal">
          <div className="layout-editor__modal-content">
            <div className="layout-editor__modal-header">
              <h2 className="layout-editor__modal-header-title">층 관리</h2>
              <button
                onClick={() => setShowFloorModal(false)}
                className="layout-editor__modal-header-close"
              >
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            <div className="layout-editor__modal-body">
              <div className="layout-editor__modal-section">
                <h3 className="layout-editor__modal-section-title">현재 층</h3>
                <div className="layout-editor__modal-section-content">
                  {floors.map((floor, index) => (
                    <div
                      key={`floor-${floor.floor}-${index}`}
                      className="layout-editor__modal-floor-item"
                    >
                      {editingFloor === floor ? (
                        // 편집 모드
                        <div className="layout-editor__modal-floor-edit">
                          <input
                            type="number"
                            value={editingFloorNumber}
                            onChange={(e) =>
                              setEditingFloorNumber(e.target.value)
                            }
                            min="1"
                            className="layout-editor__modal-floor-edit-input"
                          />
                          <span className="layout-editor__modal-floor-edit-label">
                            층
                          </span>
                          <div className="layout-editor__modal-floor-edit-actions">
                            <button
                              onClick={handleSaveEditFloor}
                              className="layout-editor__modal-floor-edit-save"
                              title="저장"
                            >
                              <svg fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={handleCancelEditFloor}
                              className="layout-editor__modal-floor-edit-cancel"
                              title="취소"
                            >
                              <svg fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ) : (
                        // 일반 모드
                        <>
                          <span
                            className="layout-editor__modal-floor-item-name"
                            onClick={() => handleStartEditFloor(floor)}
                            style={{ cursor: "pointer" }}
                            title="클릭하여 층 번호 편집"
                          >
                            {floor.name}
                          </span>
                          <div className="layout-editor__modal-floor-item-actions">
                            {floor.floor === currentFloor && (
                              <span className="layout-editor__modal-floor-item-current">
                                현재
                              </span>
                            )}
                            <button
                              onClick={() => handleStartEditFloor(floor)}
                              className="layout-editor__modal-floor-item-edit"
                              title="층 번호 편집"
                            >
                              <svg fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                            {floors.length > 1 && (
                              <button
                                onClick={() => handleDeleteFloor(floor.floor)}
                                className="layout-editor__modal-floor-item-delete"
                                title="층 삭제"
                              >
                                <svg fill="currentColor" viewBox="0 0 20 20">
                                  <path
                                    fillRule="evenodd"
                                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="layout-editor__modal-section">
                <button
                  onClick={handleAddFloor}
                  className="layout-editor__modal-add-button"
                >
                  새 층 추가
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 도움말 팝업 */}
      {showHelpPopup && (
        <div className="layout-editor__help">
          <div className="layout-editor__help-content">
            <div className="layout-editor__help-header">
              <h2 className="layout-editor__help-header-title">
                레이아웃 편집 가이드
              </h2>
              <button
                onClick={() => setShowHelpPopup(false)}
                className="layout-editor__help-header-close"
              >
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            <div className="layout-editor__help-body">
              <div className="layout-editor__help-section">
                <h3 className="layout-editor__help-section-title">층 관리</h3>
                <div className="layout-editor__help-section-content">
                  <p>
                    <strong>• 층 선택:</strong> 헤더의 드롭다운에서 원하는 층을
                    선택하세요.
                  </p>
                  <p>
                    <strong>• 층 추가:</strong> 설정 아이콘을 클릭하여 새 층을
                    추가할 수 있습니다.
                  </p>
                  <p>
                    <strong>• 층 삭제:</strong> 층 관리 모달에서 불필요한 층을
                    삭제할 수 있습니다.
                  </p>
                  <p>
                    <strong>• 층별 저장:</strong> 각 층의 레이아웃은 독립적으로
                    저장됩니다.
                  </p>
                </div>
              </div>

              <div className="layout-editor__help-section">
                <h3 className="layout-editor__help-section-title">
                  레이아웃 예시
                </h3>
                <div className="layout-editor__help-examples">
                  <div className="layout-editor__help-examples-grid">
                    <div className="layout-editor__help-examples-item">
                      <h4 className="layout-editor__help-examples-item-title">
                        기본형 레이아웃
                      </h4>
                      <div className="layout-editor__help-examples-item-content">
                        <p>• 회의실 (A) - 6인용</p>
                        <p>• 오픈데스크 (B) - 10인용</p>
                        <p>• 카운터 공간</p>
                      </div>
                    </div>
                    <div className="layout-editor__help-examples-item">
                      <h4 className="layout-editor__help-examples-item-title">
                        코너형 레이아웃
                      </h4>
                      <div className="layout-editor__help-examples-item-content">
                        <p>• 코너룸 (A) - 4인용</p>
                        <p>• 메인룸 (B) - 8인용</p>
                        <p>• 입구 공간</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="layout-editor__help-section">
                <h3 className="layout-editor__help-section-title">사용 방법</h3>
                <div className="layout-editor__help-section-content">
                  <p>
                    <strong>1.</strong> 왼쪽 툴바에서 원하는 요소를 선택하여
                    캔버스에 추가하세요.
                  </p>
                  <p>
                    <strong>2.</strong> 요소를 클릭하여 선택하고 오른쪽 패널에서
                    속성을 수정하세요.
                  </p>
                  <p>
                    <strong>3.</strong> 요소를 드래그하여 위치를 조정하고,
                    크기를 변경할 수 있습니다.
                  </p>
                  <p>
                    <strong>4.</strong> 도어 요소는 회전하여 방향을 설정할 수
                    있습니다.
                  </p>
                  <p>
                    <strong>5.</strong> 완료 후 저장 버튼을 클릭하여 레이아웃을
                    저장하세요.
                  </p>
                </div>
              </div>

              <div className="layout-editor__help-section">
                <h3 className="layout-editor__help-section-title">요소 설명</h3>
                <div className="layout-editor__help-elements">
                  <div>
                    <p>
                      <strong>공간 (Space):</strong> 전체 공간의 경계를 정의
                    </p>
                    <p>
                      <strong>방 (Room):</strong> 개별 예약 가능한 공간
                    </p>
                  </div>
                  <div>
                    <p>
                      <strong>문 (Door):</strong> 출입구 및 통로
                    </p>
                    <p>
                      <strong>텍스트:</strong> 라벨 및 설명 추가
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LayoutEditor;
