export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      person: {
        Row: {
          id: string
          first_name: string
          last_name: string | null
          maiden_name: string | null
          gender: string | null
          date_of_birth: string | null
          date_of_death: string | null
          birth_place: string | null
          birth_order: number | null
          biography: string | null
          profile_photo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name?: string | null
          maiden_name?: string | null
          gender?: string | null
          date_of_birth?: string | null
          date_of_death?: string | null
          birth_place?: string | null
          birth_order?: number | null
          biography?: string | null
          profile_photo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string | null
          maiden_name?: string | null
          gender?: string | null
          date_of_birth?: string | null
          date_of_death?: string | null
          birth_place?: string | null
          birth_order?: number | null
          biography?: string | null
          profile_photo_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      relationship: {
        Row: {
          id: string
          type: string
          person1_id: string
          person2_id: string
          start_date: string | null
          end_date: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          type: string
          person1_id: string
          person2_id: string
          start_date?: string | null
          end_date?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          type?: string
          person1_id?: string
          person2_id?: string
          start_date?: string | null
          end_date?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
      family_group: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
        }
      }
      person_family_group: {
        Row: {
          person_id: string
          family_group_id: string
          role: string | null
          added_at: string
        }
        Insert: {
          person_id: string
          family_group_id: string
          role?: string | null
          added_at?: string
        }
        Update: {
          person_id?: string
          family_group_id?: string
          role?: string | null
          added_at?: string
        }
      }
    }
  }
}
