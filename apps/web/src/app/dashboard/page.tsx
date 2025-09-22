"use client";
import React from 'react';
import { Globe, User, FileText, Upload, Users, Shield, Truck, ChevronRight } from 'lucide-react';
import Image from 'next/image';

const PatientDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-400 px-6 py-4">
        <div className="flex items-center justify-start max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <Globe className="w-10 h-10 text-white" />
            <h1 className="text-3xl font-bold text-white tracking-wide">AAROVIA</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Welcome Title */}
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-blue-600 mb-4">
            Welcome, [Patient Name]
          </h2>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Human Anatomy Figure */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-b from-blue-500 to-cyan-400 rounded-3xl p-8 h-full min-h-[600px] flex items-center justify-center shadow-lg">
              {/* Placeholder for human anatomy figure */}
              <div className="text-center text-white">
                <div className="w-48 h-96 mx-auto bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mb-4">
                    <Image 
                        src="/image 1.png"
                        alt="Human Anatomy Figure"
                        width="192"
                        height="384"
                        className="w-full h-full object-contain"/>
                  <User className="w-24 h-24 text-white opacity-50" />
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column - Patient Information */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-8 h-full shadow-lg">
              {/* Profile Section */}
              <div className="flex items-center mb-8">
                <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mr-4">
                  <User className="w-8 h-8 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">[Patient Name]</h3>
                </div>
              </div>

              {/* Patient Details */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-bold text-gray-800 mb-2">Age:</h4>
                </div>
                
                <div>
                  <h4 className="text-lg font-bold text-gray-800 mb-2">Blood Group:</h4>
                </div>
                
                <div>
                  <h4 className="text-lg font-bold text-gray-800 mb-2">Emergency Contact:</h4>
                </div>
                
                <div className="pt-4">
                  <h4 className="text-lg font-bold text-gray-800 mb-2">Chronic Illness:</h4>
                </div>
                
                <div className="pt-4">
                  <h4 className="text-lg font-bold text-gray-800 mb-2">Allergies:</h4>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Navigation Cards */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              
              {/* Past Records */}
              <div className="bg-gray-300 rounded-2xl p-6 flex items-center justify-between cursor-pointer hover:bg-gray-200 transition-colors group">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mr-4">
                    <FileText className="w-6 h-6 text-gray-600" />
                  </div>
                  <span className="text-xl font-bold text-gray-800">Past Records</span>
                </div>
                <ChevronRight className="w-6 h-6 text-gray-600 group-hover:translate-x-1 transition-transform" />
              </div>

              {/* Recent Uploads */}
              <div className="bg-gray-300 rounded-2xl p-6 flex items-center justify-between cursor-pointer hover:bg-gray-200 transition-colors group">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mr-4">
                    <Upload className="w-6 h-6 text-gray-600" />
                  </div>
                  <span className="text-xl font-bold text-gray-800">Recent Uploads</span>
                </div>
                <ChevronRight className="w-6 h-6 text-gray-600 group-hover:translate-x-1 transition-transform" />
              </div>

              {/* Active Permissions */}
              <div className="bg-gray-300 rounded-2xl p-6 flex items-center justify-between cursor-pointer hover:bg-gray-200 transition-colors group">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mr-4">
                    <Users className="w-6 h-6 text-gray-600" />
                  </div>
                  <span className="text-xl font-bold text-gray-800">Active Permissions</span>
                </div>
                <ChevronRight className="w-6 h-6 text-gray-600 group-hover:translate-x-1 transition-transform" />
              </div>

              {/* Manage Access - Highlighted */}
              <div className="bg-gradient-to-r from-blue-500 to-cyan-400 rounded-2xl p-6 flex items-center justify-between cursor-pointer hover:shadow-lg transition-shadow group">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mr-4">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xl font-bold text-white">Manage Access</span>
                </div>
                <ChevronRight className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform" />
              </div>

              {/* ICE Profile */}
              <div className="bg-gray-300 rounded-2xl p-6 flex items-center justify-between cursor-pointer hover:bg-gray-200 transition-colors group">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mr-4">
                    <Truck className="w-6 h-6 text-gray-600" />
                  </div>
                  <span className="text-xl font-bold text-gray-800">ICE Profile</span>
                </div>
                <ChevronRight className="w-6 h-6 text-gray-600 group-hover:translate-x-1 transition-transform" />
              </div>

              {/* Upload File - Dashed Border */}
              <div className="border-2 border-dashed border-gray-400 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-gray-500 transition-colors group bg-gray-100">
                <div className="w-16 h-16 flex items-center justify-center mb-4">
                  <div className="text-6xl font-bold text-gray-600 group-hover:text-gray-700 transition-colors">+</div>
                </div>
                <span className="text-2xl font-bold text-gray-800 group-hover:text-gray-900 transition-colors">Upload File</span>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @media (max-width: 1024px) {
          .grid {
            grid-template-columns: 1fr;
          }
          
          .lg\\:col-span-1 {
            grid-column: span 1;
          }
        }
        
        @media (max-width: 640px) {
          .text-5xl {
            font-size: 2.5rem;
          }
          
          .space-y-4 > * + * {
            margin-top: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default PatientDashboard;