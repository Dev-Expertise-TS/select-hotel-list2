import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '럭셔리 셀렉트 AI 컨시어지',
  description: '럭셔리 셀렉트 호텔의 혜택을 확인하시고 호텔의 상세 소개 및 요금을 확인하세요. ',
  generator: '타이드스퀘어',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
