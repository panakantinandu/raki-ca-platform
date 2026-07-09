import apiClient from '../api/axiosClient.js'

/** Downloads a file from an API endpoint that returns a raw file body (e.g. a CSV export). */
export async function downloadFile(url, filename) {
  const { data } = await apiClient.get(url, { responseType: 'blob' })
  const blobUrl = window.URL.createObjectURL(data)
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(blobUrl)
}
