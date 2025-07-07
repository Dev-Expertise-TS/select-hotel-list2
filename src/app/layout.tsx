import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '투어비스 럭셔리 셀렉트 AI 컨시어지',
  description: '투어비스 럭셔리 셀렉트 AI 컨시어지가 엄선한 전 세계 고급 호텔을 소개합니다. 프리미엄 호텔들에 대한 투어비스 럭셔리 셀렉트만의 특별한 혜택도 확인하실 수 있습니다.',
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
