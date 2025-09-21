import React from 'react'
import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Aarovia</h3>
            <p className="text-gray-400">
              Secure, decentralized medical record management.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/dashboard">Dashboard</Link></li>
              <li><Link href="/records">Medical Records</Link></li>
              <li><Link href="/providers">Healthcare Providers</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/help">Help Center</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/privacy">Privacy Policy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Developer</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/docs">Documentation</Link></li>
              <li><Link href="/api">API Reference</Link></li>
              <li><Link href="/github">GitHub</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 Aarovia. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
