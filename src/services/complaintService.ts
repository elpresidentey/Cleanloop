import { supabase } from '../lib/supabase'
import { Complaint, CreateComplaintInput, UpdateComplaintInput } from '../types'
import { DataRetrievalService, ComplaintFilters, PaginationOptions, SortOptions } from './dataRetrievalService'

export class ComplaintService {
  // Enhanced method using DataRetrievalService
  static async getComplaints(
    filters: ComplaintFilters = {},
    pagination: PaginationOptions = { page: 1, limit: 20 },
    sort: SortOptions = { field: 'created_at', direction: 'desc' }
  ) {
    return DataRetrievalService.getComplaints(filters, pagination, sort)
  }

  static async getByUserId(userId: string, limit?: number): Promise<Complaint[]> {
    const response = await DataRetrievalService.getComplaints(
      { userId },
      { page: 1, limit: limit || 20 }
    )
    return response.data
  }

  static async getById(id: string): Promise<Complaint | null> {
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw new Error(`Failed to fetch complaint: ${error.message}`)
    }

    return this.mapRowToComplaint(data)
  }

  static async create(input: CreateComplaintInput): Promise<Complaint> {
    const insertData = {
      user_id: input.userId,
      pickup_id: input.pickupId,
      description: input.description,
      photo_url: input.photoUrl || null,
      priority: input.priority,
      status: 'open' as const
    }

    const { data, error } = await (supabase as any)
      .from('complaints')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create complaint: ${error.message}`)
    }

    return this.mapRowToComplaint(data)
  }

  static async update(id: string, input: UpdateComplaintInput): Promise<Complaint> {
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (input.status !== undefined) {
      updateData.status = input.status
      if (input.status === 'resolved' || input.status === 'closed') {
        updateData.resolved_at = new Date().toISOString()
      }
    }

    if (input.priority !== undefined) {
      updateData.priority = input.priority
    }

    if (input.adminNotes !== undefined) {
      updateData.admin_notes = input.adminNotes
    }

    const { data, error } = await (supabase as any)
      .from('complaints')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update complaint: ${error.message}`)
    }

    return this.mapRowToComplaint(data)
  }

  static async uploadPhoto(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `complaint-photos/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('complaints')
      .upload(filePath, file)

    if (uploadError) {
      throw new Error(`Failed to upload photo: ${uploadError.message}`)
    }

    const { data } = supabase.storage
      .from('complaints')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  static async getByPickupId(pickupId: string): Promise<Complaint[]> {
    const response = await DataRetrievalService.getComplaints(
      {},
      { page: 1, limit: 1000 } // Get all complaints for the pickup
    )

    return response.data.filter(complaint => complaint.pickupId === pickupId)
  }

  static async getAll(limit?: number): Promise<Complaint[]> {
    const response = await DataRetrievalService.getComplaints(
      {},
      { page: 1, limit: limit || 20 }
    )
    return response.data
  }

  static async delete(id: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('complaints')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete complaint: ${error.message}`)
    }
  }

  private static mapRowToComplaint(row: any): Complaint {
    return {
      id: row.id,
      userId: row.user_id,
      pickupId: row.pickup_id,
      description: row.description,
      photoUrl: row.photo_url || undefined,
      status: row.status,
      priority: row.priority,
      createdAt: new Date(row.created_at),
      resolvedAt: row.resolved_at ? new Date(row.resolved_at) : undefined,
      adminNotes: row.admin_notes || undefined
    }
  }
}