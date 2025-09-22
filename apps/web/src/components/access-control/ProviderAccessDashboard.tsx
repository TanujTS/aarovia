/**
 * Provider Access Dashboard
 * 
 * Component for healthcare providers to view and manage
 * the patients who have granted them access to medical records.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Loader2, 
  Users, 
  Search, 
  Shield, 
  Clock,
  AlertTriangle,
  Eye,
  CheckCircle2
} from 'lucide-react';

// TODO: Fix import paths for monorepo structure
// import { AccessControlHandler } from '@aarovia/web3/src/modules/access-control-management/AccessControlHandler';
// import {
//   AccessControlConfig,
//   PatientAccessInfo,
//   AccessCheckResult
// } from '@aarovia/web3/src/types/access-control-types';

// Temporary type definitions to make component compile
interface AccessControlHandler {
  getPatientsGrantedAccessTo(providerAddress: string): Promise<{ patients: string[] }>;
  checkAccess(recordId: string, providerAddress: string): Promise<AccessCheckResult>;
}

interface AccessControlConfig {
  contractAddress: string;
  providerUrl: string;
  chainId: number;
}

interface PatientAccessInfo {
  patientId: string;
  expiryTimestamp: number;
  grantedAt: number;
  isActive: boolean;
  accessType: 'general' | 'record-specific';
  recordIds?: string[];
}

interface AccessCheckResult {
  hasAccess: boolean;
  reason?: string;
  expiryTimestamp?: number;
}

// =============================================
// INTERFACES
// =============================================

interface ProviderAccessDashboardProps {
  providerAddress: string;
  contractAddress: string;
  providerUrl: string;
  chainId: number;
}

interface ProviderDashboardState {
  isLoading: boolean;
  error: string | null;
  patients: PatientAccessInfo[];
  filteredPatients: PatientAccessInfo[];
  searchQuery: string;
  selectedPatient: string | null;
}

// =============================================
// MAIN COMPONENT
// =============================================

export const ProviderAccessDashboard: React.FC<ProviderAccessDashboardProps> = ({
  providerAddress,
  contractAddress,
  providerUrl,
  chainId
}) => {
  // State management
  const [state, setState] = useState<ProviderDashboardState>({
    isLoading: false,
    error: null,
    patients: [],
    filteredPatients: [],
    searchQuery: '',
    selectedPatient: null
  });

  const [accessHandler, setAccessHandler] = useState<AccessControlHandler | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Initialize access control handler
  useEffect(() => {
    const config: AccessControlConfig = {
      contractAddress,
      providerUrl,
      chainId
    };

    try {
      // TODO: Implement proper AccessControlHandler initialization
      // const handler = new AccessControlHandler(config);
      // setAccessHandler(handler);
      console.log('Access control handler would be initialized with:', config);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to initialize access control handler'
      }));
    }
  }, [contractAddress, providerUrl, chainId]);

  // Load patients who granted access
  const loadPatientsGrantedAccess = async () => {
    if (!accessHandler) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await accessHandler.getPatientsGrantedAccessTo(providerAddress);
      
      // Convert patient IDs to patient info (simplified for now)
      const patientInfos: PatientAccessInfo[] = result.patients.map(patientId => ({
        patientId,
        expiryTimestamp: 0, // Would need to fetch individual access details
        grantedAt: 0,
        isActive: true,
        accessType: 'general' as const
      }));

      setState(prev => ({
        ...prev,
        patients: patientInfos,
        filteredPatients: patientInfos,
        isLoading: false
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to load patients',
        isLoading: false
      }));
    }
  };

  // Filter patients based on search query
  useEffect(() => {
    const filtered = state.patients.filter(patient =>
      patient.patientId.toLowerCase().includes(state.searchQuery.toLowerCase())
    );
    setState(prev => ({ ...prev, filteredPatients: filtered }));
  }, [state.searchQuery, state.patients]);

  // Load data on component mount
  useEffect(() => {
    if (accessHandler && providerAddress) {
      loadPatientsGrantedAccess();
    }
  }, [accessHandler, providerAddress]);

  // Check access to specific record
  const checkRecordAccess = async (recordId: string): Promise<AccessCheckResult> => {
    if (!accessHandler) {
      return { hasAccess: false, reason: 'Access handler not initialized' };
    }

    try {
      return await accessHandler.checkAccess(recordId, providerAddress);
    } catch (error: any) {
      return { hasAccess: false, reason: error.message };
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({ ...prev, searchQuery: e.target.value }));
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Provider Access Dashboard</h1>
          <p className="text-gray-600 mt-1">
            View patients who have granted you access to their medical records
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-green-600" />
          <span className="text-sm font-medium text-gray-700">
            {state.patients.length} Patient Permissions
          </span>
        </div>
      </div>

      {/* Error Alert */}
      {state.error && (
        <div className="bg-red-50 border border-red-300 rounded-md p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
            <p className="text-red-800">{state.error}</p>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('patients')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'patients'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Patient Access
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'records'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Record Access
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab 
          patients={state.patients}
          isLoading={state.isLoading}
        />
      )}

      {activeTab === 'patients' && (
        <PatientsTab 
          patients={state.filteredPatients}
          searchQuery={state.searchQuery}
          onSearchChange={handleSearchChange}
          isLoading={state.isLoading}
        />
      )}

      {activeTab === 'records' && (
        <RecordAccessTab 
          providerAddress={providerAddress}
          onCheckAccess={checkRecordAccess}
        />
      )}
    </div>
  );
};

