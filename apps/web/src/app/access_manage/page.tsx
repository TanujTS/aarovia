"use client";
import React, { useState } from 'react';
import { Globe, Shield, Users, Building, Calendar, Eye, Edit, Trash2 } from 'lucide-react';

interface AccessRecord {
  id: number;
  name: string;
  organization: string;
  role: string;
  accessType: string;
  expiry: string;
  isHighlighted: boolean;
}

const SimpleManageAccessPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'current' | 'add'>('current');

  const accessRecords: AccessRecord[] = [
    {
      id: 1,
      name: "Dr. Sarah Johnson",
      organization: "Johns Hopkins Hospital",
      role: "Cardiologist",
      accessType: "Full Access",
      expiry: "Dec 31, 2024",
      isHighlighted: false
    },
    {
      id: 2,
      name: "Dr. Michael Chen",
      organization: "Mayo Clinic",
      role: "Neurologist", 
      accessType: "View Only",
      expiry: "Mar 15, 2025",
      isHighlighted: false
    },
    {
      id: 3,
      name: "Lab Tech - Maria Rodriguez",
      organization: "Cleveland Clinic Lab",
      role: "Lab Technician",
      accessType: "Upload Reports",
      expiry: "Jun 30, 2024",
      isHighlighted: false
    },
    {
      id: 4,
      name: "Dr. James Wilson",
      organization: "Stanford Medical Center",
      role: "Primary Care Physician",
      accessType: "Full Access",
      expiry: "Never",
      isHighlighted: true
    },
    {
      id: 5,
      name: "Nurse Practitioner - Lisa Park",
      organization: "Mass General Hospital",
      role: "Nurse Practitioner",
      accessType: "Limited Access",
      expiry: "Aug 20, 2024",
      isHighlighted: false
    }
  ];

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
        {/* Page Title */}
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-blue-600 mb-4">Manage Access</h2>
        </div>

        {/* Main Container */}
        <div className="bg-white rounded-3xl shadow-lg p-8 min-h-[600px]">
          
          {/* Tab Buttons */}
          <div className="flex gap-4 mb-8 justify-center">
            <button
              onClick={() => setActiveTab('current')}
              className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
                activeTab === 'current'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-400 text-white shadow-lg'
                  : 'bg-gray-300 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Current Access
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
                activeTab === 'add'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-400 text-white shadow-lg'
                  : 'bg-gray-300 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Add Access
            </button>
          </div>

          {activeTab === 'current' ? (
            <div>
              {/* Table Headers */}
              <div className="grid grid-cols-5 gap-4 mb-6 px-6 py-4 font-bold text-gray-800 text-xl">
                <div className="text-left">Name / Organization</div>
                <div className="text-center">Role</div>
                <div className="text-center">Access Type</div>
                <div className="text-center">Expiry</div>
                <div className="text-center">Actions</div>
              </div>

              {/* Access Records */}
              <div className="space-y-4">
                {accessRecords.map((record) => (
                  <div
                    key={record.id}
                    className={`
                      grid grid-cols-5 gap-4 p-6 rounded-2xl transition-all duration-300 hover:shadow-lg min-h-[80px] items-center
                      ${record.isHighlighted
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-xl'
                        : 'bg-gray-300 text-gray-800 hover:bg-gray-200'
                      }
                    `}
                  >
                    {/* Name / Organization */}
                    <div className="flex flex-col justify-center">
                      <div className={`font-bold text-lg mb-1 ${record.isHighlighted ? 'text-white' : 'text-gray-800'}`}>
                        {record.name}
                      </div>
                      <div className={`text-sm flex items-center gap-2 ${record.isHighlighted ? 'text-white' : 'text-gray-600'}`}>
                        <Building className="w-3 h-3" />
                        {record.organization}
                      </div>
                    </div>

                    {/* Role */}
                    <div className="flex items-center justify-center">
                      <div className={`px-4 py-2 rounded-lg text-center ${
                        record.isHighlighted ? 'bg-white bg-opacity-20' : 'bg-white'
                      }`}>
                        <span className={`font-medium text-sm ${record.isHighlighted ? 'text-white' : 'text-gray-700'}`}>
                          {record.role}
                        </span>
                      </div>
                    </div>

                    {/* Access Type */}
                    <div className="flex items-center justify-center">
                      <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                        record.isHighlighted ? 'bg-white bg-opacity-20 text-white' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {record.accessType}
                      </span>
                    </div>

                    {/* Expiry */}
                    <div className="flex items-center justify-center">
                      <div className={`flex items-center gap-2 ${record.isHighlighted ? 'text-white' : 'text-gray-700'}`}>
                        <Calendar className="w-4 h-4" />
                        <span className="font-medium">{record.expiry}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-center gap-2">
                      <button className={`p-2 rounded-lg transition-colors ${
                        record.isHighlighted 
                          ? 'bg-white bg-opacity-20 hover:bg-opacity-30 text-white' 
                          : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                      }`}>
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className={`p-2 rounded-lg transition-colors ${
                        record.isHighlighted 
                          ? 'bg-white bg-opacity-20 hover:bg-opacity-30 text-white' 
                          : 'bg-green-100 hover:bg-green-200 text-green-600'
                      }`}>
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className={`p-2 rounded-lg transition-colors ${
                        record.isHighlighted 
                          ? 'bg-white bg-opacity-20 hover:bg-opacity-30 text-white' 
                          : 'bg-red-100 hover:bg-red-200 text-red-600'
                      }`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Add Access Tab */
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <label className="block text-lg font-bold text-gray-800 mb-3">
                  Name / Organization
                </label>
                <input
                  type="text"
                  placeholder="Enter name and organization"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
              </div>

              <div>
                <label className="block text-lg font-bold text-gray-800 mb-3">
                  Role
                </label>
                <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg">
                  <option value="">Select Role</option>
                  <option value="doctor">Doctor</option>
                  <option value="nurse">Nurse Practitioner</option>
                  <option value="lab">Lab Technician</option>
                  <option value="specialist">Specialist</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-lg font-bold text-gray-800 mb-3">
                  Access Type
                </label>
                <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg">
                  <option value="">Select Access Type</option>
                  <option value="full">Full Access</option>
                  <option value="view">View Only</option>
                  <option value="limited">Limited Access</option>
                  <option value="upload">Upload Reports</option>
                </select>
              </div>

              <div>
                <label className="block text-lg font-bold text-gray-800 mb-3">
                  Expiry Date
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
              </div>

              <div className="pt-6">
                <button className="w-full bg-gradient-to-r from-blue-600 to-cyan-400 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all duration-300 hover:scale-105">
                  Grant Access
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .overflow-y-auto::-webkit-scrollbar {
          width: 8px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #06b6d4);
          border-radius: 10px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #0891b2);
        }

        @media (max-width: 1024px) {
          .grid-cols-5 {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          
          .grid-cols-5 > div {
            text-align: left !important;
            justify-content: flex-start !important;
          }
          
          .grid-cols-5 > div:first-child {
            border-bottom: 1px solid rgba(0,0,0,0.1);
            padding-bottom: 0.5rem;
            margin-bottom: 0.5rem;
          }
        }
        
        @media (max-width: 640px) {
          .text-5xl {
            font-size: 2.5rem;
          }
          
          .px-8 {
            padding-left: 1rem;
            padding-right: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default SimpleManageAccessPage;