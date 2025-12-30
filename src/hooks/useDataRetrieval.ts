import { useState, useEffect, useCallback } from 'react'
import { 
  DataRetrievalService,
  PaginationOptions,
  SortOptions,
  PaginatedResponse,
  PickupRequestFilters,
  PaymentFilters,
  ComplaintFilters,
  UserFilters,
  CustomerDetails
} from '../services/dataRetrievalService'
import { 
  PickupRequest, 
  Payment, 
  Complaint, 
  User 
} from '../types'

interface UseDataRetrievalState<T> {
  data: T[]
  loading: boolean
  error: string | null
  pagination: PaginatedResponse<T>['pagination'] | null
}

interface UseDataRetrievalOptions {
  autoFetch?: boolean
  initialPage?: number
  initialLimit?: number
}

// Hook for pickup requests
export function usePickupRequests(
  filters: PickupRequestFilters = {},
  options: UseDataRetrievalOptions = {}
) {
  const { autoFetch = true, initialPage = 1, initialLimit = 20 } = options
  
  const [state, setState] = useState<UseDataRetrievalState<PickupRequest>>({
    data: [],
    loading: false,
    error: null,
    pagination: null
  })

  const [pagination, setPagination] = useState<PaginationOptions>({
    page: initialPage,
    limit: initialLimit
  })

  const [sort, setSort] = useState<SortOptions>({
    field: 'created_at',
    direction: 'desc'
  })

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const response = await DataRetrievalService.getPickupRequests(filters, pagination, sort)
      setState({
        data: response.data,
        loading: false,
        error: null,
        pagination: response.pagination
      })
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch pickup requests'
      }))
    }
  }, [filters, pagination, sort])

  const goToPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }, [])

  const changeLimit = useCallback((limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }))
  }, [])

  const changeSort = useCallback((field: string, direction: 'asc' | 'desc') => {
    setSort({ field, direction })
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [])

  const refresh = useCallback(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (autoFetch) {
      fetchData()
    }
  }, [fetchData, autoFetch])

  return {
    ...state,
    goToPage,
    changeLimit,
    changeSort,
    refresh,
    currentPage: pagination.page,
    currentLimit: pagination.limit,
    currentSort: sort
  }
}

// Hook for payments
export function usePayments(
  filters: PaymentFilters = {},
  options: UseDataRetrievalOptions = {}
) {
  const { autoFetch = true, initialPage = 1, initialLimit = 20 } = options
  
  const [state, setState] = useState<UseDataRetrievalState<Payment>>({
    data: [],
    loading: false,
    error: null,
    pagination: null
  })

  const [pagination, setPagination] = useState<PaginationOptions>({
    page: initialPage,
    limit: initialLimit
  })

  const [sort, setSort] = useState<SortOptions>({
    field: 'created_at',
    direction: 'desc'
  })

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const response = await DataRetrievalService.getPayments(filters, pagination, sort)
      setState({
        data: response.data,
        loading: false,
        error: null,
        pagination: response.pagination
      })
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch payments'
      }))
    }
  }, [filters, pagination, sort])

  const goToPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }, [])

  const changeLimit = useCallback((limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }))
  }, [])

  const changeSort = useCallback((field: string, direction: 'asc' | 'desc') => {
    setSort({ field, direction })
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [])

  const refresh = useCallback(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (autoFetch) {
      fetchData()
    }
  }, [fetchData, autoFetch])

  return {
    ...state,
    goToPage,
    changeLimit,
    changeSort,
    refresh,
    currentPage: pagination.page,
    currentLimit: pagination.limit,
    currentSort: sort
  }
}

// Hook for complaints
export function useComplaints(
  filters: ComplaintFilters = {},
  options: UseDataRetrievalOptions = {}
) {
  const { autoFetch = true, initialPage = 1, initialLimit = 20 } = options
  
  const [state, setState] = useState<UseDataRetrievalState<Complaint>>({
    data: [],
    loading: false,
    error: null,
    pagination: null
  })

  const [pagination, setPagination] = useState<PaginationOptions>({
    page: initialPage,
    limit: initialLimit
  })

  const [sort, setSort] = useState<SortOptions>({
    field: 'created_at',
    direction: 'desc'
  })

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const response = await DataRetrievalService.getComplaints(filters, pagination, sort)
      setState({
        data: response.data,
        loading: false,
        error: null,
        pagination: response.pagination
      })
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch complaints'
      }))
    }
  }, [filters, pagination, sort])

  const goToPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }, [])

  const changeLimit = useCallback((limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }))
  }, [])

  const changeSort = useCallback((field: string, direction: 'asc' | 'desc') => {
    setSort({ field, direction })
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [])

  const refresh = useCallback(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (autoFetch) {
      fetchData()
    }
  }, [fetchData, autoFetch])

  return {
    ...state,
    goToPage,
    changeLimit,
    changeSort,
    refresh,
    currentPage: pagination.page,
    currentLimit: pagination.limit,
    currentSort: sort
  }
}

