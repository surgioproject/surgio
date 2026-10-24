import axios, { isAxiosError } from 'axios'
import { stores } from '@/stores'

const client = axios.create({})

client.interceptors.request.use((config) => {
  if (stores.config.config?.accessToken) {
    config.headers.Authorization = `Bearer ${stores.config.config.accessToken}`
  }

  return config
})

client.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (!isAxiosError(error) || !error.response) {
      return Promise.reject(error)
    }

    if (error.response.status === 401 && window.location.pathname !== '/auth') {
      window.location.href = '/api/auth/logout'
      return
    }

    return Promise.reject(error)
  }
)

export interface SuccessResponse<T> {
  status: 'ok'
  data: T
}

export const validateCookie = async () => {
  return client
    .post<
      SuccessResponse<{
        roles: string[]
        accessToken?: string
        viewerToken?: string
      }>
    >('/api/auth/validate-cookie')
    .then((res) => res.data.data)
}

export const validateToken = async () => {
  return client
    .post<
      SuccessResponse<{
        roles: string[]
        accessToken?: string
        viewerToken?: string
      }>
    >('/api/auth/validate-token')
    .then((res) => res.data.data)
}

export default client
