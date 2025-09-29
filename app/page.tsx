'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { defaultLocale } from '../i18n'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.replace(`/${defaultLocale}`)
  }, [router])

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontSize: '1.2rem'
    }}>
      Redirecting...
    </div>
  )
}