import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

let supabase;

// 환경 변수 체크를 더 친화적으로 수정
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Missing Supabase environment variables. Please check your .env file."
  );
  console.error("Required variables:");
  console.error("- REACT_APP_SUPABASE_URL");
  console.error("- REACT_APP_SUPABASE_ANON_KEY");

  // 개발 환경에서는 더미 클라이언트 생성
  if (process.env.NODE_ENV === "development") {
    console.warn("Creating dummy Supabase client for development...");
    supabase = {
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () =>
          Promise.resolve({ data: null, error: new Error("Dummy client") }),
        update: () =>
          Promise.resolve({ data: null, error: new Error("Dummy client") }),
        delete: () =>
          Promise.resolve({ data: null, error: new Error("Dummy client") }),
        eq: () => ({
          single: () =>
            Promise.resolve({ data: null, error: new Error("Dummy client") }),
          order: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
    };
  } else {
    throw new Error("Missing Supabase environment variables");
  }
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };

// 데이터베이스 서비스 함수들
export const branchService = {
  // 지점 목록 조회
  async getBranches() {
    try {
      const { data, error } = await supabase
        .from("branches")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Failed to fetch branches:", error);
      return [];
    }
  },

  // 지점 상세 조회
  async getBranch(id) {
    try {
      const { data, error } = await supabase
        .from("branches")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Failed to fetch branch:", error);
      return null;
    }
  },

  // 지점 생성
  async createBranch(branchData) {
    try {
      const { data, error } = await supabase
        .from("branches")
        .insert(branchData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Failed to create branch:", error);
      throw error;
    }
  },

  // 지점 수정
  async updateBranch(id, updates) {
    try {
      const { data, error } = await supabase
        .from("branches")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Failed to update branch:", error);
      throw error;
    }
  },
};

export const layoutService = {
  // 레이아웃 목록 조회
  async getLayouts(branchId) {
    try {
      const { data, error } = await supabase
        .from("space_layouts")
        .select("*")
        .eq("branch_id", branchId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Failed to fetch layouts:", error);
      return [];
    }
  },

  // 레이아웃 상세 조회 (방 배치 정보 포함)
  async getLayout(id) {
    try {
      const { data, error } = await supabase
        .from("space_layouts")
        .select(
          `
          *,
          room_placements (
            *,
            spaces (*)
          )
        `
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Failed to fetch layout:", error);
      return null;
    }
  },

  // 레이아웃 생성
  async createLayout(layoutData) {
    try {
      const { data, error } = await supabase
        .from("space_layouts")
        .insert(layoutData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Failed to create layout:", error);
      throw error;
    }
  },

  // 레이아웃 수정
  async updateLayout(id, updates) {
    try {
      const { data, error } = await supabase
        .from("space_layouts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Failed to update layout:", error);
      throw error;
    }
  },

  // 방 배치 생성/수정
  async upsertRoomPlacement(placementData) {
    try {
      const { data, error } = await supabase
        .from("room_placements")
        .upsert(placementData, { onConflict: "id" })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Failed to upsert room placement:", error);
      throw error;
    }
  },

  // 방 배치 삭제
  async deleteRoomPlacement(id) {
    try {
      const { error } = await supabase
        .from("room_placements")
        .delete()
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("Failed to delete room placement:", error);
      throw error;
    }
  },
};

export const spaceService = {
  // 공간 목록 조회
  async getSpaces(branchId) {
    try {
      const { data, error } = await supabase
        .from("spaces")
        .select("*")
        .eq("branch_id", branchId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Failed to fetch spaces:", error);
      return [];
    }
  },

  // 공간 생성
  async createSpace(spaceData) {
    try {
      const { data, error } = await supabase
        .from("spaces")
        .insert(spaceData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Failed to create space:", error);
      throw error;
    }
  },
};
