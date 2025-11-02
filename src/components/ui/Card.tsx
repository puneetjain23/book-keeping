import React from 'react'

export default function Card({ children, className='' }: { children: any, className?: string }) {
  return (
    <div className={'bg-white/90 p-4 rounded-2xl shadow-lg '+className}>
      {children}
    </div>
  )
}
