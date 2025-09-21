'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'

export function Header() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [metaMaskAvailable, setMetaMaskAvailable] = useState(false)

  useEffect(() => {
    checkMetaMaskStatus()
  }, [])

  const checkMetaMaskStatus = () => {
    if (typeof window !== 'undefined') {
      const isAvailable = typeof window.ethereum !== 'undefined' && !!window.ethereum?.isMetaMask
      setMetaMaskAvailable(isAvailable)
      console.log('MetaMask available:', isAvailable)
    }
  }

  const connectWallet = async () => {
    console.log('🔍 Connect wallet clicked!')
    setIsConnecting(true)

    if (window.ethereum && window.ethereum.isMetaMask) {
      console.log('MetaMask detected!')
      try {
        console.log('📝 Requesting eth_requestAccounts...')

        //extension popup triggered
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        })
        console.log("Connected:", accounts[0])

        //gets id from extensison
        const networkId = await window.ethereum.request({
          method: 'net_version'
        })
        console.log("Network ID:", networkId)

        const walletAddr = accounts[0]
        console.log("Wallet Address:", walletAddr)

        const message = "Sign this message to authenticate with Aarovia Medical Records"
        
        // Request signature from MetaMask
        const signature = await window.ethereum.request({
          method: "personal_sign",
          params: [message, walletAddr],
        })
        console.log("Signature:", signature)

        setWalletAddress(walletAddr)

        const loginData = {
          address: walletAddr,
          signature: signature,
          message: message
        }
        console.log("Login Data for API:", loginData)

        // Store login data globally for potential API calls
        ;(window as any).loginData = loginData

      } catch (err: any) {
        console.error("Error:", err)
        alert(`Connection failed: ${err.message}`)
      }
    } else {
      console.log('MetaMask not found or not enabled')
      alert('MetaMask not found! Please install MetaMask extension from https://metamask.io/download/')
    }
    
    setIsConnecting(false)
  }

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

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
          
          {walletAddress ? (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {formatAddress(walletAddress)}
              </span>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
          ) : (
            <button 
              onClick={connectWallet}
              disabled={isConnecting || !metaMaskAvailable}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isConnecting 
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : metaMaskAvailable
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              {isConnecting 
                ? 'Connecting...' 
                : metaMaskAvailable 
                  ? 'Connect Wallet'
                  : 'Install MetaMask'
              }
            </button>
          )}
        </div>
      </nav>
    </header>
  )
}
