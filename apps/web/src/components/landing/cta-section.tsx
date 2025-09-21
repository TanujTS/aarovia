import React from 'react'
import Link from 'next/link'

export function CTASection() {
  return (
    <section className="py-16 bg-blue-600">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold text-white mb-6">
          Ready to Take Control of Your Medical Records?
        </h2>
        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          Join thousands of users who have already secured their health data with our decentralized platform.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/dashboard" 
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Get Started
          </Link>
          <Link 
            href="/demo" 
            className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
          >
            View Demo
          </Link>
        </div>
      </div>
    </section>
  )
}
