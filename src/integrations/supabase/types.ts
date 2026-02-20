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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      configuracoes: {
        Row: {
          ativo: boolean
          chave: string
          created_at: string
          deleted_at: string | null
          id: string
          updated_at: string
          valor_numeric: number | null
          valor_texto: string | null
        }
        Insert: {
          ativo?: boolean
          chave: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          updated_at?: string
          valor_numeric?: number | null
          valor_texto?: string | null
        }
        Update: {
          ativo?: boolean
          chave?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          updated_at?: string
          valor_numeric?: number | null
          valor_texto?: string | null
        }
        Relationships: []
      }
      dados_administrativos: {
        Row: {
          id: string
          data: string
          total_leads: number
          ia_leads: number
          robo_leads: number
          facebook_leads: number
          sem_contato_ia: number
          sem_contato_robo: number
          sem_contato_facebook: number
          em_negociacao_ia: number
          em_negociacao_robo: number
          em_negociacao_facebook: number
          cadastradas_ia: number
          cadastradas_robo: number
          cadastradas_facebook: number
          cadastradas_loja: number
          cadastradas_indicacao: number
          cadastradas_pap: number
          habilitada_ia: number
          habilitada_robo: number
          habilitada_facebook: number
          created_by: string
          ativo: boolean
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          data?: string
          total_leads?: number
          ia_leads?: number
          robo_leads?: number
          facebook_leads?: number
          sem_contato_ia?: number
          sem_contato_robo?: number
          sem_contato_facebook?: number
          em_negociacao_ia?: number
          em_negociacao_robo?: number
          em_negociacao_facebook?: number
          cadastradas_ia?: number
          cadastradas_robo?: number
          cadastradas_facebook?: number
          cadastradas_loja?: number
          cadastradas_indicacao?: number
          cadastradas_pap?: number
          habilitada_ia?: number
          habilitada_robo?: number
          habilitada_facebook?: number
          created_by?: string
          ativo?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          data?: string
          total_leads?: number
          ia_leads?: number
          robo_leads?: number
          facebook_leads?: number
          sem_contato_ia?: number
          sem_contato_robo?: number
          sem_contato_facebook?: number
          em_negociacao_ia?: number
          em_negociacao_robo?: number
          em_negociacao_facebook?: number
          cadastradas_ia?: number
          cadastradas_robo?: number
          cadastradas_facebook?: number
          cadastradas_loja?: number
          cadastradas_indicacao?: number
          cadastradas_pap?: number
          habilitada_ia?: number
          habilitada_robo?: number
          habilitada_facebook?: number
          created_by?: string
          ativo?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      gastos_facebook_ads: {
        Row: {
          ativo: boolean
          created_at: string
          data: string
          deleted_at: string | null
          id: string
          updated_at: string
          valor: number
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          data: string
          deleted_at?: string | null
          id?: string
          updated_at?: string
          valor: number
        }
        Update: {
          ativo?: boolean
          created_at?: string
          data?: string
          deleted_at?: string | null
          id?: string
          updated_at?: string
          valor?: number
        }
        Relationships: []
      }
      formas_pagamento: {
        Row: {
          ativo: boolean
          created_at: string
          deleted_at: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          deleted_at?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          deleted_at?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      origens_lead: {
        Row: {
          ativo: boolean
          created_at: string
          deleted_at: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          deleted_at?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          deleted_at?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      pacotes_internet: {
        Row: {
          ativo: boolean
          created_at: string
          deleted_at: string | null
          id: string
          nome: string
          produto_id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          deleted_at?: string | null
          id?: string
          nome: string
          produto_id: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          deleted_at?: string | null
          id?: string
          nome?: string
          produto_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pacotes_internet_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_internet"
            referencedColumns: ["id"]
          },
        ]
      }
      pacotes_sky: {
        Row: {
          ativo: boolean
          created_at: string
          deleted_at: string | null
          id: string
          nome: string
          produto_id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          deleted_at?: string | null
          id?: string
          nome: string
          produto_id: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          deleted_at?: string | null
          id?: string
          nome?: string
          produto_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pacotes_sky_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_sky"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos_internet: {
        Row: {
          ativo: boolean
          created_at: string
          deleted_at: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          deleted_at?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          deleted_at?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      produtos_sky: {
        Row: {
          ativo: boolean
          created_at: string
          deleted_at: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          deleted_at?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          deleted_at?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          created_at: string
          email: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      vendas_internet: {
        Row: {
          ativo: boolean
          cidade: string | null
          created_at: string
          created_by: string
          data_venda: string
          deleted_at: string | null
          forma_pagamento_id: string
          id: string
          origem_lead_id: string | null
          pacote_id: string | null
          produto_id: string
          updated_at: string
          vendedor_id: string
        }
        Insert: {
          ativo?: boolean
          cidade?: string | null
          created_at?: string
          created_by?: string
          data_venda?: string
          deleted_at?: string | null
          forma_pagamento_id: string
          id?: string
          origem_lead_id?: string | null
          pacote_id?: string | null
          produto_id: string
          updated_at?: string
          vendedor_id: string
        }
        Update: {
          ativo?: boolean
          cidade?: string | null
          created_at?: string
          created_by?: string
          data_venda?: string
          deleted_at?: string | null
          forma_pagamento_id?: string
          id?: string
          origem_lead_id?: string | null
          pacote_id?: string | null
          produto_id?: string
          updated_at?: string
          vendedor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendas_internet_forma_pagamento_id_fkey"
            columns: ["forma_pagamento_id"]
            isOneToOne: false
            referencedRelation: "formas_pagamento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_internet_origem_lead_id_fkey"
            columns: ["origem_lead_id"]
            isOneToOne: false
            referencedRelation: "origens_lead"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_internet_pacote_id_fkey"
            columns: ["pacote_id"]
            isOneToOne: false
            referencedRelation: "pacotes_internet"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_internet_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_internet"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_internet_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "vendedores"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas_sky: {
        Row: {
          ativo: boolean
          cidade: string | null
          created_at: string
          created_by: string
          data_venda: string
          deleted_at: string | null
          forma_pagamento_id: string
          id: string
          origem_lead_id: string | null
          pacote_id: string | null
          produto_id: string
          seguro: boolean
          updated_at: string
          vendedor_id: string
        }
        Insert: {
          ativo?: boolean
          cidade?: string | null
          created_at?: string
          created_by?: string
          data_venda?: string
          deleted_at?: string | null
          forma_pagamento_id: string
          id?: string
          origem_lead_id?: string | null
          pacote_id?: string | null
          produto_id: string
          seguro?: boolean
          updated_at?: string
          vendedor_id: string
        }
        Update: {
          ativo?: boolean
          cidade?: string | null
          created_at?: string
          created_by?: string
          data_venda?: string
          deleted_at?: string | null
          forma_pagamento_id?: string
          id?: string
          origem_lead_id?: string | null
          pacote_id?: string | null
          produto_id?: string
          seguro?: boolean
          updated_at?: string
          vendedor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendas_sky_forma_pagamento_id_fkey"
            columns: ["forma_pagamento_id"]
            isOneToOne: false
            referencedRelation: "formas_pagamento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_sky_origem_lead_id_fkey"
            columns: ["origem_lead_id"]
            isOneToOne: false
            referencedRelation: "origens_lead"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_sky_pacote_id_fkey"
            columns: ["pacote_id"]
            isOneToOne: false
            referencedRelation: "pacotes_sky"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_sky_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_sky"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_sky_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "vendedores"
            referencedColumns: ["id"]
          },
        ]
      }
      vendedores: {
        Row: {
          ativo: boolean
          created_at: string
          deleted_at: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          deleted_at?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          deleted_at?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_gerente_or_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "gerente" | "usuario"
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
    Enums: {
      app_role: ["admin", "gerente", "usuario"],
    },
  },
} as const