// =============================================
// OVERVIEW TAB COMPONENT
// =============================================

interface OverviewTabProps {
  patients: PatientAccessInfo[];
  isLoading: boolean;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ patients, isLoading }) => {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Total Patients</h3>
            <Users className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{patients.length}</div>
          <p className="text-xs text-gray-500 mt-1">
            Patients with granted access
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Active Access</h3>
            <CheckCircle2 className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {patients.filter(p => p.isActive).length}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Currently active permissions
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">General Access</h3>
            <Shield className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {patients.filter(p => p.accessType === 'general').length}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Full access permissions
          </p>
        </div>
      </div>

      {/* Recent Patient Access */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Patient Access</h3>
          <p className="text-sm text-gray-500 mt-1">
            Patients who have recently granted you access
          </p>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-green-600" />
              <span className="ml-2 text-gray-600">Loading patient access...</span>
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No patient access permissions</p>
              <p className="text-sm">Patients will appear here when they grant you access</p>
            </div>
          ) : (
            <div className="space-y-4">
              {patients.slice(0, 5).map((patient, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Patient: {patient.patientId.slice(0, 8)}...{patient.patientId.slice(-6)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {patient.accessType === 'general' ? 'Full Access' : 'Limited Access'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      patient.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {patient.isActive ? 'Active' : 'Expired'}
                    </span>
                    <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// =============================================
// PATIENTS TAB COMPONENT
// =============================================

interface PatientsTabProps {
  patients: PatientAccessInfo[];
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading: boolean;
}

const PatientsTab: React.FC<PatientsTabProps> = ({
  patients,
  searchQuery,
  onSearchChange,
  isLoading
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Patient Access Management</h3>
        <p className="text-sm text-gray-500 mt-1">
          All patients who have granted you access to their medical records
        </p>
      </div>
      <div className="p-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search patients by ID..."
              value={searchQuery}
              onChange={onSearchChange}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        {/* Patient List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-green-600" />
            <span className="ml-2 text-gray-600">Loading patients...</span>
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>
              {searchQuery ? 'No patients found matching your search' : 'No patient access found'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {patients.map((patient, index) => (
              <PatientAccessCard
                key={index}
                patient={patient}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================
// PATIENT ACCESS CARD COMPONENT
// =============================================

interface PatientAccessCardProps {
  patient: PatientAccessInfo;
}

const PatientAccessCard: React.FC<PatientAccessCardProps> = ({ patient }) => {
  return (
    <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">
              Patient: {patient.patientId}
            </p>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>{patient.accessType === 'general' ? 'Full Access' : 'Limited Access'}</span>
              {patient.expiryTimestamp > 0 && (
                <>
                  <span>•</span>
                  <Clock className="h-3 w-3" />
                  <span>
                    Expires: {new Date(patient.expiryTimestamp * 1000).toLocaleDateString()}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            patient.isActive 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {patient.isActive ? 'Active' : 'Expired'}
          </span>
          <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50">
            <Eye className="mr-1 h-3 w-3 inline" />
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

// =============================================
// RECORD ACCESS TAB COMPONENT
// =============================================

interface RecordAccessTabProps {
  providerAddress: string;
  onCheckAccess: (recordId: string) => Promise<AccessCheckResult>;
}

const RecordAccessTab: React.FC<RecordAccessTabProps> = ({
  providerAddress,
  onCheckAccess
}) => {
  const [recordId, setRecordId] = useState('');
  const [accessResult, setAccessResult] = useState<AccessCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const handleCheckAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordId.trim()) return;

    setIsChecking(true);
    try {
      const result = await onCheckAccess(recordId);
      setAccessResult(result);
    } catch (error) {
      setAccessResult({
        hasAccess: false,
        reason: 'Failed to check access'
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Record Access Checker</h3>
        <p className="text-sm text-gray-500 mt-1">
          Check if you have access to a specific medical record
        </p>
      </div>
      <div className="p-6 space-y-6">
        <form onSubmit={handleCheckAccess} className="space-y-4">
          <div>
            <label htmlFor="recordId" className="block text-sm font-medium text-gray-700 mb-2">
              Record ID
            </label>
            <input
              id="recordId"
              type="text"
              placeholder="Enter record ID to check access..."
              value={recordId}
              onChange={(e) => setRecordId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>
          <button 
            type="submit" 
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isChecking || !recordId.trim()}
          >
            {isChecking ? (
              <div className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking Access...
              </div>
            ) : (
              <div className="flex items-center">
                <Shield className="mr-2 h-4 w-4" />
                Check Access
              </div>
            )}
          </button>
        </form>

        {/* Access Result */}
        {accessResult && (
          <div className={`border rounded-md p-4 ${
            accessResult.hasAccess 
              ? 'bg-green-50 border-green-300' 
              : 'bg-red-50 border-red-300'
          }`}>
            <div className="flex items-center">
              {accessResult.hasAccess ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
              )}
              <div>
                <p className={`font-medium ${
                  accessResult.hasAccess ? 'text-green-800' : 'text-red-800'
                }`}>
                  {accessResult.hasAccess ? 'Access Granted' : 'Access Denied'}
                </p>
                {accessResult.reason && (
                  <p className={`text-sm mt-1 ${
                    accessResult.hasAccess ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {accessResult.reason}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderAccessDashboard;