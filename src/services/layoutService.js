import { supabase } from "../config/supabaseClient";

// 테스트용 유효한 UUID 생성 함수
const generateTestBranchId = () => {
  console.log("********************");
  console.log("********** layoutService.js line 6 **********");
  console.log("********** generateTestBranchId() **********");
  console.log("********************");
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// 기존 더미 데이터를 정리하는 함수
const cleanupDummyData = async () => {
  try {
    console.log("더미 데이터 정리 시작...");

    // 더미 branch_id로 저장된 모든 레이아웃 조회
    const { data: dummyLayouts, error: fetchError } = await supabase
      .from("space_layouts")
      .select("*")
      .eq("branch_id", "00000000-0000-4000-8000-000000000015");

    if (fetchError) {
      console.error("더미 데이터 조회 실패:", fetchError);
      return null;
    }

    if (!dummyLayouts || dummyLayouts.length === 0) {
      console.log("정리할 더미 데이터가 없습니다.");
      return null;
    }

    console.log(`정리할 더미 데이터: ${dummyLayouts.length}개`);

    // 가장 최근 레이아웃 하나만 남기고 나머지 삭제
    const sortedLayouts = dummyLayouts.sort(
      (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
    );

    const keepLayout = sortedLayouts[0];
    const deleteLayouts = sortedLayouts.slice(1);

    // 중복 레이아웃들 삭제
    for (const layout of deleteLayouts) {
      const { error: deleteError } = await supabase
        .from("space_layouts")
        .delete()
        .eq("id", layout.id);

      if (deleteError) {
        console.error(`레이아웃 삭제 실패 (${layout.id}):`, deleteError);
      }
    }

    console.log(`${deleteLayouts.length}개의 중복 레이아웃 삭제 완료`);
    return keepLayout;
  } catch (error) {
    console.error("더미 데이터 정리 실패:", error);
    return null;
  }
};

export const layoutService = {
  // 레이아웃 저장
  async saveLayout(layoutData) {
    try {
      console.log("저장 시도:", layoutData);

      // 더미 branch_id를 실제 UUID로 변환
      let actualBranchId = layoutData.branchId;
      if (
        !actualBranchId ||
        actualBranchId === "00000000-0000-4000-8000-000000000015"
      ) {
        // 로컬 스토리지에서 기존 데이터 찾기
        const keys = Object.keys(localStorage);
        const layoutKeys = keys.filter((key) => key.startsWith("layout_"));
        if (layoutKeys.length > 0) {
          // 첫 번째 레이아웃의 branch_id 사용
          const firstKey = layoutKeys[0];
          actualBranchId = firstKey.split("_")[1];
          console.log("기존 레이아웃에서 branch_id 찾음:", actualBranchId);
        } else {
          // 더미 데이터 정리 후 새로운 UUID 생성
          await cleanupDummyData();
          actualBranchId = generateTestBranchId();
          console.log("새로운 테스트 branch_id 생성:", actualBranchId);
        }
      }

      // 먼저 로컬 스토리지에 백업 저장
      localStorage.setItem(
        `layout_${actualBranchId}_${layoutData.floor || 1}`,
        JSON.stringify({ ...layoutData, branchId: actualBranchId })
      );
      console.log("로컬 스토리지 백업 완료");

      const floor = layoutData.floor || 1;

      // 기존 레이아웃이 있는지 확인 (branch_id와 floor로 정확히 조회)
      const { data: existingData, error: checkError } = await supabase
        .from("space_layouts")
        .select("id")
        .eq("branch_id", actualBranchId)
        .eq("floor", floor);

      if (checkError) {
        console.error("기존 데이터 확인 오류:", checkError);
        return {
          success: true,
          source: "local",
          branchId: actualBranchId,
        };
      }

      let result;
      if (existingData && existingData.length > 0) {
        // 기존 데이터가 있으면 업데이트 (branch_id와 floor로 정확히 업데이트)
        const { data, error } = await supabase
          .from("space_layouts")
          .update({
            name: layoutData.templateId || `${floor}층`,
            description: `레이아웃 에디터로 생성된 ${floor}층 레이아웃`,
            layout_data: {
              elements: layoutData.elements || [],
              templateId: layoutData.templateId,
              floor: floor,
              createdAt: layoutData.createdAt,
              updatedAt: layoutData.updatedAt,
            },
            width: 800,
            height: 600,
            updated_at: layoutData.updatedAt,
          })
          .eq("branch_id", actualBranchId)
          .eq("floor", floor)
          .select()
          .single();

        if (error) {
          console.error("Supabase 업데이트 오류:", error);
          return {
            success: true,
            source: "local",
            branchId: actualBranchId,
          };
        }
        result = data;
      } else {
        // 기존 데이터가 없으면 새로 생성
        const { data, error } = await supabase
          .from("space_layouts")
          .insert({
            branch_id: actualBranchId,
            floor: floor,
            name: layoutData.templateId || `${floor}층`,
            description: `레이아웃 에디터로 생성된 ${floor}층 레이아웃`,
            layout_data: {
              elements: layoutData.elements || [],
              templateId: layoutData.templateId,
              floor: floor,
              createdAt: layoutData.createdAt,
              updatedAt: layoutData.updatedAt,
            },
            width: 800,
            height: 600,
            created_at: layoutData.createdAt,
            updated_at: layoutData.updatedAt,
          })
          .select()
          .single();

        if (error) {
          console.error("Supabase 삽입 오류:", error);
          return {
            success: true,
            source: "local",
            branchId: actualBranchId,
          };
        }
        result = data;
      }

      console.log("Supabase 저장 성공:", result);
      return {
        success: true,
        source: "supabase",
        data: result,
        branchId: actualBranchId,
      };
    } catch (error) {
      console.error("레이아웃 저장 실패:", error);

      // 더미 branch_id를 실제 UUID로 변환
      let actualBranchId = layoutData.branchId;
      if (
        !actualBranchId ||
        actualBranchId === "00000000-0000-4000-8000-000000000015"
      ) {
        const keys = Object.keys(localStorage);
        const layoutKeys = keys.filter((key) => key.startsWith("layout_"));
        if (layoutKeys.length > 0) {
          const firstKey = layoutKeys[0];
          actualBranchId = firstKey.split("_")[1];
        } else {
          actualBranchId = generateTestBranchId();
        }
      }

      const localBackup = localStorage.getItem(
        `layout_${actualBranchId}_${layoutData.floor || 1}`
      );
      if (localBackup) {
        console.log("로컬 스토리지 백업이 있으므로 성공으로 처리");
        return {
          success: true,
          source: "local",
          branchId: actualBranchId,
        };
      }
      throw error;
    }
  },

  // 레이아웃 불러오기
  async getLayout(branchId, floor = 1) {
    console.log("********************");
    console.log("********** layoutService.js line 232 **********");
    console.log("********** getLayout() **********");
    console.log("********************");
    try {
      console.log("레이아웃 불러오기 시도:", branchId, "층:", floor);

      // 더미 branch_id 처리
      let actualBranchId = branchId;
      if (!branchId || branchId === "00000000-0000-4000-8000-000000000015") {
        // 로컬 스토리지에서 기존 데이터 찾기
        const keys = Object.keys(localStorage);
        const layoutKeys = keys.filter((key) => key.startsWith("layout_"));
        if (layoutKeys.length > 0) {
          // 첫 번째 레이아웃의 branch_id 사용
          const firstKey = layoutKeys[0];
          actualBranchId = firstKey.split("_")[1];
          console.log("기존 레이아웃에서 branch_id 찾음:", actualBranchId);
        } else {
          // 더미 데이터 정리 후 새로운 UUID 생성
          await cleanupDummyData();
          actualBranchId = generateTestBranchId();
          console.log("새로운 테스트 branch_id 생성:", actualBranchId);
        }
      }

      // Supabase에서 정확한 층의 레이아웃 조회
      const { data, error } = await supabase
        .from("space_layouts")
        .select("*")
        .eq("branch_id", actualBranchId)
        .eq("floor", floor)
        .maybeSingle();

      if (error) {
        console.error("Supabase 레이아웃 불러오기 오류:", error);
        // Supabase 실패 시 로컬 스토리지에서 시도
        const localData = localStorage.getItem(
          `layout_${actualBranchId}_${floor}`
        );
        if (localData) {
          console.log("로컬 스토리지에서 레이아웃 불러옴");
          return JSON.parse(localData);
        }
        return null;
      }

      if (data) {
        console.log("Supabase에서 레이아웃 불러오기 성공:", data);
        // layout_data에서 floor 정보 확인
        const layoutFloor = data.layout_data?.floor || data.floor || floor;

        // space_layouts 테이블 구조에 맞게 데이터 변환
        return {
          branchId: data.branch_id,
          templateId: data.layout_data?.templateId || data.name,
          elements: data.layout_data?.elements || [],
          floor: layoutFloor,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }

      // Supabase에 데이터가 없으면 로컬 스토리지에서 시도
      const localData = localStorage.getItem(
        `layout_${actualBranchId}_${floor}`
      );
      if (localData) {
        console.log("로컬 스토리지에서 레이아웃 불러옴");
        return JSON.parse(localData);
      }

      console.log("저장된 레이아웃이 없음");
      return null;
    } catch (error) {
      console.error("레이아웃 불러오기 실패:", error);
      // 로컬 스토리지에서 시도
      const actualBranchId =
        branchId === "00000000-0000-4000-8000-000000000015"
          ? generateTestBranchId()
          : branchId;

      const localData = localStorage.getItem(
        `layout_${actualBranchId}_${floor}`
      );
      if (localData) {
        console.log("로컬 스토리지에서 레이아웃 불러옴");
        return JSON.parse(localData);
      }
      return null;
    }
  },

  // 모든 층의 레이아웃 목록 조회
  async getAllFloors(branchId) {
    try {
      // 더미 branch_id 처리
      let actualBranchId = branchId;
      if (!branchId || branchId === "00000000-0000-4000-8000-000000000015") {
        // 로컬 스토리지에서 기존 데이터 찾기
        const keys = Object.keys(localStorage);
        const layoutKeys = keys.filter((key) => key.startsWith("layout_"));
        if (layoutKeys.length > 0) {
          const firstKey = layoutKeys[0];
          actualBranchId = firstKey.split("_")[1];
          console.log("기존 레이아웃에서 branch_id 찾음:", actualBranchId);
        } else {
          // 더미 데이터 정리 후 새로운 UUID 생성
          await cleanupDummyData();
          actualBranchId = generateTestBranchId();
          console.log("새로운 테스트 branch_id 생성:", actualBranchId);
        }
      }

      const { data, error } = await supabase
        .from("space_layouts")
        .select("*")
        .eq("branch_id", actualBranchId)
        .order("floor", { ascending: true });

      if (error) {
        console.error("층 목록 조회 실패:", error);
        throw error;
      }

      if (data && data.length > 0) {
        // floor 컬럼과 layout_data에서 floor 정보 모두 확인
        const floors = data.map((item) => ({
          floor: item.floor || item.layout_data?.floor || 1,
          name: `${item.floor || item.layout_data?.floor || 1}층`,
          created_at: item.created_at,
          updated_at: item.updated_at,
        }));
        return floors;
      }

      // Supabase에 데이터가 없으면 로컬 스토리지에서 확인
      const floors = [];
      let floor = 1;
      while (true) {
        const localData = localStorage.getItem(
          `layout_${actualBranchId}_${floor}`
        );
        if (localData) {
          floors.push({
            floor: floor,
            name: `${floor}층`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          floor++;
        } else {
          break;
        }
      }
      return floors.length > 0 ? floors : [{ floor: 1, name: "1층" }];
    } catch (error) {
      console.error("층 목록 조회 실패:", error);
      // 로컬 스토리지에서 층 정보 확인
      const actualBranchId =
        branchId === "00000000-0000-4000-8000-000000000015"
          ? generateTestBranchId()
          : branchId;

      const floors = [];
      let floor = 1;
      while (true) {
        const localData = localStorage.getItem(
          `layout_${actualBranchId}_${floor}`
        );
        if (localData) {
          floors.push({
            floor: floor,
            name: `${floor}층`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          floor++;
        } else {
          break;
        }
      }
      return floors.length > 0 ? floors : [{ floor: 1, name: "1층" }];
    }
  },

  // 레이아웃 삭제
  async deleteLayout(branchId, floor = 1) {
    try {
      // 더미 branch_id 처리
      let actualBranchId = branchId;
      if (!branchId || branchId === "00000000-0000-4000-8000-000000000015") {
        // 로컬 스토리지에서 기존 데이터 찾기
        const keys = Object.keys(localStorage);
        const layoutKeys = keys.filter((key) => key.startsWith("layout_"));
        if (layoutKeys.length > 0) {
          const firstKey = layoutKeys[0];
          actualBranchId = firstKey.split("_")[1];
        } else {
          actualBranchId = generateTestBranchId();
        }
      }

      // branch_id와 floor로 정확한 레이아웃 삭제
      const { error } = await supabase
        .from("space_layouts")
        .delete()
        .eq("branch_id", actualBranchId)
        .eq("floor", floor);

      if (error) {
        console.error("Supabase 삭제 오류:", error);
        // 로컬 스토리지에서 삭제
        localStorage.removeItem(`layout_${actualBranchId}_${floor}`);
        return true;
      }

      // 로컬 스토리지에서도 삭제
      localStorage.removeItem(`layout_${actualBranchId}_${floor}`);
      return true;
    } catch (error) {
      console.error("레이아웃 삭제 실패:", error);
      // 로컬 스토리지에서 삭제
      const actualBranchId =
        branchId === "00000000-0000-4000-8000-000000000015"
          ? generateTestBranchId()
          : branchId;

      localStorage.removeItem(`layout_${actualBranchId}_${floor}`);
      return true;
    }
  },

  // 층 번호 업데이트
  async updateFloorNumber(branchId, oldFloor, newFloor) {
    try {
      // 더미 branch_id 처리
      let actualBranchId = branchId;
      if (!branchId || branchId === "00000000-0000-4000-8000-000000000015") {
        // 로컬 스토리지에서 기존 데이터 찾기
        const keys = Object.keys(localStorage);
        const layoutKeys = keys.filter((key) => key.startsWith("layout_"));
        if (layoutKeys.length > 0) {
          const firstKey = layoutKeys[0];
          actualBranchId = firstKey.split("_")[1];
        } else {
          actualBranchId = generateTestBranchId();
        }
      }

      // Supabase에서 해당 레이아웃 조회 (branch_id와 oldFloor로 정확히 조회)
      const { data, error } = await supabase
        .from("space_layouts")
        .select("*")
        .eq("branch_id", actualBranchId)
        .eq("floor", oldFloor)
        .maybeSingle();

      if (error) {
        console.error("Supabase 레이아웃 조회 오류:", error);
        return false;
      }

      if (data) {
        // layout_data에서 floor 정보 업데이트
        const updatedLayoutData = {
          ...data.layout_data,
          floor: newFloor,
          updatedAt: new Date().toISOString(),
        };

        // Supabase 업데이트 (branch_id와 oldFloor로 정확히 업데이트)
        const { error: updateError } = await supabase
          .from("space_layouts")
          .update({
            floor: newFloor,
            layout_data: updatedLayoutData,
            name: `${newFloor}층`,
            description: `레이아웃 에디터로 생성된 ${newFloor}층 레이아웃`,
            updated_at: new Date().toISOString(),
          })
          .eq("branch_id", actualBranchId)
          .eq("floor", oldFloor);

        if (updateError) {
          console.error("Supabase 층 번호 업데이트 오류:", updateError);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error("층 번호 업데이트 실패:", error);
      return false;
    }
  },

  // 모든 레이아웃 목록 조회
  async getAllLayouts() {
    try {
      const { data, error } = await supabase
        .from("space_layouts")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("레이아웃 목록 조회 실패:", error);
      throw error;
    }
  },

  // 더미 데이터 정리 함수 (외부에서 호출 가능)
  async cleanupDummyData() {
    return await cleanupDummyData();
  },

  // 즉시 더미 데이터 정리 및 마이그레이션
  async migrateDummyData() {
    try {
      console.log("더미 데이터 마이그레이션 시작...");

      // 더미 branch_id로 저장된 모든 레이아웃 조회
      const { data: dummyLayouts, error: fetchError } = await supabase
        .from("space_layouts")
        .select("*")
        .eq("branch_id", "00000000-0000-4000-8000-000000000015");

      if (fetchError) {
        console.error("더미 데이터 조회 실패:", fetchError);
        return false;
      }

      if (!dummyLayouts || dummyLayouts.length === 0) {
        console.log("마이그레이션할 더미 데이터가 없습니다.");
        return true;
      }

      console.log(`마이그레이션할 더미 데이터: ${dummyLayouts.length}개`);

      // 가장 최근 레이아웃 하나만 선택
      const sortedLayouts = dummyLayouts.sort(
        (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
      );

      const keepLayout = sortedLayouts[0];
      const deleteLayouts = sortedLayouts.slice(1);

      // 새로운 UUID 생성
      const newBranchId = generateTestBranchId();
      console.log("새로운 branch_id 생성:", newBranchId);

      // 선택된 레이아웃을 새로운 branch_id로 업데이트
      const { error: updateError } = await supabase
        .from("space_layouts")
        .update({
          branch_id: newBranchId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", keepLayout.id);

      if (updateError) {
        console.error("레이아웃 업데이트 실패:", updateError);
        return false;
      }

      // 중복 레이아웃들 삭제
      for (const layout of deleteLayouts) {
        const { error: deleteError } = await supabase
          .from("space_layouts")
          .delete()
          .eq("id", layout.id);

        if (deleteError) {
          console.error(`레이아웃 삭제 실패 (${layout.id}):`, deleteError);
        }
      }

      console.log(`${deleteLayouts.length}개의 중복 레이아웃 삭제 완료`);
      console.log("마이그레이션 완료. 새로운 branch_id:", newBranchId);

      return newBranchId;
    } catch (error) {
      console.error("더미 데이터 마이그레이션 실패:", error);
      return false;
    }
  },
};