// Hook for users
export function useUsers(
  filters: UserFilters = {},
  options: UseDataRetrievalOptions = {}
) {
  const { autoFetch = true, initialPage = 1, initialLimit = 20 } = options
  
  const [state, setState] = useState<UseDataRetrievalState<User>>({
    data: [],
    loading: false,
    error: null,
    pagination: null
  })

  const [pagination, setPagination] = useState<PaginationOptions>({
    page: initialPage,
    limit: initialLimit
  })

  const [sort, setSort] = useState<SortOptions>({
    field: 'created_at',
    direction: 'desc'
  })

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const response = await DataRetrievalService.getUsers(filters, pagination, sort)
      setState({
        data: response.data,
        loading: false,
        error: null,
        pagination: response.pagination
      })
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch users'
      }))
    }
  }, [filters, pagination, sort])

  const goToPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }, [])

  const changeLimit = useCallback((limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }))
  }, [])

  const changeSort = useCallback((field: string, direction: 'asc' | 'desc') => {
    setSort({ field, direction })
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [])

  const refresh = useCallback(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (autoFetch) {
      fetchData()
    }
  }, [fetchData, autoFetch])

  return {
    ...state,
    goToPage,
    changeLimit,
    changeSort,
    refresh,
    currentPage: pagination.page,
    currentLimit: pagination.limit,
    currentSort: sort
  }
}

// Hook for customer details (collector-specific)
export function useCustomerDetails(
  collectorId: string,
  filters: UserFilters = {},
  options: UseDataRetrievalOptions = {}
) {
  const { autoFetch = true, initialPage = 1, initialLimit = 20 } = options
  
  const [state, setState] = useState<UseDataRetrievalState<CustomerDetails>>({
    data: [],
    loading: false,
    error: null,
    pagination: null
  })

  const [pagination, setPagination] = useState<PaginationOptions>({
    page: initialPage,
    limit: initialLimit
  })

  const [sort, setSort] = useState<SortOptions>({
    field: 'name',
    direction: 'asc'
  })

  const fetchData = useCallback(async () => {
    if (!collectorId) return
    
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const response = await DataRetrievalService.getCustomerDetails(collectorId, filters, pagination, sort)
      setState({
        data: response.data,
        loading: false,
        error: null,
        pagination: response.pagination
      })
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch customer details'
      }))
    }
  }, [collectorId, filters, pagination, sort])

  const goToPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }, [])

  const changeLimit = useCallback((limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }))
  }, [])

  const changeSort = useCallback((field: string, direction: 'asc' | 'desc') => {
    setSort({ field, direction })
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [])

  const refresh = useCallback(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (autoFetch && collectorId) {
      fetchData()
    }
  }, [fetchData, autoFetch, collectorId])

  return {
    ...state,
    goToPage,
    changeLimit,
    changeSort,
    refresh,
    currentPage: pagination.page,
    currentLimit: pagination.limit,
    currentSort: sort
  }
}

// Hook for global search
export function useGlobalSearch() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<{
    pickups: PickupRequest[]
    payments: Payment[]
    complaints: Complaint[]
    users: User[]
  }>({
    pickups: [],
    payments: [],
    complaints: [],
    users: []
  })

  const search = useCallback(async (
    searchTerm: string,
    userId?: string,
    dataTypes: ('pickups' | 'payments' | 'complaints' | 'users')[] = ['pickups', 'payments', 'complaints'],
    limit: number = 10
  ) => {
    if (!searchTerm.trim()) {
      setResults({ pickups: [], payments: [], complaints: [], users: [] })
      return
    }

    setLoading(true)
    setError(null)

    try {
      const searchResults = await DataRetrievalService.globalSearch(searchTerm, userId, dataTypes, limit)
      setResults(searchResults)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Search failed')
      setResults({ pickups: [], payments: [], complaints: [], users: [] })
    } finally {
      setLoading(false)
    }
  }, [])

  const clearResults = useCallback(() => {
    setResults({ pickups: [], payments: [], complaints: [], users: [] })
    setError(null)
  }, [])

  return {
    results,
    loading,
    error,
    search,
    clearResults
  }
}