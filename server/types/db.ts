export interface Review {
  id: string
  name: string
  sprint: string
  team: string
  description: string
  status: 'planned' | 'active' | 'completed'
  created_at: number
  started_at: number | null
  completed_at: number | null
  duration_ms: number | null
}

export interface ReviewItem {
  id: string
  review_id: string
  issue_id: string
  title: string
  presenter: string
  description: string
  demo_url: string
  item_status: 'done' | 'progress' | 'blocked'
  tags: string[]
  order_index: number
  created_at: number
}

export interface Screenshot {
  id: string
  item_id: string
  file_path: string
  original_name: string
  mime_type: string
  size_bytes: number
  order_index: number
  created_at: number
}

export interface QaEntry {
  id: string
  review_id: string
  item_id: string
  author: string
  author_role: string
  text: string
  captured_at: number
}

export interface ReviewItemWithMedia extends ReviewItem {
  screenshots: Screenshot[]
}

export interface ReviewWithItems extends Review {
  items: ReviewItemWithMedia[]
}
