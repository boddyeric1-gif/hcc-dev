export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      hcc_event: {
        Row: {
          app_version: string | null
          created_at: string
          id: number
          name: string
          platform: string
          props: Json
          session_id: string | null
          telegram_user_id: number | null
        }
        Insert: {
          app_version?: string | null
          created_at?: string
          id?: number
          name: string
          platform?: string
          props?: Json
          session_id?: string | null
          telegram_user_id?: number | null
        }
        Update: {
          app_version?: string | null
          created_at?: string
          id?: number
          name?: string
          platform?: string
          props?: Json
          session_id?: string | null
          telegram_user_id?: number | null
        }
        Relationships: []
      }
      hcc_ledger: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          id: string
          idempotency_key: string | null
          metadata: Json
          reason: string
          reference: string | null
          telegram_user_id: number
          tx_type: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          reason?: string
          reference?: string | null
          telegram_user_id: number
          tx_type: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          reason?: string
          reference?: string | null
          telegram_user_id?: number
          tx_type?: string
        }
        Relationships: []
      }
      hcc_player: {
        Row: {
          acquisition_at: string | null
          acquisition_campaign: string | null
          acquisition_creative: string | null
          acquisition_source: string | null
          app_version: string | null
          created_at: string
          first_purchase_at: string | null
          first_seen_at: string
          last_purchase_at: string | null
          last_seen_at: string
          miner_tier: number
          op_slots: number
          platform: string
          prestige: number
          rank_index: number
          referred_by_player_id: number | null
          rig_tier: number
          telegram_user_id: number
          total_sessions: number
          total_stars_spent: number
          updated_at: string
        }
        Insert: {
          acquisition_at?: string | null
          acquisition_campaign?: string | null
          acquisition_creative?: string | null
          acquisition_source?: string | null
          app_version?: string | null
          created_at?: string
          first_purchase_at?: string | null
          first_seen_at?: string
          last_purchase_at?: string | null
          last_seen_at?: string
          miner_tier?: number
          op_slots?: number
          platform?: string
          prestige?: number
          rank_index?: number
          referred_by_player_id?: number | null
          rig_tier?: number
          telegram_user_id: number
          total_sessions?: number
          total_stars_spent?: number
          updated_at?: string
        }
        Update: {
          acquisition_at?: string | null
          acquisition_campaign?: string | null
          acquisition_creative?: string | null
          acquisition_source?: string | null
          app_version?: string | null
          created_at?: string
          first_purchase_at?: string | null
          first_seen_at?: string
          last_purchase_at?: string | null
          last_seen_at?: string
          miner_tier?: number
          op_slots?: number
          platform?: string
          prestige?: number
          rank_index?: number
          referred_by_player_id?: number | null
          rig_tier?: number
          telegram_user_id?: number
          total_sessions?: number
          total_stars_spent?: number
          updated_at?: string
        }
        Relationships: []
      }
      hcc_profile: {
        Row: {
          contract: string | null
          created_at: string
          imported_balance: number | null
          installed: Json
          last_settled_at: string
          migrated_at: string | null
          migration_complete: boolean
          migration_source: string | null
          migration_version: number | null
          miner_units: Json
          mining_allowance: number
          owned: string[]
          prestige: number
          telegram_user_id: number
          updated_at: string
        }
        Insert: {
          contract?: string | null
          created_at?: string
          imported_balance?: number | null
          installed?: Json
          last_settled_at?: string
          migrated_at?: string | null
          migration_complete?: boolean
          migration_source?: string | null
          migration_version?: number | null
          miner_units?: Json
          mining_allowance?: number
          owned?: string[]
          prestige?: number
          telegram_user_id: number
          updated_at?: string
        }
        Update: {
          contract?: string | null
          created_at?: string
          imported_balance?: number | null
          installed?: Json
          last_settled_at?: string
          migrated_at?: string | null
          migration_complete?: boolean
          migration_source?: string | null
          migration_version?: number | null
          miner_units?: Json
          mining_allowance?: number
          owned?: string[]
          prestige?: number
          telegram_user_id?: number
          updated_at?: string
        }
        Relationships: []
      }
      hcc_progression_milestone: {
        Row: {
          milestone: string
          reached_at: string
          telegram_user_id: number
        }
        Insert: {
          milestone: string
          reached_at?: string
          telegram_user_id: number
        }
        Update: {
          milestone?: string
          reached_at?: string
          telegram_user_id?: number
        }
        Relationships: []
      }
      hcc_session: {
        Row: {
          anon_id: string | null
          app_version: string | null
          ended_at: string | null
          id: string
          platform: string
          source: string | null
          started_at: string
          telegram_user_id: number | null
        }
        Insert: {
          anon_id?: string | null
          app_version?: string | null
          ended_at?: string | null
          id?: string
          platform?: string
          source?: string | null
          started_at?: string
          telegram_user_id?: number | null
        }
        Update: {
          anon_id?: string | null
          app_version?: string | null
          ended_at?: string | null
          id?: string
          platform?: string
          source?: string | null
          started_at?: string
          telegram_user_id?: number | null
        }
        Relationships: []
      }
      hcc_wallet: {
        Row: {
          balance: number
          created_at: string
          telegram_user_id: number
          updated_at: string
        }
        Insert: {
          balance?: number
          created_at?: string
          telegram_user_id: number
          updated_at?: string
        }
        Update: {
          balance?: number
          created_at?: string
          telegram_user_id?: number
          updated_at?: string
        }
        Relationships: []
      }
      premium_pass: {
        Row: {
          created_at: string
          expires_at: string
          last_claim_on: string | null
          telegram_user_id: number
          total_days_purchased: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          last_claim_on?: string | null
          telegram_user_id: number
          total_days_purchased?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          last_claim_on?: string | null
          telegram_user_id?: number
          total_days_purchased?: number
          updated_at?: string
        }
        Relationships: []
      }
      star_purchases: {
        Row: {
          claimed_at: string | null
          created_at: string
          credits: number
          id: string
          item_ids: string[]
          kind: string
          product_id: string
          provider_payment_charge_id: string | null
          stars: number
          sub_days: number
          telegram_payment_charge_id: string
          telegram_user_id: number
        }
        Insert: {
          claimed_at?: string | null
          created_at?: string
          credits: number
          id?: string
          item_ids?: string[]
          kind?: string
          product_id: string
          provider_payment_charge_id?: string | null
          stars: number
          sub_days?: number
          telegram_payment_charge_id: string
          telegram_user_id: number
        }
        Update: {
          claimed_at?: string | null
          created_at?: string
          credits?: number
          id?: string
          item_ids?: string[]
          kind?: string
          product_id?: string
          provider_payment_charge_id?: string | null
          stars?: number
          sub_days?: number
          telegram_payment_charge_id?: string
          telegram_user_id?: number
        }
        Relationships: []
      }
    }
    Views: {
      hcc_metrics_daily: {
        Row: {
          active_players: number | null
          day: string | null
          sessions: number | null
        }
        Relationships: []
      }
      hcc_metrics_funnel: {
        Row: {
          events: number | null
          players: number | null
          step: string | null
        }
        Relationships: []
      }
      hcc_metrics_retention: {
        Row: {
          cohort_day: string | null
          cohort_size: number | null
          d1: number | null
          d14: number | null
          d3: number | null
          d30: number | null
          d7: number | null
        }
        Relationships: []
      }
      hcc_metrics_revenue: {
        Row: {
          kind: string | null
          paying_players: number | null
          product_id: string | null
          total_stars: number | null
          transactions: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      hcc_account: { Args: { _user_id: number }; Returns: Json }
      hcc_apply: {
        Args: {
          _amount: number
          _idempotency_key?: string
          _metadata?: Json
          _reason?: string
          _reference?: string
          _tx_type: string
          _user_id: number
        }
        Returns: Json
      }
      hcc_claim_daily: { Args: { _user_id: number }; Returns: boolean }
      hcc_end_session: { Args: { _session_id: string }; Returns: undefined }
      hcc_ensure_account: { Args: { _user_id: number }; Returns: undefined }
      hcc_grant_premium: {
        Args: { _days: number; _user_id: number }
        Returns: string
      }
      hcc_mark_milestone: {
        Args: { _milestone: string; _user_id: number }
        Returns: boolean
      }
      hcc_migrate_legacy: {
        Args: {
          _claimed_balance: number
          _max_import: number
          _source: string
          _user_id: number
          _version: number
        }
        Returns: Json
      }
      hcc_open_settlement: {
        Args: { _max_seconds: number; _user_id: number }
        Returns: Json
      }
      hcc_purchase: {
        Args: {
          _idempotency_key: string
          _is_contract: boolean
          _is_miner: boolean
          _item_id: string
          _price: number
          _slot: string
          _stackable: boolean
          _user_id: number
        }
        Returns: Json
      }
      hcc_record_events: {
        Args: {
          _app_version: string
          _events: Json
          _platform: string
          _session_id: string
          _user_id: number
        }
        Returns: number
      }
      hcc_set_prestige: {
        Args: { _level: number; _user_id: number }
        Returns: number
      }
      hcc_settle_mining: {
        Args: {
          _claimed_credits: number
          _idempotency_key: string
          _max_seconds: number
          _rate_per_sec: number
          _user_id: number
        }
        Returns: Json
      }
      hcc_start_session: {
        Args: {
          _anon_id: string
          _app_version: string
          _campaign: string
          _creative: string
          _platform: string
          _source: string
          _user_id: number
        }
        Returns: string
      }
      hcc_sync_player_progress: {
        Args: {
          _miner_tier: number
          _op_slots: number
          _prestige: number
          _rank_index: number
          _rig_tier: number
          _user_id: number
        }
        Returns: undefined
      }
      hcc_sync_player_purchases: {
        Args: { _user_id: number }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
