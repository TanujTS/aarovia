import React from 'react'

export function HeroSection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Your Medical Records, <span className="text-blue-600">Your Control</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Secure, decentralized medical record management powered by blockchain technology.
        </p>
        <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700">
          Get Started
        </button>
      </div>
    </section>
  )
}
