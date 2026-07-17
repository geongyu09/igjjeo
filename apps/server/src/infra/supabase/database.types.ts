/**
 * Supabase 스키마 타입.
 *
 * 마이그레이션과 손으로 맞춰 둔 타입이다. 마이그레이션을 추가/변경하면 아래로
 * 재생성해 동기화한다(현재는 groups 트랜잭션 범위만 반영):
 *   supabase gen types typescript --linked > apps/server/src/infra/supabase/database.types.ts
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          masked_name: string;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          display_name: string;
          masked_name: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          masked_name?: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      auth_credentials: {
        Row: {
          id: string;
          profile_id: string;
          email: string;
          password_hash: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          email: string;
          password_hash: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          email?: string;
          password_hash?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "auth_credentials_profile_id_fkey";
            columns: ["profile_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      refresh_tokens: {
        Row: {
          id: string;
          profile_id: string;
          token_hash: string;
          expires_at: string;
          revoked_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          token_hash: string;
          expires_at: string;
          revoked_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          token_hash?: string;
          expires_at?: string;
          revoked_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "refresh_tokens_profile_id_fkey";
            columns: ["profile_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      groups: {
        Row: {
          id: string;
          name: string;
          invite_code: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          invite_code: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          invite_code?: string;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          group_id: string;
          reporter_id: string;
          raw_text: string;
          photo_url: string | null;
          status: string;
          parent_article_id: string | null;
          draft_articles: Json | null;
          draft_generated_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          reporter_id: string;
          raw_text: string;
          photo_url?: string | null;
          status?: string;
          parent_article_id?: string | null;
          draft_articles?: Json | null;
          draft_generated_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          reporter_id?: string;
          raw_text?: string;
          photo_url?: string | null;
          status?: string;
          parent_article_id?: string | null;
          draft_articles?: Json | null;
          draft_generated_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      articles: {
        Row: {
          id: string;
          report_id: string;
          group_id: string;
          outlet_key: string;
          headline: string;
          body: string;
          reporter_name: string;
          published_at: string;
          is_correction: boolean;
          corrects_article_id: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          group_id: string;
          outlet_key: string;
          headline: string;
          body: string;
          reporter_name: string;
          published_at?: string;
          is_correction?: boolean;
          corrects_article_id?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          report_id?: string;
          group_id?: string;
          outlet_key?: string;
          headline?: string;
          body?: string;
          reporter_name?: string;
          published_at?: string;
          is_correction?: boolean;
          corrects_article_id?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          role: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          role?: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          role?: string;
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey";
            columns: ["group_id"];
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      group_summaries: {
        Row: {
          id: string;
          name: string;
          invite_code: string;
          created_by: string;
          created_at: string;
          member_count: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      create_account: {
        Args: {
          p_email: string;
          p_password_hash: string;
          p_display_name: string;
          p_masked_name: string;
        };
        Returns: {
          id: string;
          display_name: string;
          masked_name: string;
          avatar_url: string | null;
          created_at: string;
        }[];
      };
      create_group_with_owner: {
        Args: { p_user_id: string; p_name: string };
        Returns: {
          id: string;
          name: string;
          invite_code: string;
          role: string;
          member_count: number;
          created_at: string;
        }[];
      };
      list_my_groups: {
        Args: { p_user_id: string; p_limit: number; p_before?: string | null };
        Returns: {
          id: string;
          name: string;
          invite_code: string;
          role: string;
          member_count: number;
          created_at: string;
          joined_at: string;
        }[];
      };
      rotate_invite_code: {
        Args: { p_group_id: string };
        Returns: string;
      };
      join_group: {
        Args: { p_user_id: string; p_invite_code: string };
        Returns: {
          id: string;
          name: string;
          invite_code: string;
          role: string;
          member_count: number;
          created_at: string;
        }[];
      };
      list_group_members: {
        Args: { p_group_id: string };
        Returns: {
          user_id: string;
          display_name: string;
          masked_name: string;
          role: string;
          joined_at: string;
        }[];
      };
      publish_report: {
        Args: { p_report_id: string; p_outlet_keys: string[] };
        Returns: {
          id: string;
          report_id: string;
          group_id: string;
          outlet_key: string;
          headline: string;
          body: string;
          reporter_name: string;
          published_at: string;
          is_correction: boolean;
          corrects_article_id: string | null;
          is_active: boolean;
          created_at: string;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
