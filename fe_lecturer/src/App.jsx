import React from 'react'
import AppRoutes from './router/AppRoutes'
import { Toaster } from '@/components/ui/sonner'

export default function App() {
  return (
    <>
      <AppRoutes />
      <Toaster position="top-right" richColors />
    </>
  )
}
