import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * Hook quản lý state phân trang + filter qua URL search params.
 *
 * @param {Record<string, string|number>} defaults  Giá trị mặc định cho từng key.
 *
 * @returns {{ get, set, resetPage, searchParams }}
 *   - get(key)          → giá trị hiện tại (string), fallback về defaults[key]
 *   - set(updates)      → ghi nhiều key cùng lúc vào URL (giá trị rỗng/null/undefined → xóa param)
 *   - resetPage(extras) → set({ page: 1, ...extras }), dùng sau add/edit/delete hoặc đổi filter
 *   - searchParams      → URLSearchParams gốc (dùng làm dependency cho useEffect)
 */
export function useUrlState(defaults = {}) {
  const [searchParams, setSearchParams] = useSearchParams()

  const get = useCallback(
    (key) => searchParams.get(key) ?? String(defaults[key] ?? ''),
    [searchParams, defaults],
  )

  const set = useCallback(
    (updates) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        Object.entries(updates).forEach(([k, v]) => {
          const strDefault = String(defaults[k] ?? '')
          const strVal     = v === undefined || v === null ? '' : String(v)
          // xóa param nếu bằng default hoặc rỗng (giữ URL gọn)
          if (strVal === '' || strVal === strDefault) next.delete(k)
          else next.set(k, strVal)
        })
        return next
      })
    },
    [setSearchParams, defaults],
  )

  const resetPage = useCallback(
    (extras = {}) => set({ page: 1, ...extras }),
    [set],
  )

  return { get, set, resetPage, searchParams }
}
