import React from 'react'
import Link from 'next/link'

export function Header() {
  return (
    <header className="bg-white shadow-sm">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-blue-600">
          Aarovia
        </Link>
        <div className="flex items-center space-x-6">
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
            Dashboard
          </Link>
          <Link href="/records" className="text-gray-600 hover:text-gray-900">
            Records
          </Link>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Connect Wallet
          </button>
        </div>
      </nav>
    </header>
  )
}
