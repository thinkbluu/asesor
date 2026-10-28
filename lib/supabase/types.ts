// ============================================================
// ASESOR · lib/supabase/types.ts
// Hand-written Database type in the exact shape `supabase gen types`
// produces, matching scripts/001–007.
//
// Conventions mirrored from the SQL:
//   uuid → string · timestamptz/date/time → string · numeric → number
//   jsonb → Json · text[] → string[] · citext → string
//   nullable or has-default columns are optional in Insert; all optional in Update.
//
// NOTE: `Relationships` arrays are intentionally empty — supabase-js does not
// need them at runtime (they only power tooling hints). Re-run
// `supabase gen types` after any schema change to regenerate fully.
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      salons: {
        Row: {
          id: string
          name: string
          slug: string
          city: string | null
          address: string | null
          phone: string | null
          email: string | null
          description: string | null
          cancellation_policy: string | null
          cancellation_window_hours: number
          timezone: string
          booking_settings: Json
          branding: Json
          loyalty_config: Json
          reviews_config: Json
          google_review_url: string | null
          plan: string
          trial_ends_at: string | null
          pilot_until: string | null
          stripe_customer_id: string | null
          is_demo: boolean
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          city?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          description?: string | null
          cancellation_policy?: string | null
          cancellation_window_hours?: number
          timezone?: string
          booking_settings?: Json
          branding?: Json
          loyalty_config?: Json
          reviews_config?: Json
          google_review_url?: string | null
          plan?: string
          trial_ends_at?: string | null
          pilot_until?: string | null
          stripe_customer_id?: string | null
          is_demo?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          city?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          description?: string | null
          cancellation_policy?: string | null
          cancellation_window_hours?: number
          timezone?: string
          booking_settings?: Json
          branding?: Json
          loyalty_config?: Json
          reviews_config?: Json
          google_review_url?: string | null
          plan?: string
          trial_ends_at?: string | null
          pilot_until?: string | null
          stripe_customer_id?: string | null
          is_demo?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          terms_accepted_at: string | null
          dpa_accepted_at: string | null
          privacy_accepted_at: string | null
          terms_version: string | null
          dpa_version: string | null
          privacy_version: string | null
          marketing_opt_in: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          phone?: string | null
          terms_accepted_at?: string | null
          dpa_accepted_at?: string | null
          privacy_accepted_at?: string | null
          terms_version?: string | null
          dpa_version?: string | null
          privacy_version?: string | null
          marketing_opt_in?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          phone?: string | null
          terms_accepted_at?: string | null
          dpa_accepted_at?: string | null
          privacy_accepted_at?: string | null
          terms_version?: string | null
          dpa_version?: string | null
          privacy_version?: string | null
          marketing_opt_in?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      staff: {
        Row: {
          id: string
          salon_id: string
          first_name: string
          last_name: string
          role_title: string | null
          phone: string | null
          email: string | null
          status: Database['public']['Enums']['staff_status']
          hired_at: string | null
          commission_type: Database['public']['Enums']['commission_type'] | null
          commission_rate: number | null
          color: string | null
          notes: string | null
          sort_order: number
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          salon_id: string
          first_name: string
          last_name: string
          role_title?: string | null
          phone?: string | null
          email?: string | null
          status?: Database['public']['Enums']['staff_status']
          hired_at?: string | null
          commission_type?: Database['public']['Enums']['commission_type'] | null
          commission_rate?: number | null
          color?: string | null
          notes?: string | null
          sort_order?: number
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          salon_id?: string
          first_name?: string
          last_name?: string
          role_title?: string | null
          phone?: string | null
          email?: string | null
          status?: Database['public']['Enums']['staff_status']
          hired_at?: string | null
          commission_type?: Database['public']['Enums']['commission_type'] | null
          commission_rate?: number | null
          color?: string | null
          notes?: string | null
          sort_order?: number
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      salon_members: {
        Row: {
          id: string
          salon_id: string
          user_id: string
          role: Database['public']['Enums']['member_role']
          staff_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          salon_id: string
          user_id: string
          role: Database['public']['Enums']['member_role']
          staff_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          salon_id?: string
          user_id?: string
          role?: Database['public']['Enums']['member_role']
          staff_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      salon_invites: {
        Row: {
          id: string
          salon_id: string
          email: string
          role: Database['public']['Enums']['member_role']
          staff_id: string | null
          token_hash: string
          expires_at: string
          accepted_at: string | null
          invited_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          salon_id: string
          email: string
          role: Database['public']['Enums']['member_role']
          staff_id?: string | null
          token_hash: string
          expires_at: string
          accepted_at?: string | null
          invited_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          salon_id?: string
          email?: string
          role?: Database['public']['Enums']['member_role']
          staff_id?: string | null
          token_hash?: string
          expires_at?: string
          accepted_at?: string | null
          invited_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      salon_hours: {
        Row: {
          id: string
          salon_id: string
          weekday: number
          opens: string | null
          closes: string | null
          is_open: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          salon_id: string
          weekday: number
          opens?: string | null
          closes?: string | null
          is_open?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          salon_id?: string
          weekday?: number
          opens?: string | null
          closes?: string | null
          is_open?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      staff_schedules: {
        Row: {
          id: string
          staff_id: string
          salon_id: string
          weekday: number
          start_time: string | null
          end_time: string | null
          break_start: string | null
          break_end: string | null
          is_working: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          staff_id: string
          salon_id: string
          weekday: number
          start_time?: string | null
          end_time?: string | null
          break_start?: string | null
          break_end?: string | null
          is_working?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          staff_id?: string
          salon_id?: string
          weekday?: number
          start_time?: string | null
          end_time?: string | null
          break_start?: string | null
          break_end?: string | null
          is_working?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      staff_time_off: {
        Row: {
          id: string
          staff_id: string
          salon_id: string
          starts_at: string
          ends_at: string
          reason: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          staff_id: string
          salon_id: string
          starts_at: string
          ends_at: string
          reason?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          staff_id?: string
          salon_id?: string
          starts_at?: string
          ends_at?: string
          reason?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      blocked_slots: {
        Row: {
          id: string
          staff_id: string
          salon_id: string
          starts_at: string
          ends_at: string
          reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          staff_id: string
          salon_id: string
          starts_at: string
          ends_at: string
          reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          staff_id?: string
          salon_id?: string
          starts_at?: string
          ends_at?: string
          reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_categories: {
        Row: {
          id: string
          salon_id: string
          name: string
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          salon_id: string
          name: string
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          salon_id?: string
          name?: string
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          id: string
          salon_id: string
          category_id: string | null
          name: string
          description: string | null
          duration_min: number
          buffer_min: number
          price: number
          price_from: boolean
          online_bookable: boolean
          active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          salon_id: string
          category_id?: string | null
          name: string
          description?: string | null
          duration_min: number
          buffer_min?: number
          price?: number
          price_from?: boolean
          online_bookable?: boolean
          active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          salon_id?: string
          category_id?: string | null
          name?: string
          description?: string | null
          duration_min?: number
          buffer_min?: number
          price?: number
          price_from?: boolean
          online_bookable?: boolean
          active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      staff_services: {
        Row: {
          staff_id: string
          service_id: string
          salon_id: string
          price_override: number | null
          duration_override: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          staff_id: string
          service_id: string
          salon_id: string
          price_override?: number | null
          duration_override?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          staff_id?: string
          service_id?: string
          salon_id?: string
          price_override?: number | null
          duration_override?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          id: string
          salon_id: string
          first_name: string
          last_name: string
          phone: string
          whatsapp_phone: string | null
          email: string | null
          birth_date: string | null
          sex: string | null
          source: string | null
          tags: string[]
          preferred_staff_id: string | null
          communication_pref: string | null
          notes: string | null
          marketing_consent: boolean
          marketing_consent_at: string | null
          balance_due: number
          loyalty_points: number
          lifetime_points: number
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          salon_id: string
          first_name: string
          last_name: string
          phone: string
          whatsapp_phone?: string | null
          email?: string | null
          birth_date?: string | null
          sex?: string | null
          source?: string | null
          tags?: string[]
          preferred_staff_id?: string | null
          communication_pref?: string | null
          notes?: string | null
          marketing_consent?: boolean
          marketing_consent_at?: string | null
          balance_due?: number
          loyalty_points?: number
          lifetime_points?: number
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          salon_id?: string
          first_name?: string
          last_name?: string
          phone?: string
          whatsapp_phone?: string | null
          email?: string | null
          birth_date?: string | null
          sex?: string | null
          source?: string | null
          tags?: string[]
          preferred_staff_id?: string | null
          communication_pref?: string | null
          notes?: string | null
          marketing_consent?: boolean
          marketing_consent_at?: string | null
          balance_due?: number
          loyalty_points?: number
          lifetime_points?: number
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_sensitive: {
        Row: {
          client_id: string
          salon_id: string
          allergies_enc: string | null
          color_formulas_enc: string | null
          health_consent_at: string | null
          health_consent_source: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          client_id: string
          salon_id: string
          allergies_enc?: string | null
          color_formulas_enc?: string | null
          health_consent_at?: string | null
          health_consent_source?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          salon_id?: string
          allergies_enc?: string | null
          color_formulas_enc?: string | null
          health_consent_at?: string | null
          health_consent_source?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_photos: {
        Row: {
          id: string
          salon_id: string
          client_id: string
          storage_path: string
          caption: string | null
          taken_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          salon_id: string
          client_id: string
          storage_path: string
          caption?: string | null
          taken_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          salon_id?: string
          client_id?: string
          storage_path?: string
          caption?: string | null
          taken_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      consents: {
        Row: {
          id: string
          salon_id: string
          client_id: string
          kind: string
          granted: boolean
          text_version: string | null
          source: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          salon_id: string
          client_id: string
          kind: string
          granted?: boolean
          text_version?: string | null
          source?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          salon_id?: string
          client_id?: string
          kind?: string
          granted?: boolean
          text_version?: string | null
          source?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          id: string
          salon_id: string
          client_id: string
          staff_id: string
          starts_at: string
          ends_at: string
          status: Database['public']['Enums']['appointment_status']
          source: Database['public']['Enums']['appointment_source']
          notes: string | null
          total_price: number
          discount: number
          discount_type: string
          recurrence_rule: string | null
          recurrence_parent_id: string | null
          confirmation_code: string | null
          manage_token_hash: string | null
          reminder_sent_at: string | null
          cancel_reason: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          salon_id: string
          client_id: string
          staff_id: string
          starts_at: string
          ends_at: string
          status?: Database['public']['Enums']['appointment_status']
          source?: Database['public']['Enums']['appointment_source']
          notes?: string | null
          total_price?: number
          discount?: number
          discount_type?: string
          recurrence_rule?: string | null
          recurrence_parent_id?: string | null
          confirmation_code?: string | null
          manage_token_hash?: string | null
          reminder_sent_at?: string | null
          cancel_reason?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          salon_id?: string
          client_id?: string
          staff_id?: string
          starts_at?: string
          ends_at?: string
          status?: Database['public']['Enums']['appointment_status']
          source?: Database['public']['Enums']['appointment_source']
          notes?: string | null
          total_price?: number
          discount?: number
          discount_type?: string
          recurrence_rule?: string | null
          recurrence_parent_id?: string | null
          confirmation_code?: string | null
          manage_token_hash?: string | null
          reminder_sent_at?: string | null
          cancel_reason?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      appointment_services: {
        Row: {
          id: string
          appointment_id: string
          salon_id: string
          service_id: string | null
          name_snapshot: string
          price: number
          duration_min: number
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          appointment_id: string
          salon_id: string
          service_id?: string | null
          name_snapshot: string
          price?: number
          duration_min: number
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          appointment_id?: string
          salon_id?: string
          service_id?: string | null
          name_snapshot?: string
          price?: number
          duration_min?: number
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          salon_id: string
          name: string
          brand: string | null
          category: string | null
          sku: string | null
          unit: string
          stock: number
          min_stock: number
          cost_price: number | null
          retail_price: number | null
          supplier_name: string | null
          supplier_phone: string | null
          supplier_email: string | null
          notes: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          salon_id: string
          name: string
          brand?: string | null
          category?: string | null
          sku?: string | null
          unit?: string
          stock?: number
          min_stock?: number
          cost_price?: number | null
          retail_price?: number | null
          supplier_name?: string | null
          supplier_phone?: string | null
          supplier_email?: string | null
          notes?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          salon_id?: string
          name?: string
          brand?: string | null
          category?: string | null
          sku?: string | null
          unit?: string
          stock?: number
          min_stock?: number
          cost_price?: number | null
          retail_price?: number | null
          supplier_name?: string | null
          supplier_phone?: string | null
          supplier_email?: string | null
          notes?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_products: {
        Row: {
          id: string
          service_id: string
          product_id: string
          salon_id: string
          quantity_per_use: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          service_id: string
          product_id: string
          salon_id: string
          quantity_per_use?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          service_id?: string
          product_id?: string
          salon_id?: string
          quantity_per_use?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          id: string
          salon_id: string
          product_id: string
          type: Database['public']['Enums']['stock_movement_type']
          quantity: number
          note: string | null
          invoice_number: string | null
          appointment_id: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          salon_id: string
          product_id: string
          type: Database['public']['Enums']['stock_movement_type']
          quantity: number
          note?: string | null
          invoice_number?: string | null
          appointment_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          salon_id?: string
          product_id?: string
          type?: Database['public']['Enums']['stock_movement_type']
          quantity?: number
          note?: string | null
          invoice_number?: string | null
          appointment_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          id: string
          salon_id: string
          appointment_id: string | null
          client_id: string | null
          staff_id: string | null
          amount: number
          tip: number
          discount: number
          payment_method: Database['public']['Enums']['payment_method'] | null
          status: Database['public']['Enums']['transaction_status']
          notes: string | null
          paid_at: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          salon_id: string
          appointment_id?: string | null
          client_id?: string | null
          staff_id?: string | null
          amount?: number
          tip?: number
          discount?: number
          payment_method?: Database['public']['Enums']['payment_method'] | null
          status?: Database['public']['Enums']['transaction_status']
          notes?: string | null
          paid_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          salon_id?: string
          appointment_id?: string | null
          client_id?: string | null
          staff_id?: string | null
          amount?: number
          tip?: number
          discount?: number
          payment_method?: Database['public']['Enums']['payment_method'] | null
          status?: Database['public']['Enums']['transaction_status']
          notes?: string | null
          paid_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          id: string
          salon_id: string
          spent_on: string
          category: Database['public']['Enums']['expense_category']
          description: string | null
          amount: number
          frequency: string
          receipt_path: string | null
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          salon_id: string
          spent_on?: string
          category: Database['public']['Enums']['expense_category']
          description?: string | null
          amount: number
          frequency?: string
          receipt_path?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          salon_id?: string
          spent_on?: string
          category?: Database['public']['Enums']['expense_category']
          description?: string | null
          amount?: number
          frequency?: string
          receipt_path?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      day_closes: {
        Row: {
          id: string
          salon_id: string
          day: string
          totals: Json | null
          cash_counted: number | null
          difference: number | null
          closed_by: string | null
          closed_at: string | null
          reopened_at: string | null
          reopened_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          salon_id: string
          day: string
          totals?: Json | null
          cash_counted?: number | null
          difference?: number | null
          closed_by?: string | null
          closed_at?: string | null
          reopened_at?: string | null
          reopened_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          salon_id?: string
          day?: string
          totals?: Json | null
          cash_counted?: number | null
          difference?: number | null
          closed_by?: string | null
          closed_at?: string | null
          reopened_at?: string | null
          reopened_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      loyalty_ledger: {
        Row: {
          id: string
          salon_id: string
          client_id: string
          type: string
          points: number
          appointment_id: string | null
          note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          salon_id: string
          client_id: string
          type: string
          points: number
          appointment_id?: string | null
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          salon_id?: string
          client_id?: string
          type?: string
          points?: number
          appointment_id?: string | null
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      feedback_requests: {
        Row: {
          id: string
          salon_id: string
          appointment_id: string | null
          client_id: string | null
          token_hash: string
          expires_at: string
          rating: number | null
          comment: string | null
          routed_to_google: boolean
          answered_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          salon_id: string
          appointment_id?: string | null
          client_id?: string | null
          token_hash: string
          expires_at: string
          rating?: number | null
          comment?: string | null
          routed_to_google?: boolean
          answered_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          salon_id?: string
          appointment_id?: string | null
          client_id?: string | null
          token_hash?: string
          expires_at?: string
          rating?: number | null
          comment?: string | null
          routed_to_google?: boolean
          answered_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      message_log: {
        Row: {
          id: string
          salon_id: string
          appointment_id: string | null
          channel: string
          kind: string
          to_address: string
          status: string
          provider_id: string | null
          error: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          salon_id: string
          appointment_id?: string | null
          channel?: string
          kind: string
          to_address: string
          status: string
          provider_id?: string | null
          error?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          salon_id?: string
          appointment_id?: string | null
          channel?: string
          kind?: string
          to_address?: string
          status?: string
          provider_id?: string | null
          error?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          id: string
          salon_id: string
          actor_user_id: string | null
          action: string
          entity: string
          entity_id: string | null
          meta: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          salon_id: string
          actor_user_id?: string | null
          action: string
          entity: string
          entity_id?: string | null
          meta?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          salon_id?: string
          actor_user_id?: string | null
          action?: string
          entity?: string
          entity_id?: string | null
          meta?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_requests: {
        Row: {
          id: string
          name: string | null
          email: string | null
          phone: string | null
          salon_name: string | null
          subject: string | null
          message: string | null
          source_page: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name?: string | null
          email?: string | null
          phone?: string | null
          salon_name?: string | null
          subject?: string | null
          message?: string | null
          source_page?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          email?: string | null
          phone?: string | null
          salon_name?: string | null
          subject?: string | null
          message?: string | null
          source_page?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          key: string
          window_start: string
          count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          key: string
          window_start: string
          count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          key?: string
          window_start?: string
          count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      // staff_month_stats (scripts/012): postgres-owned view, NOT
      // security_invoker — the WHERE guard is the RLS layer for financial
      // data (owner/manager/receptionist see the salon, staff only their row).
      staff_month_stats: {
        Row: {
          staff_id: string
          salon_id: string
          month_start: string
          appointments_count: number
          no_show_rate: number | null
          revenue: number
          services_count: number
          scheduled_minutes: number
          booked_minutes: number
          utilization: number | null
          avg_rating: number | null
          commission_type: Database["public"]["Enums"]["commission_type"] | null
          commission_rate: number | null
          commission_amount: number
        }
        Insert: never
        Update: never
        Relationships: []
      }
      // staff_week_trend (scripts/012): postgres-owned view, same guard as
      // staff_month_stats — one row per staff per day, last 7 days.
      staff_week_trend: {
        Row: {
          staff_id: string
          salon_id: string
          day: string
          appointments_count: number
          revenue: number
        }
        Insert: never
        Update: never
        Relationships: []
      }
      // client_stats (scripts/010): security_invoker view — computed totals per
      // client (visits, spent, last visit); RLS of the underlying tables applies.
      client_stats: {
        Row: {
          client_id: string
          salon_id: string
          total_visits: number
          total_spent: number
          last_visit_at: string | null
        }
        Insert: never
        Update: never
        Relationships: []
      }
      // client_safety_flags (scripts/010): postgres-owned view, NOT
      // security_invoker — readable by every salon role (safety signal for the
      // calendar). Exposes ONLY the boolean, never ciphertext or plaintext.
      client_safety_flags: {
        Row: {
          client_id: string
          salon_id: string
          has_allergies: boolean
        }
        Insert: never
        Update: never
        Relationships: []
      }
      // products_public (scripts/008): postgres-owned view, NOT security_invoker.
      // Bypasses the products table RLS (owner/manager-only), filters rows with
      // is_salon_member(salon_id), and deliberately omits cost_price.
      // Select granted to authenticated only.
      products_public: {
        Row: {
          id: string
          salon_id: string
          name: string
          brand: string | null
          category: string | null
          sku: string | null
          unit: string
          stock: number
          min_stock: number
          retail_price: number | null
          supplier_name: string | null
          supplier_phone: string | null
          supplier_email: string | null
          notes: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: never
        Update: never
        Relationships: []
      }
    }
    Functions: {
      accept_invite: { Args: { p_token: string }; Returns: string }
      apply_stock_movement: { Args: Record<string, never>; Returns: undefined }
      client_search_text: {
        Args: { p_first: string; p_last: string; p_phone: string }
        Returns: string
      }
      create_appointment_rpc: {
        Args: {
          p_salon_id: string
          p_client_id: string
          p_staff_id: string
          p_starts_at: string
          p_ends_at: string
          p_status: Database['public']['Enums']['appointment_status']
          p_notes: string | null
          p_total_price: number
          p_discount: number
          p_discount_type: string
          p_services: Json
          p_recurrence?: string
          p_override?: boolean
        }
        Returns: Json
      }
      create_salon_for_current_user: {
        Args: { p_name: string; p_city: string }
        Returns: string
      }
      current_staff_id: { Args: { p_salon: string }; Returns: string }
      dashboard_summary: { Args: { p_salon: string; p_day: string }; Returns: Json }
      update_appointment_rpc: {
        Args: {
          p_appointment_id: string
          p_salon_id: string
          p_client_id: string
          p_staff_id: string
          p_starts_at: string
          p_ends_at: string
          p_status: Database['public']['Enums']['appointment_status']
          p_notes: string | null
          p_total_price: number
          p_discount: number
          p_discount_type: string
          p_services: Json
          p_override?: boolean
          p_scope?: string
        }
        Returns: Json
      }
      expire_loyalty_points: { Args: Record<string, never>; Returns: undefined }
      handle_new_user: { Args: Record<string, never>; Returns: undefined }
      has_salon_role: {
        Args: { p_salon: string; p_roles: Database['public']['Enums']['member_role'][] }
        Returns: boolean
      }
      is_salon_member: { Args: { p_salon: string }; Returns: boolean }
      on_appointment_finalized: { Args: Record<string, never>; Returns: undefined }
      public_availability: {
        Args: {
          p_slug: string
          p_service_ids: string[]
          p_staff_id?: string
          p_day?: string
        }
        Returns: Json
      }
      public_salon_profile: { Args: { p_slug: string }; Returns: Json }
      public_services: {
        Args: { p_slug: string }
        Returns: {
          id: string
          name: string
          category: string
          duration_min: number
          price: number
          price_from: boolean
          sort_order: number
        }[]
      }
      public_staff: {
        Args: { p_slug: string; p_service_ids: string[] }
        Returns: {
          id: string
          first_name: string
          role_title: string | null
          color: string | null
        }[]
      }
      purge_deleted_salons: { Args: Record<string, never>; Returns: undefined }
      purge_demo_bookings: { Args: Record<string, never>; Returns: undefined }
      retention_cleanup: { Args: Record<string, never>; Returns: undefined }
      salon_role: {
        Args: { p_salon: string }
        Returns: Database['public']['Enums']['member_role']
      }
      set_updated_at: { Args: Record<string, never>; Returns: undefined }
      storage_salon_id: { Args: { p_path: string }; Returns: string }
    }
    Enums: {
      appointment_source: 'online' | 'telefon' | 'salon' | 'whatsapp'
      appointment_status:
        | 'in_asteptare'
        | 'confirmat'
        | 'in_desfasurare'
        | 'finalizat'
        | 'anulat'
        | 'no_show'
      commission_type: 'procent' | 'fix' | 'salariu'
      expense_category:
        | 'chirie'
        | 'salarii'
        | 'produse'
        | 'marketing'
        | 'utilitati'
        | 'echipamente'
        | 'altele'
      member_role: 'owner' | 'manager' | 'staff' | 'receptionist'
      payment_method: 'numerar' | 'card' | 'transfer'
      staff_status: 'activ' | 'concediu' | 'inactiv'
      stock_movement_type: 'receptie' | 'consum' | 'ajustare' | 'pierdere' | 'retur'
      transaction_status: 'incasat' | 'rambursata' | 'in_asteptare'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, 'public'>]

export type Tables<
  TTableName extends keyof PublicSchema['Tables'],
  TSchemaName extends keyof Database = 'public',
> = TSchemaName extends keyof Database
  ? Database[TSchemaName] extends { Tables: Record<TTableName, any> }
    ? Database[TSchemaName]['Tables'][TTableName] extends { Row: infer R }
      ? R
      : never
    : never
  : never

export type TablesInsert<
  TTableName extends keyof PublicSchema['Tables'],
  TSchemaName extends keyof Database = 'public',
> = TSchemaName extends keyof Database
  ? Database[TSchemaName] extends { Tables: Record<TTableName, any> }
    ? Database[TSchemaName]['Tables'][TTableName] extends { Insert: infer I }
      ? I
      : never
    : never
  : never

export type TablesUpdate<
  TTableName extends keyof PublicSchema['Tables'],
  TSchemaName extends keyof Database = 'public',
> = TSchemaName extends keyof Database
  ? Database[TSchemaName] extends { Tables: Record<TTableName, any> }
    ? Database[TSchemaName]['Tables'][TTableName] extends { Update: infer U }
      ? U
      : never
    : never
  : never

export type Views<
  TViewName extends keyof PublicSchema['Views'],
  TSchemaName extends keyof Database = 'public',
> = TSchemaName extends keyof Database
  ? Database[TSchemaName] extends { Views: Record<TViewName, any> }
    ? Database[TSchemaName]['Views'][TViewName] extends { Row: infer R }
      ? R
      : never
    : never
  : never

export type Functions<
  TFunctionName extends keyof PublicSchema['Functions'],
  TSchemaName extends keyof Database = 'public',
> = TSchemaName extends keyof Database
  ? Database[TSchemaName] extends { Functions: Record<TFunctionName, any> }
    ? Database[TSchemaName]['Functions'][TFunctionName]
    : never
  : never

export type Enums<
  TEnumName extends keyof PublicSchema['Enums'],
  TSchemaName extends keyof Database = 'public',
> = TSchemaName extends keyof Database
  ? Database[TSchemaName] extends { Enums: Record<TEnumName, any> }
    ? Database[TSchemaName]['Enums'][TEnumName]
    : never
  : never
