"use client";
import React, { useState } from 'react';
import { Globe, FileText, Calendar, MapPin, Eye, Download, Upload, Plus } from 'lucide-react';

interface MedicalReport {
  id: number;
  date: string;
  hospitalName: string;
  reportType: string;
  fileType: string;
  thumbnail: string;
  uploadDate: string;
  fileSize: string;
}

const RecentUploadsPage: React.FC = () => {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const medicalReports: MedicalReport[] = [
    {
      id: 1,
      date: "March 28, 2024",
      hospitalName: "Johns Hopkins Hospital",
      reportType: "Chest X-Ray Report",
      fileType: "PDF",
      thumbnail: "📊",
      uploadDate: "2 hours ago",
      fileSize: "2.4 MB"
    },
    {
      id: 2,
      date: "March 25, 2024",
      hospitalName: "Mayo Clinic",
      reportType: "MRI Brain Scan",
      fileType: "PDF",
      thumbnail: "🧠",
      uploadDate: "1 day ago",
      fileSize: "8.7 MB"
    },
    {
      id: 3,
      date: "March 22, 2024",
      hospitalName: "Cleveland Clinic",
      reportType: "Blood Test Results",
      fileType: "PDF",
      thumbnail: "🩸",
      uploadDate: "4 days ago",
      fileSize: "1.2 MB"
    },
    {
      id: 4,
      date: "March 20, 2024",
      hospitalName: "Stanford Medical Center",
      reportType: "Echocardiogram Report",
      fileType: "PDF",
      thumbnail: "💓",
      uploadDate: "6 days ago",
      fileSize: "3.1 MB"
    },
    {
      id: 5,
      date: "March 18, 2024",
      hospitalName: "Mass General Hospital",
      reportType: "CT Scan Abdomen",
      fileType: "PDF",
      thumbnail: "📋",
      uploadDate: "1 week ago",
      fileSize: "5.8 MB"
    },
    {
      id: 6,
      date: "March 15, 2024",
      hospitalName: "UCLA Medical Center",
      reportType: "Mammography Report",
      fileType: "PDF",
      thumbnail: "🔍",
      uploadDate: "2 weeks ago",
      fileSize: "4.2 MB"
    },
    {
      id: 7,
      date: "March 12, 2024",
      hospitalName: "Mount Sinai Hospital",
      reportType: "Bone Density Scan",
      fileType: "PDF",
      thumbnail: "🦴",
      uploadDate: "2 weeks ago",
      fileSize: "2.9 MB"
    },
    {
      id: 8,
      date: "March 10, 2024",
      hospitalName: "Cedars-Sinai Medical",
      reportType: "Thyroid Function Test",
      fileType: "PDF",
      thumbnail: "⚕️",
      uploadDate: "3 weeks ago",
      fileSize: "1.8 MB"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-400 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
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
          <h2 className="text-5xl font-bold text-blue-600 mb-4">Recent Uploads</h2>
          <p className="text-xl text-gray-600">Your latest medical reports and documents</p>
        </div>

        {/* Reports Grid Container */}
        <div className="bg-white rounded-3xl shadow-lg p-8 min-h-[500px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {medicalReports.map((report) => (
              <div
                key={report.id}
                className="group relative"
                onMouseEnter={() => setHoveredCard(report.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* Date Title */}
                <div className="text-center mb-3">
                  <h3 className="text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-full inline-block">
                    {report.date}
                  </h3>
                </div>

                {/* Card */}
                <div className="bg-gray-300 rounded-2xl aspect-[3/4] relative cursor-pointer transition-all duration-300 transform group-hover:scale-105 group-hover:shadow-xl overflow-hidden">
                  {/* Preview Content */}
                  <div className="absolute inset-0 p-4 flex flex-col">
                    {/* Hospital Header */}
                    <div className="bg-white bg-opacity-80 rounded-lg p-3 mb-3 backdrop-blur-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <h4 className="font-bold text-gray-800 text-sm leading-tight">
                          {report.hospitalName}
                        </h4>
                      </div>
                      <p className="text-gray-700 text-xs font-medium">
                        {report.reportType}
                      </p>
                    </div>

                    {/* Document Preview Area */}
                    <div className="flex-1 bg-white bg-opacity-60 rounded-lg flex items-center justify-center backdrop-blur-sm">
                      <div className="text-center">
                        <div className="text-4xl mb-2">{report.thumbnail}</div>
                        <div className="text-xs text-gray-600 font-medium">
                          {report.fileType}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {report.fileSize}
                        </div>
                      </div>
                    </div>

                    {/* Upload Info */}
                    <div className="mt-3 bg-white bg-opacity-80 rounded-lg p-2 backdrop-blur-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">
                          Uploaded {report.uploadDate}
                        </span>
                        <Upload className="w-3 h-3 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  {/* Hover Overlay */}
                  {hoveredCard === report.id && (
                    <div className="absolute inset-0 bg-blue-600 bg-opacity-90 flex items-center justify-center rounded-2xl transition-all duration-300">
                      <div className="text-center text-white">
                        <div className="flex gap-4 mb-3">
                          <button className="bg-white bg-opacity-20 hover:bg-opacity-30 p-3 rounded-full transition-colors">
                            <Eye className="w-5 h-5" />
                          </button>
                          <button className="bg-white bg-opacity-20 hover:bg-opacity-30 p-3 rounded-full transition-colors">
                            <Download className="w-5 h-5" />
                          </button>
                        </div>
                        <p className="text-sm font-medium">View Report</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
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

        /* Smooth animations */
        .group {
          transform-origin: center center;
        }
        
        @media (max-width: 640px) {
          .grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (max-width: 480px) {
          .grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default RecentUploadsPage;