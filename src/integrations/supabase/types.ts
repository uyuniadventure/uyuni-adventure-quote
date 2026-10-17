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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      activity_module_items: {
        Row: {
          applies_tc: boolean | null
          created_at: string
          id: string
          margin_applicable: boolean | null
          module_id: string
          qty: number
          service_id: string
          updated_at: string
        }
        Insert: {
          applies_tc?: boolean | null
          created_at?: string
          id?: string
          margin_applicable?: boolean | null
          module_id: string
          qty?: number
          service_id: string
          updated_at?: string
        }
        Update: {
          applies_tc?: boolean | null
          created_at?: string
          id?: string
          margin_applicable?: boolean | null
          module_id?: string
          qty?: number
          service_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_module_items_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "activity_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_module_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_module_translations: {
        Row: {
          created_at: string
          description: string
          id: string
          lang: string
          module_id: string
          reviewed: boolean
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          lang: string
          module_id: string
          reviewed?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          lang?: string
          module_id?: string
          reviewed?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_module_translations_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "activity_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_modules: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          default_time: string | null
          duration: Database["public"]["Enums"]["activity_duration"]
          id: string
          modality: Database["public"]["Enums"]["service_modality"]
          name: string
          place_id: string | null
          status: Database["public"]["Enums"]["catalog_status"]
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          default_time?: string | null
          duration: Database["public"]["Enums"]["activity_duration"]
          id?: string
          modality?: Database["public"]["Enums"]["service_modality"]
          name: string
          place_id?: string | null
          status?: Database["public"]["Enums"]["catalog_status"]
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          default_time?: string | null
          duration?: Database["public"]["Enums"]["activity_duration"]
          id?: string
          modality?: Database["public"]["Enums"]["service_modality"]
          name?: string
          place_id?: string | null
          status?: Database["public"]["Enums"]["catalog_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_modules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_modules_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_accounts: {
        Row: {
          account_holder: string
          account_number: string
          bank_name: string
          created_at: string
          currency: string
          entity: string
          iban: string | null
          id: string
          instructions: string | null
          routing_number: string | null
          swift: string | null
          updated_at: string
        }
        Insert: {
          account_holder: string
          account_number: string
          bank_name: string
          created_at?: string
          currency: string
          entity: string
          iban?: string | null
          id?: string
          instructions?: string | null
          routing_number?: string | null
          swift?: string | null
          updated_at?: string
        }
        Update: {
          account_holder?: string
          account_number?: string
          bank_name?: string
          created_at?: string
          currency?: string
          entity?: string
          iban?: string | null
          id?: string
          instructions?: string | null
          routing_number?: string | null
          swift?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
        ]
      }
      clients: {
        Row: {
          commission_mode: Database["public"]["Enums"]["commission_mode"]
          commission_pct: number
          contact: string | null
          country: string | null
          created_at: string
          created_by: string | null
          deposit_pct: number | null
          email: string | null
          id: string
          language: string
          margin_pct: number | null
          name: string
          terms_id: string | null
          type: Database["public"]["Enums"]["client_type"]
          updated_at: string
        }
        Insert: {
          commission_mode?: Database["public"]["Enums"]["commission_mode"]
          commission_pct?: number
          contact?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          deposit_pct?: number | null
          email?: string | null
          id?: string
          language?: string
          margin_pct?: number | null
          name: string
          terms_id?: string | null
          type: Database["public"]["Enums"]["client_type"]
          updated_at?: string
        }
        Update: {
          commission_mode?: Database["public"]["Enums"]["commission_mode"]
          commission_pct?: number
          contact?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          deposit_pct?: number | null
          email?: string | null
          id?: string
          language?: string
          margin_pct?: number | null
          name?: string
          terms_id?: string | null
          type?: Database["public"]["Enums"]["client_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_terms_id_fkey"
            columns: ["terms_id"]
            isOneToOne: false
            referencedRelation: "terms_conditions"
            referencedColumns: ["id"]
          },
        ]
      }
      currencies: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      day_block_items: {
        Row: {
          applies_tc: boolean | null
          block_id: string
          coverage_key: string | null
          coverage_start_day: number | null
          created_at: string
          id: string
          included: boolean
          is_optional: boolean
          item_snapshot: Json | null
          margin_applicable: boolean | null
          multi_day_span: number
          pricing_config: Json
          qty: number
          service_id: string | null
          updated_at: string
        }
        Insert: {
          applies_tc?: boolean | null
          block_id: string
          coverage_key?: string | null
          coverage_start_day?: number | null
          created_at?: string
          id?: string
          included?: boolean
          is_optional?: boolean
          item_snapshot?: Json | null
          margin_applicable?: boolean | null
          multi_day_span?: number
          pricing_config?: Json
          qty?: number
          service_id?: string | null
          updated_at?: string
        }
        Update: {
          applies_tc?: boolean | null
          block_id?: string
          coverage_key?: string | null
          coverage_start_day?: number | null
          created_at?: string
          id?: string
          included?: boolean
          is_optional?: boolean
          item_snapshot?: Json | null
          margin_applicable?: boolean | null
          multi_day_span?: number
          pricing_config?: Json
          qty?: number
          service_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "day_block_items_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "day_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "day_block_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      day_block_modules: {
        Row: {
          block_id: string
          created_at: string
          id: string
          module_id: string
          order: number
          time: string | null
          updated_at: string
        }
        Insert: {
          block_id: string
          created_at?: string
          id?: string
          module_id: string
          order?: number
          time?: string | null
          updated_at?: string
        }
        Update: {
          block_id?: string
          created_at?: string
          id?: string
          module_id?: string
          order?: number
          time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "day_block_modules_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "day_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "day_block_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "activity_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      day_block_translations: {
        Row: {
          block_id: string
          created_at: string
          description: string
          excludes: string | null
          id: string
          includes: string | null
          lang: string
          reviewed: boolean
          title: string
          updated_at: string
        }
        Insert: {
          block_id: string
          created_at?: string
          description: string
          excludes?: string | null
          id?: string
          includes?: string | null
          lang: string
          reviewed?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          block_id?: string
          created_at?: string
          description?: string
          excludes?: string | null
          id?: string
          includes?: string | null
          lang?: string
          reviewed?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "day_block_translations_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "day_blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      day_blocks: {
        Row: {
          code: string
          content: Json
          created_at: string
          created_by: string | null
          default_day_position: number | null
          end_point: string | null
          hotel_service_id: string | null
          id: string
          modality: Database["public"]["Enums"]["itinerary_modality"]
          name: string | null
          parent_block_id: string | null
          places: string[]
          route_from: string | null
          route_to: string | null
          start_point: string | null
          status: Database["public"]["Enums"]["catalog_status"]
          updated_at: string
        }
        Insert: {
          code: string
          content?: Json
          created_at?: string
          created_by?: string | null
          default_day_position?: number | null
          end_point?: string | null
          hotel_service_id?: string | null
          id?: string
          modality?: Database["public"]["Enums"]["itinerary_modality"]
          name?: string | null
          parent_block_id?: string | null
          places?: string[]
          route_from?: string | null
          route_to?: string | null
          start_point?: string | null
          status?: Database["public"]["Enums"]["catalog_status"]
          updated_at?: string
        }
        Update: {
          code?: string
          content?: Json
          created_at?: string
          created_by?: string | null
          default_day_position?: number | null
          end_point?: string | null
          hotel_service_id?: string | null
          id?: string
          modality?: Database["public"]["Enums"]["itinerary_modality"]
          name?: string | null
          parent_block_id?: string | null
          places?: string[]
          route_from?: string | null
          route_to?: string | null
          start_point?: string | null
          status?: Database["public"]["Enums"]["catalog_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "day_blocks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "day_blocks_hotel_service_id_fkey"
            columns: ["hotel_service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "day_blocks_parent_block_id_fkey"
            columns: ["parent_block_id"]
            isOneToOne: false
            referencedRelation: "day_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "day_blocks_route_from_fkey"
            columns: ["route_from"]
            isOneToOne: false
            referencedRelation: "location_codes"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "day_blocks_route_to_fkey"
            columns: ["route_to"]
            isOneToOne: false
            referencedRelation: "location_codes"
            referencedColumns: ["code"]
          },
        ]
      }
      doc_block_translations: {
        Row: {
          block_id: string
          body_html: string
          created_at: string
          lang: string
          reviewed: boolean
          reviewed_at: string | null
          reviewed_by: string | null
          title: string
          updated_at: string
        }
        Insert: {
          block_id: string
          body_html?: string
          created_at?: string
          lang: string
          reviewed?: boolean
          reviewed_at?: string | null
          reviewed_by?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          block_id?: string
          body_html?: string
          created_at?: string
          lang?: string
          reviewed?: boolean
          reviewed_at?: string | null
          reviewed_by?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doc_block_translations_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "doc_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doc_block_translations_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      doc_blocks: {
        Row: {
          channel: string
          code: string
          created_at: string
          created_by: string | null
          data_key: string | null
          id: string
          kind: string
          required: boolean
          status: string
          updated_at: string
        }
        Insert: {
          channel?: string
          code: string
          created_at?: string
          created_by?: string | null
          data_key?: string | null
          id?: string
          kind: string
          required?: boolean
          status?: string
          updated_at?: string
        }
        Update: {
          channel?: string
          code?: string
          created_at?: string
          created_by?: string | null
          data_key?: string | null
          id?: string
          kind?: string
          required?: boolean
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doc_blocks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      doc_layout_items: {
        Row: {
          block_id: string
          created_at: string
          id: string
          layout_id: string
          options: Json
          sort: number
          updated_at: string
        }
        Insert: {
          block_id: string
          created_at?: string
          id?: string
          layout_id: string
          options?: Json
          sort: number
          updated_at?: string
        }
        Update: {
          block_id?: string
          created_at?: string
          id?: string
          layout_id?: string
          options?: Json
          sort?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doc_layout_items_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "doc_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doc_layout_items_layout_id_fkey"
            columns: ["layout_id"]
            isOneToOne: false
            referencedRelation: "doc_layouts"
            referencedColumns: ["id"]
          },
        ]
      }
      doc_layouts: {
        Row: {
          channel: string
          created_at: string
          created_by: string | null
          id: string
          is_default: boolean
          name: string
          updated_at: string
        }
        Insert: {
          channel: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_default?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          channel?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doc_layouts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_rates: {
        Row: {
          created_at: string
          currency: string
          id: string
          rate_to_usd: number
          updated_at: string
          valid_from: string
        }
        Insert: {
          created_at?: string
          currency: string
          id?: string
          rate_to_usd: number
          updated_at?: string
          valid_from: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          rate_to_usd?: number
          updated_at?: string
          valid_from?: string
        }
        Relationships: [
          {
            foreignKeyName: "exchange_rates_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
        ]
      }
      followup_email_runs: {
        Row: {
          body: string
          created_at: string
          day: string
          id: string
          last_error: string | null
          provider_id: string | null
          recipient: string
          seller_id: string
          status: Database["public"]["Enums"]["email_status"]
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          day: string
          id?: string
          last_error?: string | null
          provider_id?: string | null
          recipient: string
          seller_id: string
          status?: Database["public"]["Enums"]["email_status"]
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          day?: string
          id?: string
          last_error?: string | null
          provider_id?: string | null
          recipient?: string
          seller_id?: string
          status?: Database["public"]["Enums"]["email_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "followup_email_runs_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hotel_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hotel_codes_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      info_blocks: {
        Row: {
          content: string
          created_at: string
          destination: string
          id: string
          lang: string
          order: number
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          destination: string
          id?: string
          lang: string
          order?: number
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          destination?: string
          id?: string
          lang?: string
          order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      itinerary_templates: {
        Row: {
          approval_issues: string[]
          category: Database["public"]["Enums"]["tour_category"]
          countries: string[]
          created_at: string
          created_by: string | null
          days: number
          guide_language: string | null
          hotel_combo: string | null
          id: string
          import_warnings: Json
          includes_guide: boolean
          includes_staff_lodging_meals: boolean
          main_places: string[]
          meals_summary: string | null
          modality: Database["public"]["Enums"]["itinerary_modality"]
          name: string
          nights: number
          quote_defaults: Json
          route_from: string | null
          route_to: string | null
          route_type: Database["public"]["Enums"]["route_type"]
          sku: string
          source_quote_id: string | null
          status: Database["public"]["Enums"]["catalog_status"]
          updated_at: string
        }
        Insert: {
          approval_issues?: string[]
          category: Database["public"]["Enums"]["tour_category"]
          countries?: string[]
          created_at?: string
          created_by?: string | null
          days: number
          guide_language?: string | null
          hotel_combo?: string | null
          id?: string
          import_warnings?: Json
          includes_guide?: boolean
          includes_staff_lodging_meals?: boolean
          main_places?: string[]
          meals_summary?: string | null
          modality?: Database["public"]["Enums"]["itinerary_modality"]
          name: string
          nights: number
          quote_defaults?: Json
          route_from?: string | null
          route_to?: string | null
          route_type: Database["public"]["Enums"]["route_type"]
          sku: string
          source_quote_id?: string | null
          status?: Database["public"]["Enums"]["catalog_status"]
          updated_at?: string
        }
        Update: {
          approval_issues?: string[]
          category?: Database["public"]["Enums"]["tour_category"]
          countries?: string[]
          created_at?: string
          created_by?: string | null
          days?: number
          guide_language?: string | null
          hotel_combo?: string | null
          id?: string
          import_warnings?: Json
          includes_guide?: boolean
          includes_staff_lodging_meals?: boolean
          main_places?: string[]
          meals_summary?: string | null
          modality?: Database["public"]["Enums"]["itinerary_modality"]
          name?: string
          nights?: number
          quote_defaults?: Json
          route_from?: string | null
          route_to?: string | null
          route_type?: Database["public"]["Enums"]["route_type"]
          sku?: string
          source_quote_id?: string | null
          status?: Database["public"]["Enums"]["catalog_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itinerary_templates_route_from_fkey"
            columns: ["route_from"]
            isOneToOne: false
            referencedRelation: "location_codes"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "itinerary_templates_route_to_fkey"
            columns: ["route_to"]
            isOneToOne: false
            referencedRelation: "location_codes"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "itinerary_templates_source_quote_id_fkey"
            columns: ["source_quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      location_codes: {
        Row: {
          code: string
          country: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          country?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          country?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      media: {
        Row: {
          created_at: string
          id: string
          order: number
          place_id: string | null
          service_id: string | null
          storage_path: string
          type: Database["public"]["Enums"]["media_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          order?: number
          place_id?: string | null
          service_id?: string | null
          storage_path: string
          type: Database["public"]["Enums"]["media_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          order?: number
          place_id?: string | null
          service_id?: string | null
          storage_path?: string
          type?: Database["public"]["Enums"]["media_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      ops_communications: {
        Row: {
          channel: Database["public"]["Enums"]["communication_channel"]
          created_at: string
          id: string
          message: string
          milestone: number
          scheduled_at: string
          service_id: string
          status: Database["public"]["Enums"]["communication_status"]
          updated_at: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["communication_channel"]
          created_at?: string
          id?: string
          message: string
          milestone: number
          scheduled_at: string
          service_id: string
          status?: Database["public"]["Enums"]["communication_status"]
          updated_at?: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["communication_channel"]
          created_at?: string
          id?: string
          message?: string
          milestone?: number
          scheduled_at?: string
          service_id?: string
          status?: Database["public"]["Enums"]["communication_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ops_communications_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "ops_service_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ops_communications_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "ops_services"
            referencedColumns: ["id"]
          },
        ]
      }
      ops_items: {
        Row: {
          booking_status: Database["public"]["Enums"]["booking_status"]
          check_in: string | null
          check_out: string | null
          cost_local: number | null
          cost_usd: number | null
          created_at: string
          currency: string | null
          date: string
          description: string
          extra_notes: string | null
          followup_notes: string | null
          id: string
          item_snapshot: Json
          meal_plan: Database["public"]["Enums"]["meal_plan"] | null
          pickup_time: string | null
          place: string | null
          quote_item_id: string | null
          room_distribution: Json | null
          service_id: string
          supplier_id: string | null
          type: Database["public"]["Enums"]["service_type"]
          updated_at: string
        }
        Insert: {
          booking_status?: Database["public"]["Enums"]["booking_status"]
          check_in?: string | null
          check_out?: string | null
          cost_local?: number | null
          cost_usd?: number | null
          created_at?: string
          currency?: string | null
          date: string
          description: string
          extra_notes?: string | null
          followup_notes?: string | null
          id?: string
          item_snapshot: Json
          meal_plan?: Database["public"]["Enums"]["meal_plan"] | null
          pickup_time?: string | null
          place?: string | null
          quote_item_id?: string | null
          room_distribution?: Json | null
          service_id: string
          supplier_id?: string | null
          type: Database["public"]["Enums"]["service_type"]
          updated_at?: string
        }
        Update: {
          booking_status?: Database["public"]["Enums"]["booking_status"]
          check_in?: string | null
          check_out?: string | null
          cost_local?: number | null
          cost_usd?: number | null
          created_at?: string
          currency?: string | null
          date?: string
          description?: string
          extra_notes?: string | null
          followup_notes?: string | null
          id?: string
          item_snapshot?: Json
          meal_plan?: Database["public"]["Enums"]["meal_plan"] | null
          pickup_time?: string | null
          place?: string | null
          quote_item_id?: string | null
          room_distribution?: Json | null
          service_id?: string
          supplier_id?: string | null
          type?: Database["public"]["Enums"]["service_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ops_items_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "ops_items_quote_item_id_fkey"
            columns: ["quote_item_id"]
            isOneToOne: false
            referencedRelation: "quote_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ops_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "ops_service_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ops_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "ops_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ops_items_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      ops_passengers: {
        Row: {
          bed_type: string | null
          birth_date: string | null
          created_at: string
          dietary_restrictions: string | null
          email: string | null
          full_name: string
          id: string
          nationality: string | null
          notes: string | null
          passport: string | null
          phone: string | null
          service_id: string
          updated_at: string
        }
        Insert: {
          bed_type?: string | null
          birth_date?: string | null
          created_at?: string
          dietary_restrictions?: string | null
          email?: string | null
          full_name: string
          id?: string
          nationality?: string | null
          notes?: string | null
          passport?: string | null
          phone?: string | null
          service_id: string
          updated_at?: string
        }
        Update: {
          bed_type?: string | null
          birth_date?: string | null
          created_at?: string
          dietary_restrictions?: string | null
          email?: string | null
          full_name?: string
          id?: string
          nationality?: string | null
          notes?: string | null
          passport?: string | null
          phone?: string | null
          service_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ops_passengers_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "ops_service_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ops_passengers_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "ops_services"
            referencedColumns: ["id"]
          },
        ]
      }
      ops_services: {
        Row: {
          booking_code: string
          client_name: string | null
          client_type: Database["public"]["Enums"]["ops_client_type"]
          created_at: string
          days_snapshot: Json
          end_date: string
          id: string
          language: string
          pax: number
          quote_id: string
          quote_snapshot: Json
          quoted_cost_usd: number | null
          real_cost_usd: number | null
          real_margin_usd: number | null
          responsible_id: string | null
          sale_price_usd: number | null
          start_date: string
          status: Database["public"]["Enums"]["ops_status"]
          tour_sku: string | null
          updated_at: string
        }
        Insert: {
          booking_code: string
          client_name?: string | null
          client_type: Database["public"]["Enums"]["ops_client_type"]
          created_at?: string
          days_snapshot?: Json
          end_date: string
          id?: string
          language?: string
          pax: number
          quote_id: string
          quote_snapshot?: Json
          quoted_cost_usd?: number | null
          real_cost_usd?: number | null
          real_margin_usd?: number | null
          responsible_id?: string | null
          sale_price_usd?: number | null
          start_date: string
          status?: Database["public"]["Enums"]["ops_status"]
          tour_sku?: string | null
          updated_at?: string
        }
        Update: {
          booking_code?: string
          client_name?: string | null
          client_type?: Database["public"]["Enums"]["ops_client_type"]
          created_at?: string
          days_snapshot?: Json
          end_date?: string
          id?: string
          language?: string
          pax?: number
          quote_id?: string
          quote_snapshot?: Json
          quoted_cost_usd?: number | null
          real_cost_usd?: number | null
          real_margin_usd?: number | null
          responsible_id?: string | null
          sale_price_usd?: number | null
          start_date?: string
          status?: Database["public"]["Enums"]["ops_status"]
          tour_sku?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ops_services_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: true
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ops_services_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ops_supplier_payables: {
        Row: {
          balance_usd: number | null
          cost_local: number
          cost_usd: number
          created_at: string
          currency: string
          detail: string | null
          due_date: string | null
          id: string
          paid_date: string | null
          paid_usd: number
          service_id: string
          status: Database["public"]["Enums"]["payable_status"]
          supplier_id: string
          updated_at: string
        }
        Insert: {
          balance_usd?: number | null
          cost_local: number
          cost_usd: number
          created_at?: string
          currency: string
          detail?: string | null
          due_date?: string | null
          id?: string
          paid_date?: string | null
          paid_usd?: number
          service_id: string
          status?: Database["public"]["Enums"]["payable_status"]
          supplier_id: string
          updated_at?: string
        }
        Update: {
          balance_usd?: number | null
          cost_local?: number
          cost_usd?: number
          created_at?: string
          currency?: string
          detail?: string | null
          due_date?: string | null
          id?: string
          paid_date?: string | null
          paid_usd?: number
          service_id?: string
          status?: Database["public"]["Enums"]["payable_status"]
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ops_supplier_payables_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "ops_supplier_payables_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "ops_service_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ops_supplier_payables_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "ops_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ops_supplier_payables_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      places: {
        Row: {
          country: string
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          country: string
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          country?: string
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      pricing_settings: {
        Row: {
          created_at: string
          deposit_pct: number
          id: string
          margin_mode: Database["public"]["Enums"]["margin_mode"]
          margin_pct: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          deposit_pct?: number
          id?: string
          margin_mode?: Database["public"]["Enums"]["margin_mode"]
          margin_pct?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          deposit_pct?: number
          id?: string
          margin_mode?: Database["public"]["Enums"]["margin_mode"]
          margin_pct?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      quote_days: {
        Row: {
          block_snapshot: Json
          created_at: string
          date: string | null
          day_number: number
          description: string
          excludes: string | null
          group_id: string | null
          group_position: number | null
          id: string
          includes: string | null
          link_type: string
          overrides: Json
          quote_id: string
          route_from: string | null
          route_to: string | null
          snapshot: Json
          source_block_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          block_snapshot?: Json
          created_at?: string
          date?: string | null
          day_number: number
          description?: string
          excludes?: string | null
          group_id?: string | null
          group_position?: number | null
          id?: string
          includes?: string | null
          link_type?: string
          overrides?: Json
          quote_id: string
          route_from?: string | null
          route_to?: string | null
          snapshot?: Json
          source_block_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          block_snapshot?: Json
          created_at?: string
          date?: string | null
          day_number?: number
          description?: string
          excludes?: string | null
          group_id?: string | null
          group_position?: number | null
          id?: string
          includes?: string | null
          link_type?: string
          overrides?: Json
          quote_id?: string
          route_from?: string | null
          route_to?: string | null
          snapshot?: Json
          source_block_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_days_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_days_source_block_id_fkey"
            columns: ["source_block_id"]
            isOneToOne: false
            referencedRelation: "day_blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_doc_sections: {
        Row: {
          block_id: string | null
          body_override_html: string | null
          created_at: string
          hidden: boolean
          id: string
          options: Json
          override_lang: string | null
          quote_id: string
          reviewed: boolean
          snapshot: Json
          sort: number
          title_override: string | null
          updated_at: string
        }
        Insert: {
          block_id?: string | null
          body_override_html?: string | null
          created_at?: string
          hidden?: boolean
          id?: string
          options?: Json
          override_lang?: string | null
          quote_id: string
          reviewed?: boolean
          snapshot: Json
          sort: number
          title_override?: string | null
          updated_at?: string
        }
        Update: {
          block_id?: string | null
          body_override_html?: string | null
          created_at?: string
          hidden?: boolean
          id?: string
          options?: Json
          override_lang?: string | null
          quote_id?: string
          reviewed?: boolean
          snapshot?: Json
          sort?: number
          title_override?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_doc_sections_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "doc_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_doc_sections_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_emails: {
        Row: {
          body: string
          created_at: string
          id: string
          idempotency_key: string | null
          last_error: string | null
          pdf_path: string | null
          pdf_url: string | null
          provider_id: string | null
          quote_id: string
          recipient: string
          sent_at: string | null
          sent_by: string
          status: Database["public"]["Enums"]["email_status"]
          subject: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          idempotency_key?: string | null
          last_error?: string | null
          pdf_path?: string | null
          pdf_url?: string | null
          provider_id?: string | null
          quote_id: string
          recipient: string
          sent_at?: string | null
          sent_by?: string
          status?: Database["public"]["Enums"]["email_status"]
          subject: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          idempotency_key?: string | null
          last_error?: string | null
          pdf_path?: string | null
          pdf_url?: string | null
          provider_id?: string | null
          quote_id?: string
          recipient?: string
          sent_at?: string | null
          sent_by?: string
          status?: Database["public"]["Enums"]["email_status"]
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_emails_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_emails_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_followups: {
        Row: {
          created_at: string
          done: boolean
          id: string
          note: string
          quote_id: string
          responsible_id: string
          scheduled_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          id?: string
          note: string
          quote_id: string
          responsible_id?: string
          scheduled_at: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          done?: boolean
          id?: string
          note?: string
          quote_id?: string
          responsible_id?: string
          scheduled_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_followups_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_followups_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_items: {
        Row: {
          adjustment_note: string | null
          adjustment_pct: number
          airline: string | null
          applies_tc: boolean
          arr_time: string | null
          check_in: string | null
          check_out: string | null
          created_at: string
          currency: string
          day_span: number
          dep_time: string | null
          description: string
          fare_notes: string | null
          flight_no: string | null
          id: string
          included: boolean
          margin_applicable: boolean
          meal_plan: Database["public"]["Enums"]["meal_plan"] | null
          override_note: string | null
          price_overridden: boolean
          pricing_snapshot: Json
          pricing_unit: Database["public"]["Enums"]["pricing_unit"]
          promote_to_master: boolean
          qty: number
          quote_day_id: string
          room_distribution: Json | null
          route: string | null
          service_id: string | null
          sku: string | null
          source_block_service_id: string | null
          supplier_id: string | null
          total_cost_local: number | null
          total_cost_usd: number | null
          type: Database["public"]["Enums"]["service_type"]
          unit_cost_original: number
          unit_cost_usd: number
          updated_at: string
        }
        Insert: {
          adjustment_note?: string | null
          adjustment_pct?: number
          airline?: string | null
          applies_tc?: boolean
          arr_time?: string | null
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          currency: string
          day_span?: number
          dep_time?: string | null
          description: string
          fare_notes?: string | null
          flight_no?: string | null
          id?: string
          included?: boolean
          margin_applicable?: boolean
          meal_plan?: Database["public"]["Enums"]["meal_plan"] | null
          override_note?: string | null
          price_overridden?: boolean
          pricing_snapshot?: Json
          pricing_unit: Database["public"]["Enums"]["pricing_unit"]
          promote_to_master?: boolean
          qty?: number
          quote_day_id: string
          room_distribution?: Json | null
          route?: string | null
          service_id?: string | null
          sku?: string | null
          source_block_service_id?: string | null
          supplier_id?: string | null
          total_cost_local?: number | null
          total_cost_usd?: number | null
          type: Database["public"]["Enums"]["service_type"]
          unit_cost_original: number
          unit_cost_usd: number
          updated_at?: string
        }
        Update: {
          adjustment_note?: string | null
          adjustment_pct?: number
          airline?: string | null
          applies_tc?: boolean
          arr_time?: string | null
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          currency?: string
          day_span?: number
          dep_time?: string | null
          description?: string
          fare_notes?: string | null
          flight_no?: string | null
          id?: string
          included?: boolean
          margin_applicable?: boolean
          meal_plan?: Database["public"]["Enums"]["meal_plan"] | null
          override_note?: string | null
          price_overridden?: boolean
          pricing_snapshot?: Json
          pricing_unit?: Database["public"]["Enums"]["pricing_unit"]
          promote_to_master?: boolean
          qty?: number
          quote_day_id?: string
          room_distribution?: Json | null
          route?: string | null
          service_id?: string | null
          sku?: string | null
          source_block_service_id?: string | null
          supplier_id?: string | null
          total_cost_local?: number | null
          total_cost_usd?: number | null
          type?: Database["public"]["Enums"]["service_type"]
          unit_cost_original?: number
          unit_cost_usd?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "quote_items_quote_day_id_fkey"
            columns: ["quote_day_id"]
            isOneToOne: false
            referencedRelation: "quote_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_payments: {
        Row: {
          amount: number
          amount_usd: number | null
          bank: string | null
          created_at: string
          currency: string
          date: string
          fx_rate: number | null
          id: string
          method: string
          quote_id: string
          receipt_path: string | null
          registered_by: string
          type: Database["public"]["Enums"]["payment_type"]
          updated_at: string
        }
        Insert: {
          amount: number
          amount_usd?: number | null
          bank?: string | null
          created_at?: string
          currency: string
          date: string
          fx_rate?: number | null
          id?: string
          method: string
          quote_id: string
          receipt_path?: string | null
          registered_by?: string
          type: Database["public"]["Enums"]["payment_type"]
          updated_at?: string
        }
        Update: {
          amount?: number
          amount_usd?: number | null
          bank?: string | null
          created_at?: string
          currency?: string
          date?: string
          fx_rate?: number | null
          id?: string
          method?: string
          quote_id?: string
          receipt_path?: string | null
          registered_by?: string
          type?: Database["public"]["Enums"]["payment_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_payments_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "quote_payments_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_payments_registered_by_fkey"
            columns: ["registered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_proposals: {
        Row: {
          created_at: string
          frozen_at: string | null
          html: string
          lang: string
          pdf_path: string | null
          quote_id: string
          sections: Json
          source_hash: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          frozen_at?: string | null
          html: string
          lang: string
          pdf_path?: string | null
          quote_id: string
          sections: Json
          source_hash: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          frozen_at?: string | null
          html?: string
          lang?: string
          pdf_path?: string | null
          quote_id?: string
          sections?: Json
          source_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_proposals_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: true
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_status_history: {
        Row: {
          changed_at: string
          changed_by: string
          created_at: string
          id: string
          new_status: Database["public"]["Enums"]["quote_status"]
          note: string | null
          old_status: Database["public"]["Enums"]["quote_status"] | null
          quote_id: string
          updated_at: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string
          created_at?: string
          id?: string
          new_status: Database["public"]["Enums"]["quote_status"]
          note?: string | null
          old_status?: Database["public"]["Enums"]["quote_status"] | null
          quote_id: string
          updated_at?: string
        }
        Update: {
          changed_at?: string
          changed_by?: string
          created_at?: string
          id?: string
          new_status?: Database["public"]["Enums"]["quote_status"]
          note?: string | null
          old_status?: Database["public"]["Enums"]["quote_status"] | null
          quote_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_status_history_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_year_counters: {
        Row: {
          created_at: string
          id: string
          last_value: number
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          last_value: number
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          last_value?: number
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      quotes: {
        Row: {
          archived_at: string | null
          balance_due_days: number
          calculation: Json | null
          cancel_reason: string | null
          card_surcharge_pct: number
          category: Database["public"]["Enums"]["tour_category"]
          client_id: string
          client_type: Database["public"]["Enums"]["client_type"]
          code: string
          commission_mode: Database["public"]["Enums"]["commission_mode"]
          commission_pct: number
          created_at: string
          deposit_pct: number
          document_snapshot: Json
          fx_snapshot: Json
          id: string
          language: string
          lost_reason: string | null
          margin_mode: Database["public"]["Enums"]["margin_mode"]
          margin_pct: number
          next_followup_at: string | null
          parent_quote_id: string | null
          pax_paying: number
          pax_scenarios: Json | null
          payment_schedule: Json | null
          pdf_path: string | null
          pdf_url: string | null
          price_per_pax_usd: number | null
          pricing_config: Json
          rooming: Json
          rounding_rule: Json
          seller_id: string
          single_supplement_pp: number | null
          staff: Json
          start_date: string
          status: Database["public"]["Enums"]["quote_status"]
          tc_count: number
          template_id: string | null
          total_cost_usd: number | null
          total_margin_usd: number | null
          total_price_usd: number | null
          tour_sku: string | null
          updated_at: string
          vehicles: Json
          version: number
        }
        Insert: {
          archived_at?: string | null
          balance_due_days?: number
          calculation?: Json | null
          cancel_reason?: string | null
          card_surcharge_pct?: number
          category: Database["public"]["Enums"]["tour_category"]
          client_id: string
          client_type: Database["public"]["Enums"]["client_type"]
          code: string
          commission_mode: Database["public"]["Enums"]["commission_mode"]
          commission_pct: number
          created_at?: string
          deposit_pct?: number
          document_snapshot?: Json
          fx_snapshot?: Json
          id?: string
          language?: string
          lost_reason?: string | null
          margin_mode: Database["public"]["Enums"]["margin_mode"]
          margin_pct: number
          next_followup_at?: string | null
          parent_quote_id?: string | null
          pax_paying: number
          pax_scenarios?: Json | null
          payment_schedule?: Json | null
          pdf_path?: string | null
          pdf_url?: string | null
          price_per_pax_usd?: number | null
          pricing_config?: Json
          rooming?: Json
          rounding_rule?: Json
          seller_id?: string
          single_supplement_pp?: number | null
          staff?: Json
          start_date: string
          status?: Database["public"]["Enums"]["quote_status"]
          tc_count?: number
          template_id?: string | null
          total_cost_usd?: number | null
          total_margin_usd?: number | null
          total_price_usd?: number | null
          tour_sku?: string | null
          updated_at?: string
          vehicles?: Json
          version?: number
        }
        Update: {
          archived_at?: string | null
          balance_due_days?: number
          calculation?: Json | null
          cancel_reason?: string | null
          card_surcharge_pct?: number
          category?: Database["public"]["Enums"]["tour_category"]
          client_id?: string
          client_type?: Database["public"]["Enums"]["client_type"]
          code?: string
          commission_mode?: Database["public"]["Enums"]["commission_mode"]
          commission_pct?: number
          created_at?: string
          deposit_pct?: number
          document_snapshot?: Json
          fx_snapshot?: Json
          id?: string
          language?: string
          lost_reason?: string | null
          margin_mode?: Database["public"]["Enums"]["margin_mode"]
          margin_pct?: number
          next_followup_at?: string | null
          parent_quote_id?: string | null
          pax_paying?: number
          pax_scenarios?: Json | null
          payment_schedule?: Json | null
          pdf_path?: string | null
          pdf_url?: string | null
          price_per_pax_usd?: number | null
          pricing_config?: Json
          rooming?: Json
          rounding_rule?: Json
          seller_id?: string
          single_supplement_pp?: number | null
          staff?: Json
          start_date?: string
          status?: Database["public"]["Enums"]["quote_status"]
          tc_count?: number
          template_id?: string | null
          total_cost_usd?: number | null
          total_margin_usd?: number | null
          total_price_usd?: number | null
          tour_sku?: string | null
          updated_at?: string
          vehicles?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_parent_quote_id_fkey"
            columns: ["parent_quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "itinerary_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      service_change_requests: {
        Row: {
          approved_by: string | null
          created_at: string
          id: string
          proposed_values: Json
          rate_id: string | null
          reason: string
          requested_by: string
          reviewed_at: string | null
          service_id: string | null
          status: Database["public"]["Enums"]["approval_status"]
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          id?: string
          proposed_values: Json
          rate_id?: string | null
          reason: string
          requested_by?: string
          reviewed_at?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          id?: string
          proposed_values?: Json
          rate_id?: string | null
          reason?: string
          requested_by?: string
          reviewed_at?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_change_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_change_requests_rate_id_fkey"
            columns: ["rate_id"]
            isOneToOne: false
            referencedRelation: "service_rates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_change_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_change_requests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_rates: {
        Row: {
          created_at: string
          id: string
          net_cost_missing: boolean
          notes: string | null
          pax_max: number | null
          pax_min: number | null
          price_net: number | null
          price_rack: number | null
          season: Database["public"]["Enums"]["season"]
          service_id: string
          source_row: number | null
          updated_at: string
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          net_cost_missing?: boolean
          notes?: string | null
          pax_max?: number | null
          pax_min?: number | null
          price_net?: number | null
          price_rack?: number | null
          season?: Database["public"]["Enums"]["season"]
          service_id: string
          source_row?: number | null
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          net_cost_missing?: boolean
          notes?: string | null
          pax_max?: number | null
          pax_min?: number | null
          price_net?: number | null
          price_rack?: number | null
          season?: Database["public"]["Enums"]["season"]
          service_id?: string
          source_row?: number | null
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_rates_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_sku_aliases: {
        Row: {
          created_at: string
          id: string
          service_id: string
          sku: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          service_id: string
          sku: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          service_id?: string
          sku?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_sku_aliases_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          applies_tc_default: boolean
          approval_issues: string[]
          country: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          id: string
          import_issues: string | null
          location: string | null
          margin_applicable_default: boolean
          meal_plan: Database["public"]["Enums"]["meal_plan"] | null
          modality: Database["public"]["Enums"]["service_modality"]
          multi_day_span: number
          name: string
          notes: string | null
          pricing_unit: Database["public"]["Enums"]["pricing_unit"] | null
          room_type: string | null
          sku: string
          source: string | null
          status: Database["public"]["Enums"]["catalog_status"]
          supplier_id: string | null
          type: Database["public"]["Enums"]["service_type"]
          updated_at: string
          vehicle_max_pax: number | null
          vehicle_type: string | null
        }
        Insert: {
          applies_tc_default?: boolean
          approval_issues?: string[]
          country?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          id?: string
          import_issues?: string | null
          location?: string | null
          margin_applicable_default?: boolean
          meal_plan?: Database["public"]["Enums"]["meal_plan"] | null
          modality?: Database["public"]["Enums"]["service_modality"]
          multi_day_span?: number
          name: string
          notes?: string | null
          pricing_unit?: Database["public"]["Enums"]["pricing_unit"] | null
          room_type?: string | null
          sku: string
          source?: string | null
          status?: Database["public"]["Enums"]["catalog_status"]
          supplier_id?: string | null
          type: Database["public"]["Enums"]["service_type"]
          updated_at?: string
          vehicle_max_pax?: number | null
          vehicle_type?: string | null
        }
        Update: {
          applies_tc_default?: boolean
          approval_issues?: string[]
          country?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          id?: string
          import_issues?: string | null
          location?: string | null
          margin_applicable_default?: boolean
          meal_plan?: Database["public"]["Enums"]["meal_plan"] | null
          modality?: Database["public"]["Enums"]["service_modality"]
          multi_day_span?: number
          name?: string
          notes?: string | null
          pricing_unit?: Database["public"]["Enums"]["pricing_unit"] | null
          room_type?: string | null
          sku?: string
          source?: string | null
          status?: Database["public"]["Enums"]["catalog_status"]
          supplier_id?: string | null
          type?: Database["public"]["Enums"]["service_type"]
          updated_at?: string
          vehicle_max_pax?: number | null
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "services_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          agent: string | null
          aliases: string[]
          contact: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          location: string | null
          name: string
          notes: string | null
          phone: string | null
          service_type: Database["public"]["Enums"]["service_type"] | null
          updated_at: string
        }
        Insert: {
          agent?: string | null
          aliases?: string[]
          contact?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          service_type?: Database["public"]["Enums"]["service_type"] | null
          updated_at?: string
        }
        Update: {
          agent?: string | null
          aliases?: string[]
          contact?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          service_type?: Database["public"]["Enums"]["service_type"] | null
          updated_at?: string
        }
        Relationships: []
      }
      template_days: {
        Row: {
          block_id: string
          created_at: string
          day_number: number
          id: string
          template_id: string
          updated_at: string
        }
        Insert: {
          block_id: string
          created_at?: string
          day_number: number
          id?: string
          template_id: string
          updated_at?: string
        }
        Update: {
          block_id?: string
          created_at?: string
          day_number?: number
          id?: string
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_days_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "day_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_days_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "itinerary_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      terms_conditions: {
        Row: {
          client_id: string | null
          content: string
          created_at: string
          id: string
          lang: string
          scope: Database["public"]["Enums"]["terms_scope"]
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          content: string
          created_at?: string
          id?: string
          lang: string
          scope: Database["public"]["Enums"]["terms_scope"]
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          content?: string
          created_at?: string
          id?: string
          lang?: string
          scope?: Database["public"]["Enums"]["terms_scope"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "terms_conditions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      ops_active_accommodation_bookings: {
        Row: {
          booking_code: string | null
          booking_status: Database["public"]["Enums"]["booking_status"] | null
          check_in: string | null
          check_out: string | null
          due_date: string | null
          hotel: string | null
          hotel_email: string | null
          id: string | null
          paid_date: string | null
          room_distribution: Json | null
          service_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ops_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "ops_service_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ops_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "ops_services"
            referencedColumns: ["id"]
          },
        ]
      }
      ops_pending_payables: {
        Row: {
          balance_usd: number | null
          cost_local: number | null
          cost_usd: number | null
          created_at: string | null
          currency: string | null
          detail: string | null
          due_date: string | null
          id: string | null
          paid_date: string | null
          paid_usd: number | null
          service_id: string | null
          status: Database["public"]["Enums"]["payable_status"] | null
          supplier_id: string | null
          supplier_name: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ops_supplier_payables_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "ops_supplier_payables_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "ops_service_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ops_supplier_payables_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "ops_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ops_supplier_payables_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      ops_service_summary: {
        Row: {
          booking_code: string | null
          end_date: string | null
          id: string | null
          pax: number | null
          quoted_cost_usd: number | null
          real_cost_usd: number | null
          real_margin_usd: number | null
          sale_price_usd: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["ops_status"] | null
        }
        Insert: {
          booking_code?: string | null
          end_date?: string | null
          id?: string | null
          pax?: number | null
          quoted_cost_usd?: number | null
          real_cost_usd?: number | null
          real_margin_usd?: number | null
          sale_price_usd?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["ops_status"] | null
        }
        Update: {
          booking_code?: string | null
          end_date?: string | null
          id?: string | null
          pax?: number | null
          quoted_cost_usd?: number | null
          real_cost_usd?: number | null
          real_margin_usd?: number | null
          sale_price_usd?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["ops_status"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      _doc_snapshot: { Args: { p_id: string }; Returns: Json }
      _document_text_html: { Args: { p: string }; Returns: string }
      _editable_doc_quote: {
        Args: { p_id: string }
        Returns: {
          archived_at: string | null
          balance_due_days: number
          calculation: Json | null
          cancel_reason: string | null
          card_surcharge_pct: number
          category: Database["public"]["Enums"]["tour_category"]
          client_id: string
          client_type: Database["public"]["Enums"]["client_type"]
          code: string
          commission_mode: Database["public"]["Enums"]["commission_mode"]
          commission_pct: number
          created_at: string
          deposit_pct: number
          document_snapshot: Json
          fx_snapshot: Json
          id: string
          language: string
          lost_reason: string | null
          margin_mode: Database["public"]["Enums"]["margin_mode"]
          margin_pct: number
          next_followup_at: string | null
          parent_quote_id: string | null
          pax_paying: number
          pax_scenarios: Json | null
          payment_schedule: Json | null
          pdf_path: string | null
          pdf_url: string | null
          price_per_pax_usd: number | null
          pricing_config: Json
          rooming: Json
          rounding_rule: Json
          seller_id: string
          single_supplement_pp: number | null
          staff: Json
          start_date: string
          status: Database["public"]["Enums"]["quote_status"]
          tc_count: number
          template_id: string | null
          total_cost_usd: number | null
          total_margin_usd: number | null
          total_price_usd: number | null
          tour_sku: string | null
          updated_at: string
          vehicles: Json
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "quotes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      _invalidate_proposal: { Args: { p_id: string }; Returns: undefined }
      _migrate_quote_document_texts: {
        Args: { p_id: string }
        Returns: undefined
      }
      _proposal_context: { Args: { p_id: string }; Returns: Json }
      admin_list_users: { Args: never; Returns: Json }
      apply_quote_adjustment_bulk: {
        Args: {
          p_filter: Json
          p_id: string
          p_note: string
          p_pct: number
          p_result: Json
          p_updated_at: string
        }
        Returns: Json
      }
      approve_valid_imports: {
        Args: { p_dry_run?: boolean; p_expected_fingerprint?: string }
        Returns: Json
      }
      build_supplier_payables: {
        Args: { p_id: string }
        Returns: {
          balance_usd: number | null
          cost_local: number
          cost_usd: number
          created_at: string
          currency: string
          detail: string | null
          due_date: string | null
          id: string
          paid_date: string | null
          paid_usd: number
          service_id: string
          status: Database["public"]["Enums"]["payable_status"]
          supplier_id: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "ops_supplier_payables"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      calculation_has_errors: { Args: { result: Json }; Returns: boolean }
      claim_quote_email: {
        Args: {
          p_body: string
          p_id: string
          p_recipient: string
          p_subject: string
        }
        Returns: {
          body: string
          created_at: string
          id: string
          idempotency_key: string | null
          last_error: string | null
          pdf_path: string | null
          pdf_url: string | null
          provider_id: string | null
          quote_id: string
          recipient: string
          sent_at: string | null
          sent_by: string
          status: Database["public"]["Enums"]["email_status"]
          subject: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "quote_emails"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      compute_real_margin: {
        Args: { p_id: string }
        Returns: {
          booking_code: string
          client_name: string | null
          client_type: Database["public"]["Enums"]["ops_client_type"]
          created_at: string
          days_snapshot: Json
          end_date: string
          id: string
          language: string
          pax: number
          quote_id: string
          quote_snapshot: Json
          quoted_cost_usd: number | null
          real_cost_usd: number | null
          real_margin_usd: number | null
          responsible_id: string | null
          sale_price_usd: number | null
          start_date: string
          status: Database["public"]["Enums"]["ops_status"]
          tour_sku: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "ops_services"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_quote_from_template: {
        Args: {
          p_days: Json
          p_quote: Json
          p_result: Json
          p_source: Json
          p_template: string
        }
        Returns: {
          archived_at: string | null
          balance_due_days: number
          calculation: Json | null
          cancel_reason: string | null
          card_surcharge_pct: number
          category: Database["public"]["Enums"]["tour_category"]
          client_id: string
          client_type: Database["public"]["Enums"]["client_type"]
          code: string
          commission_mode: Database["public"]["Enums"]["commission_mode"]
          commission_pct: number
          created_at: string
          deposit_pct: number
          document_snapshot: Json
          fx_snapshot: Json
          id: string
          language: string
          lost_reason: string | null
          margin_mode: Database["public"]["Enums"]["margin_mode"]
          margin_pct: number
          next_followup_at: string | null
          parent_quote_id: string | null
          pax_paying: number
          pax_scenarios: Json | null
          payment_schedule: Json | null
          pdf_path: string | null
          pdf_url: string | null
          price_per_pax_usd: number | null
          pricing_config: Json
          rooming: Json
          rounding_rule: Json
          seller_id: string
          single_supplement_pp: number | null
          staff: Json
          start_date: string
          status: Database["public"]["Enums"]["quote_status"]
          tc_count: number
          template_id: string | null
          total_cost_usd: number | null
          total_margin_usd: number | null
          total_price_usd: number | null
          tour_sku: string | null
          updated_at: string
          vehicles: Json
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "quotes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_quote_snapshot: {
        Args: { p_days: Json; p_quote: Json }
        Returns: {
          archived_at: string | null
          balance_due_days: number
          calculation: Json | null
          cancel_reason: string | null
          card_surcharge_pct: number
          category: Database["public"]["Enums"]["tour_category"]
          client_id: string
          client_type: Database["public"]["Enums"]["client_type"]
          code: string
          commission_mode: Database["public"]["Enums"]["commission_mode"]
          commission_pct: number
          created_at: string
          deposit_pct: number
          document_snapshot: Json
          fx_snapshot: Json
          id: string
          language: string
          lost_reason: string | null
          margin_mode: Database["public"]["Enums"]["margin_mode"]
          margin_pct: number
          next_followup_at: string | null
          parent_quote_id: string | null
          pax_paying: number
          pax_scenarios: Json | null
          payment_schedule: Json | null
          pdf_path: string | null
          pdf_url: string | null
          price_per_pax_usd: number | null
          pricing_config: Json
          rooming: Json
          rounding_rule: Json
          seller_id: string
          single_supplement_pp: number | null
          staff: Json
          start_date: string
          status: Database["public"]["Enums"]["quote_status"]
          tc_count: number
          template_id: string | null
          total_cost_usd: number | null
          total_margin_usd: number | null
          total_price_usd: number | null
          tour_sku: string | null
          updated_at: string
          vehicles: Json
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "quotes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      current_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      due_followups: { Args: never; Returns: Json }
      edit_quote_days: {
        Args: {
          p_id: string
          p_operation: string
          p_payload: Json
          p_result?: Json
          p_updated_at?: string
        }
        Returns: Json
      }
      edit_quote_doc_section: {
        Args: {
          p_action: string
          p_data?: Json
          p_quote_id: string
          p_section_id?: string
        }
        Returns: string
      }
      edit_quote_item: {
        Args: {
          p_add?: boolean
          p_changes: Json
          p_id: string
          p_promote?: boolean
        }
        Returns: Json
      }
      ensure_quote_doc_sections: {
        Args: { p_layout_id?: string; p_quote_id: string }
        Returns: undefined
      }
      finish_quote_email: {
        Args: { p_id: string; p_provider_id: string }
        Returns: undefined
      }
      generate_communication_plan: {
        Args: { p_id: string; p_messages: Json }
        Returns: {
          channel: Database["public"]["Enums"]["communication_channel"]
          created_at: string
          id: string
          message: string
          milestone: number
          scheduled_at: string
          service_id: string
          status: Database["public"]["Enums"]["communication_status"]
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "ops_communications"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      insert_quote_item: {
        Args: { p_day: string; p_item: Json; p_promote?: boolean }
        Returns: {
          adjustment_note: string | null
          adjustment_pct: number
          airline: string | null
          applies_tc: boolean
          arr_time: string | null
          check_in: string | null
          check_out: string | null
          created_at: string
          currency: string
          day_span: number
          dep_time: string | null
          description: string
          fare_notes: string | null
          flight_no: string | null
          id: string
          included: boolean
          margin_applicable: boolean
          meal_plan: Database["public"]["Enums"]["meal_plan"] | null
          override_note: string | null
          price_overridden: boolean
          pricing_snapshot: Json
          pricing_unit: Database["public"]["Enums"]["pricing_unit"]
          promote_to_master: boolean
          qty: number
          quote_day_id: string
          room_distribution: Json | null
          route: string | null
          service_id: string | null
          sku: string | null
          source_block_service_id: string | null
          supplier_id: string | null
          total_cost_local: number | null
          total_cost_usd: number | null
          type: Database["public"]["Enums"]["service_type"]
          unit_cost_original: number
          unit_cost_usd: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "quote_items"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      next_quote_code: {
        Args: { p_language: string; p_sku: string }
        Returns: string
      }
      patch_day_overrides: {
        Args: { old_overrides: Json; patch: Json; snap: Json }
        Returns: Json
      }
      prepare_quote_template: {
        Args: { p_id: string; p_route_from?: string; p_route_to?: string }
        Returns: Json
      }
      promote_quote_template: { Args: { p_id: string }; Returns: string }
      proposal_html_valid: { Args: { p_html: string }; Returns: boolean }
      quote_deposit_reached: { Args: { p_id: string }; Returns: boolean }
      quote_document_context: { Args: { p_id: string }; Returns: Json }
      quote_payment_summary: { Args: { p_id: string }; Returns: Json }
      quote_proposal_context: { Args: { p_id: string }; Returns: Json }
      quote_template_source: {
        Args: { p_client: string; p_template: string }
        Returns: Json
      }
      register_quote_payment: {
        Args: { p_payment: Json; p_payment_id: string; p_quote_id: string }
        Returns: Json
      }
      reorder_quote_doc_sections: {
        Args: { p_ids: string[]; p_quote_id: string }
        Returns: undefined
      }
      reset_quote_day_field: {
        Args: { p_day_id: string; p_field: string; p_updated_at: string }
        Returns: Json
      }
      resolve_day_content: {
        Args: { p_overrides: Json; p_snapshot: Json }
        Returns: Json
      }
      review_quote_days: {
        Args: {
          p_also_update_block?: boolean
          p_day_ids?: string[]
          p_quote_id: string
        }
        Returns: Json
      }
      save_doc_section_as_block: {
        Args: { p_code: string; p_quote_id: string; p_section_id: string }
        Returns: string
      }
      save_quote_as_template: {
        Args: {
          p_expected_sku?: string
          p_id: string
          p_mode?: string
          p_replace_id?: string
          p_replace_updated_at?: string
          p_route_from?: string
          p_route_to?: string
          p_updated_at?: string
        }
        Returns: Json
      }
      save_quote_calculation: {
        Args: { p_id: string; p_result: Json; p_updated_at: string }
        Returns: {
          archived_at: string | null
          balance_due_days: number
          calculation: Json | null
          cancel_reason: string | null
          card_surcharge_pct: number
          category: Database["public"]["Enums"]["tour_category"]
          client_id: string
          client_type: Database["public"]["Enums"]["client_type"]
          code: string
          commission_mode: Database["public"]["Enums"]["commission_mode"]
          commission_pct: number
          created_at: string
          deposit_pct: number
          document_snapshot: Json
          fx_snapshot: Json
          id: string
          language: string
          lost_reason: string | null
          margin_mode: Database["public"]["Enums"]["margin_mode"]
          margin_pct: number
          next_followup_at: string | null
          parent_quote_id: string | null
          pax_paying: number
          pax_scenarios: Json | null
          payment_schedule: Json | null
          pdf_path: string | null
          pdf_url: string | null
          price_per_pax_usd: number | null
          pricing_config: Json
          rooming: Json
          rounding_rule: Json
          seller_id: string
          single_supplement_pp: number | null
          staff: Json
          start_date: string
          status: Database["public"]["Enums"]["quote_status"]
          tc_count: number
          template_id: string | null
          total_cost_usd: number | null
          total_margin_usd: number | null
          total_price_usd: number | null
          tour_sku: string | null
          updated_at: string
          vehicles: Json
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "quotes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      save_quote_doc_as_layout: {
        Args: { p_name: string; p_quote_id: string }
        Returns: string
      }
      save_quote_document: {
        Args: { p_patch: Json; p_quote_id: string; p_updated_at: string }
        Returns: {
          archived_at: string | null
          balance_due_days: number
          calculation: Json | null
          cancel_reason: string | null
          card_surcharge_pct: number
          category: Database["public"]["Enums"]["tour_category"]
          client_id: string
          client_type: Database["public"]["Enums"]["client_type"]
          code: string
          commission_mode: Database["public"]["Enums"]["commission_mode"]
          commission_pct: number
          created_at: string
          deposit_pct: number
          document_snapshot: Json
          fx_snapshot: Json
          id: string
          language: string
          lost_reason: string | null
          margin_mode: Database["public"]["Enums"]["margin_mode"]
          margin_pct: number
          next_followup_at: string | null
          parent_quote_id: string | null
          pax_paying: number
          pax_scenarios: Json | null
          payment_schedule: Json | null
          pdf_path: string | null
          pdf_url: string | null
          price_per_pax_usd: number | null
          pricing_config: Json
          rooming: Json
          rounding_rule: Json
          seller_id: string
          single_supplement_pp: number | null
          staff: Json
          start_date: string
          status: Database["public"]["Enums"]["quote_status"]
          tc_count: number
          template_id: string | null
          total_cost_usd: number | null
          total_margin_usd: number | null
          total_price_usd: number | null
          tour_sku: string | null
          updated_at: string
          vehicles: Json
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "quotes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      save_quote_item_label: {
        Args: {
          p_item_id: string
          p_label: string
          p_quote_id: string
          p_updated_at: string
        }
        Returns: {
          archived_at: string | null
          balance_due_days: number
          calculation: Json | null
          cancel_reason: string | null
          card_surcharge_pct: number
          category: Database["public"]["Enums"]["tour_category"]
          client_id: string
          client_type: Database["public"]["Enums"]["client_type"]
          code: string
          commission_mode: Database["public"]["Enums"]["commission_mode"]
          commission_pct: number
          created_at: string
          deposit_pct: number
          document_snapshot: Json
          fx_snapshot: Json
          id: string
          language: string
          lost_reason: string | null
          margin_mode: Database["public"]["Enums"]["margin_mode"]
          margin_pct: number
          next_followup_at: string | null
          parent_quote_id: string | null
          pax_paying: number
          pax_scenarios: Json | null
          payment_schedule: Json | null
          pdf_path: string | null
          pdf_url: string | null
          price_per_pax_usd: number | null
          pricing_config: Json
          rooming: Json
          rounding_rule: Json
          seller_id: string
          single_supplement_pp: number | null
          staff: Json
          start_date: string
          status: Database["public"]["Enums"]["quote_status"]
          tc_count: number
          template_id: string | null
          total_cost_usd: number | null
          total_margin_usd: number | null
          total_price_usd: number | null
          tour_sku: string | null
          updated_at: string
          vehicles: Json
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "quotes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      save_quote_pdf: {
        Args: {
          p_id: string
          p_path: string
          p_updated_at: string
          p_url: string
        }
        Returns: undefined
      }
      snapshot_day_block: { Args: { p_id: string }; Returns: Json }
      store_rendered_proposal: {
        Args: { p_hash: string; p_html: string; p_id: string; p_lang: string }
        Returns: undefined
      }
      transition_quote: {
        Args: {
          p_id: string
          p_note?: string
          p_to: Database["public"]["Enums"]["quote_status"]
        }
        Returns: {
          archived_at: string | null
          balance_due_days: number
          calculation: Json | null
          cancel_reason: string | null
          card_surcharge_pct: number
          category: Database["public"]["Enums"]["tour_category"]
          client_id: string
          client_type: Database["public"]["Enums"]["client_type"]
          code: string
          commission_mode: Database["public"]["Enums"]["commission_mode"]
          commission_pct: number
          created_at: string
          deposit_pct: number
          document_snapshot: Json
          fx_snapshot: Json
          id: string
          language: string
          lost_reason: string | null
          margin_mode: Database["public"]["Enums"]["margin_mode"]
          margin_pct: number
          next_followup_at: string | null
          parent_quote_id: string | null
          pax_paying: number
          pax_scenarios: Json | null
          payment_schedule: Json | null
          pdf_path: string | null
          pdf_url: string | null
          price_per_pax_usd: number | null
          pricing_config: Json
          rooming: Json
          rounding_rule: Json
          seller_id: string
          single_supplement_pp: number | null
          staff: Json
          start_date: string
          status: Database["public"]["Enums"]["quote_status"]
          tc_count: number
          template_id: string | null
          total_cost_usd: number | null
          total_margin_usd: number | null
          total_price_usd: number | null
          tour_sku: string | null
          updated_at: string
          vehicles: Json
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "quotes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      validate_day_content: { Args: { p: Json }; Returns: boolean }
      validate_quote_document_patch: { Args: { p: Json }; Returns: boolean }
      version_quote: { Args: { p_id: string }; Returns: string }
    }
    Enums: {
      activity_duration: "HD_AM" | "HD_PM" | "FD" | "NOCHE" | "TRASLADO"
      app_role: "admin" | "operacion" | "vendedor"
      approval_status: "pendiente" | "aprobado" | "rechazado"
      booking_status:
        | "pendiente"
        | "cotizacion_solicitada"
        | "reservado"
        | "confirmado"
        | "cancelado"
      catalog_status: "activo" | "pendiente" | "inactivo"
      client_type: "B2B" | "B2C"
      commission_mode: "none" | "gross"
      communication_channel: "whatsapp" | "email"
      communication_status: "pendiente" | "enviado"
      email_status: "pendiente" | "enviado" | "fallido"
      itinerary_modality: "privado" | "compartido" | "grupo"
      margin_mode: "markup" | "margin_on_price"
      meal_plan: "NONE" | "BB" | "HB" | "FB"
      media_type: "highlight" | "alojamiento"
      ops_client_type: "PRIVADO" | "GRUPO"
      ops_status: "activo" | "en_curso" | "terminado" | "cancelado"
      payable_status: "pendiente" | "parcial" | "pagado"
      payment_type: "deposito" | "saldo" | "otro"
      pricing_unit:
        | "per_person"
        | "per_group"
        | "per_room"
        | "per_vehicle"
        | "per_staff"
        | "per_unit"
      quote_status:
        | "borrador"
        | "revisada"
        | "enviada"
        | "vendida"
        | "perdida"
        | "cancelada"
      route_type: "ROUNDTRIP" | "ONEWAY"
      season: "ALL" | "DRY" | "RAIN" | "BAJA" | "MEDIA" | "ALTA" | "FESTIVO"
      service_modality: "privado" | "compartido" | "ambos"
      service_type:
        | "transporte"
        | "alojamiento"
        | "comida"
        | "guia"
        | "entrada"
        | "actividad"
        | "paquete"
        | "extra"
        | "vuelo"
      terms_scope: "B2C_general" | "B2B_general" | "B2B_cliente"
      tour_category: "BUDGET" | "COMFORT" | "VIP" | "MIXTO"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      activity_duration: ["HD_AM", "HD_PM", "FD", "NOCHE", "TRASLADO"],
      app_role: ["admin", "operacion", "vendedor"],
      approval_status: ["pendiente", "aprobado", "rechazado"],
      booking_status: [
        "pendiente",
        "cotizacion_solicitada",
        "reservado",
        "confirmado",
        "cancelado",
      ],
      catalog_status: ["activo", "pendiente", "inactivo"],
      client_type: ["B2B", "B2C"],
      commission_mode: ["none", "gross"],
      communication_channel: ["whatsapp", "email"],
      communication_status: ["pendiente", "enviado"],
      email_status: ["pendiente", "enviado", "fallido"],
      itinerary_modality: ["privado", "compartido", "grupo"],
      margin_mode: ["markup", "margin_on_price"],
      meal_plan: ["NONE", "BB", "HB", "FB"],
      media_type: ["highlight", "alojamiento"],
      ops_client_type: ["PRIVADO", "GRUPO"],
      ops_status: ["activo", "en_curso", "terminado", "cancelado"],
      payable_status: ["pendiente", "parcial", "pagado"],
      payment_type: ["deposito", "saldo", "otro"],
      pricing_unit: [
        "per_person",
        "per_group",
        "per_room",
        "per_vehicle",
        "per_staff",
        "per_unit",
      ],
      quote_status: [
        "borrador",
        "revisada",
        "enviada",
        "vendida",
        "perdida",
        "cancelada",
      ],
      route_type: ["ROUNDTRIP", "ONEWAY"],
      season: ["ALL", "DRY", "RAIN", "BAJA", "MEDIA", "ALTA", "FESTIVO"],
      service_modality: ["privado", "compartido", "ambos"],
      service_type: [
        "transporte",
        "alojamiento",
        "comida",
        "guia",
        "entrada",
        "actividad",
        "paquete",
        "extra",
        "vuelo",
      ],
      terms_scope: ["B2C_general", "B2B_general", "B2B_cliente"],
      tour_category: ["BUDGET", "COMFORT", "VIP", "MIXTO"],
    },
  },
} as const
