import React from 'react'

export function FeaturesSection() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4">🔐 Secure Storage</h3>
            <p>End-to-end encrypted medical records stored on IPFS</p>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4">🏥 Provider Access</h3>
            <p>Grant temporary access to healthcare providers</p>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4">🚨 Emergency Mode</h3>
            <p>Critical health info accessible in emergencies</p>
          </div>
        </div>
      </div>
    </section>
  )
}
