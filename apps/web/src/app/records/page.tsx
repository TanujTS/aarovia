"use client";
import React, { useState } from 'react';
import { Globe, FileText, Calendar, MapPin, Search } from 'lucide-react';

interface MedicalRecord {
  id: number;
  hospitalName: string;
  reportType: string;
  date: string;
  isHighlighted: boolean;
}

const PastRecordsSimplePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const medicalRecords: MedicalRecord[] = [
    {
      id: 1,
      hospitalName: "Johns Hopkins Hospital",
      reportType: "Complete Blood Count (CBC)",
      date: "March 15, 2024",
      isHighlighted: false
    },
    {
      id: 2,
      hospitalName: "Mayo Clinic",
      reportType: "Chest X-Ray - Respiratory Assessment",
      date: "February 28, 2024",
      isHighlighted: false
    },
    {
      id: 3,
      hospitalName: "Cleveland Clinic",
      reportType: "Echocardiogram - Cardiac Evaluation",
      date: "February 10, 2024",
      isHighlighted: false
    },
    {
      id: 4,
      hospitalName: "Stanford Medical Center",
      reportType: "MRI Brain Scan - Neurological Examination",
      date: "January 22, 2024",
      isHighlighted: false
    },
    {
      id: 5,
      hospitalName: "Massachusetts General Hospital",
      reportType: "Lipid Panel - Cholesterol Screening",
      date: "January 8, 2024",
      isHighlighted: true
    },
    {
      id: 6,
      hospitalName: "Cedars-Sinai Medical Center",
      reportType: "Mammography - Breast Cancer Screening",
      date: "December 20, 2023",
      isHighlighted: false
    }
  ];

  const filteredRecords = medicalRecords.filter(record =>
    record.hospitalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.reportType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.date.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h2 className="text-5xl font-bold text-blue-600 mb-6">Past Records</h2>
          
          {/* Search Section */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by hospital, report type, or date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              />
            </div>
          </div>
        </div>

        {/* Records Container */}
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <div className="space-y-6">
            {filteredRecords.map((record) => (
              <div
                key={record.id}
                className={`
                  relative p-6 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-lg transform hover:scale-[1.01] min-h-[80px] flex items-center
                  ${record.isHighlighted 
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-xl' 
                    : 'bg-gray-300 text-gray-800 hover:bg-gray-200'
                  }
                `}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 w-full">
                  {/* Main Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${
                        record.isHighlighted ? 'bg-white bg-opacity-20' : 'bg-blue-100'
                      }`}>
                        <FileText className={`w-6 h-6 ${
                          record.isHighlighted ? 'text-white' : 'text-blue-600'
                        }`} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className={`w-5 h-5 ${
                            record.isHighlighted ? 'text-white' : 'text-gray-600'
                          }`} />
                          <h3 className={`text-xl font-bold ${
                            record.isHighlighted ? 'text-white' : 'text-gray-800'
                          }`}>
                            {record.hospitalName}
                          </h3>
                        </div>
                        
                        <p className={`text-lg mb-2 ${
                          record.isHighlighted ? 'text-white' : 'text-gray-700'
                        }`}>
                          {record.reportType}
                        </p>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className={`w-4 h-4 ${
                            record.isHighlighted ? 'text-white' : 'text-gray-500'
                          }`} />
                          <span className={`text-sm font-medium ${
                            record.isHighlighted ? 'text-white' : 'text-gray-500'
                          }`}>
                            {record.date}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button className={`
                      px-6 py-3 rounded-lg font-medium transition-colors text-base
                      ${record.isHighlighted 
                        ? 'bg-white text-blue-600 hover:bg-gray-100' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                      }
                    `}>
                      View Report
                    </button>
                  </div>
                </div>

                {/* Decorative Element */}
                <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${
                  record.isHighlighted ? 'bg-white' : 'bg-blue-600'
                }`} />
              </div>
            ))}
          </div>

          {/* No Results Message */}
          {filteredRecords.length === 0 && (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Records Found</h3>
              <p className="text-gray-500">Try adjusting your search terms</p>
            </div>
          )}
        </div>
        </div>

      {/* Responsive Styles */}
      <style jsx>{`
        @media (max-width: 768px) {
          .text-5xl {
            font-size: 2.5rem;
          }
          
          .flex-col.md\\:flex-row {
            flex-direction: column;
          }
          
          .gap-3 {
            gap: 0.5rem;
          }
          
          .px-6 {
            padding-left: 1rem;
            padding-right: 1rem;
          }
        }
        
        @media (max-width: 480px) {
          .space-y-6 > * + * {
            margin-top: 1rem;
          }
          
          .grid-cols-1.md\\:grid-cols-3 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default PastRecordsSimplePage;