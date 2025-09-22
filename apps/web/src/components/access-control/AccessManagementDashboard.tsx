/**
 * Access Management Dashboard
 * 
 * Main component for managing patient-provider access permissions.
 * Allows patients to grant/revoke access and view current permissions.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Users, FileText, Clock, AlertTriangle, Loader2 } from 'lucide-react';

// TODO: Fix import paths for monorepo structure
// import { AccessControlHandler } from '@aarovia/web3/src/modules/access-control-management/AccessControlHandler';
// import {
//   AccessControlConfig,
//   ProviderAccessInfo,
//   AccessControlFormData,
//   AccessControlError
// } from '@aarovia/web3/src/types/access-control-types';

// Temporary type definitions to make component compile
interface AccessControlHandler {
  getProvidersWithAccess(patientId: string): Promise<{ providers: string[] }>;
  grantGeneralAccessToProvider(request: any): Promise<{ success: boolean; error?: string }>;
  revokeGeneralAccessToProvider(request: any): Promise<{ success: boolean; error?: string }>;
}

interface AccessControlConfig {
  contractAddress: string;
  providerUrl: string;
  chainId: number;
}

interface ProviderAccessInfo {
  providerAddress: string;
  expiryTimestamp: number;
  grantedAt: number;
  isActive: boolean;
  accessType: 'general' | 'record-specific';
  recordIds?: string[];
}

interface AccessControlFormData {
  providerAddress: string;
  durationInSeconds: number;
  recordIds?: string[];
  accessType: 'general' | 'record-specific';
  reason?: string;
}

// =============================================
// INTERFACES
// =============================================

interface AccessManagementDashboardProps {
  patientId: string;
  contractAddress: string;
  providerUrl: string;
  chainId: number;
  userAddress?: string;
}

interface AccessControlState {
  isLoading: boolean;
  error: string | null;
  providers: ProviderAccessInfo[];
  selectedProvider: string | null;
}

// =============================================
// MAIN COMPONENT
// =============================================

export const AccessManagementDashboard: React.FC<AccessManagementDashboardProps> = ({
  patientId,
  contractAddress,
  providerUrl,
  chainId,
  userAddress
}) => {
  // State management
  const [state, setState] = useState<AccessControlState>({
    isLoading: false,
    error: null,
    providers: [],
    selectedProvider: null
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

  // Load providers with access
  const loadProvidersWithAccess = async () => {
    if (!accessHandler) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await accessHandler.getProvidersWithAccess(patientId);
      
      // Convert addresses to provider info (simplified for now)
      const providerInfos: ProviderAccessInfo[] = result.providers.map(address => ({
        providerAddress: address,
        expiryTimestamp: 0, // Would need to fetch individual access details
        grantedAt: 0,
        isActive: true,
        accessType: 'general' as const
      }));

      setState(prev => ({
        ...prev,
        providers: providerInfos,
        isLoading: false
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to load providers',
        isLoading: false
      }));
    }
  };

  // Load data on component mount
  useEffect(() => {
    if (accessHandler && patientId) {
      loadProvidersWithAccess();
    }
  }, [accessHandler, patientId]);

  // Grant general access to provider
  const handleGrantGeneralAccess = async (formData: AccessControlFormData) => {
    if (!accessHandler) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await accessHandler.grantGeneralAccessToProvider({
        patientId,
        providerAddress: formData.providerAddress,
        durationInSeconds: formData.durationInSeconds,
        reason: formData.reason
      });

      if (result.success) {
        // Reload providers list
        await loadProvidersWithAccess();
      } else {
        setState(prev => ({
          ...prev,
          error: result.error || 'Failed to grant access',
          isLoading: false
        }));
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to grant access',
        isLoading: false
      }));
    }
  };

  // Revoke access from provider
  const handleRevokeAccess = async (providerAddress: string) => {
    if (!accessHandler) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await accessHandler.revokeGeneralAccessToProvider({
        patientId,
        providerAddress
      });

      if (result.success) {
        // Reload providers list
        await loadProvidersWithAccess();
      } else {
        setState(prev => ({
          ...prev,
          error: result.error || 'Failed to revoke access',
          isLoading: false
        }));
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to revoke access',
        isLoading: false
      }));
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Access Management</h1>
          <p className="text-gray-600 mt-1">
            Manage who can access your medical records
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">
            {state.providers.length} Active Permissions
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
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('grant')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'grant'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Grant Access
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'manage'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Manage Access
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab 
          providers={state.providers}
          isLoading={state.isLoading}
          onRevokeAccess={handleRevokeAccess}
        />
      )}

      {activeTab === 'grant' && (
        <GrantAccessTab 
          onSubmit={handleGrantGeneralAccess}
          isLoading={state.isLoading}
        />
      )}

      {activeTab === 'manage' && (
        <ManageAccessTab 
          providers={state.providers}
          onRevokeAccess={handleRevokeAccess}
          isLoading={state.isLoading}
        />
      )}
    </div>
  );
};

// =============================================
// OVERVIEW TAB COMPONENT
// =============================================

interface OverviewTabProps {
  providers: ProviderAccessInfo[];
  isLoading: boolean;
  onRevokeAccess: (providerAddress: string) => Promise<void>;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ providers, isLoading, onRevokeAccess }) => {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Active Providers</h3>
            <Users className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{providers.length}</div>
          <p className="text-xs text-gray-500 mt-1">
            Providers with access
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Record Access</h3>
            <FileText className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {providers.filter(p => p.accessType === 'record-specific').length}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Record-specific permissions
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">General Access</h3>
            <Shield className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {providers.filter(p => p.accessType === 'general').length}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Full access permissions
          </p>
        </div>
      </div>

      {/* Current Access Permissions */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Current Access Permissions</h3>
          <p className="text-sm text-gray-500 mt-1">
            Providers who currently have access to your records
          </p>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading permissions...</span>
            </div>
          ) : providers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No active access permissions</p>
              <p className="text-sm">Grant access to providers to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {providers.map((provider, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {provider.providerAddress.slice(0, 6)}...{provider.providerAddress.slice(-4)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {provider.accessType === 'general' ? 'Full Access' : 'Record-Specific'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      provider.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {provider.isActive ? 'Active' : 'Expired'}
                    </span>
                    <button
                      className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => onRevokeAccess(provider.providerAddress)}
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Revoke'}
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
// GRANT ACCESS TAB COMPONENT
// =============================================

interface GrantAccessTabProps {
  onSubmit: (formData: AccessControlFormData) => Promise<void>;
  isLoading: boolean;
}

const GrantAccessTab: React.FC<GrantAccessTabProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<AccessControlFormData>({
    providerAddress: '',
    durationInSeconds: 86400 * 30, // 30 days default
    accessType: 'general',
    reason: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    // Reset form on success
    setFormData({
      providerAddress: '',
      durationInSeconds: 86400 * 30,
      accessType: 'general',
      reason: ''
    });
  };

  const durationOptions = [
    { label: '1 Hour', value: 3600 },
    { label: '1 Day', value: 86400 },
    { label: '1 Week', value: 86400 * 7 },
    { label: '1 Month', value: 86400 * 30 },
    { label: '3 Months', value: 86400 * 90 },
    { label: '1 Year', value: 86400 * 365 },
    { label: 'Permanent', value: 0 }
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Grant Provider Access</h3>
        <p className="text-sm text-gray-500 mt-1">
          Give a healthcare provider access to your medical records
        </p>
      </div>
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="providerAddress" className="block text-sm font-medium text-gray-700 mb-2">
              Provider Address *
            </label>
            <input
              id="providerAddress"
              type="text"
              placeholder="0x..."
              value={formData.providerAddress}
              onChange={(e) => setFormData(prev => ({ ...prev, providerAddress: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Enter the blockchain address of the healthcare provider
            </p>
          </div>

          <div>
            <label htmlFor="accessType" className="block text-sm font-medium text-gray-700 mb-2">
              Access Type *
            </label>
            <select
              id="accessType"
              value={formData.accessType}
              onChange={(e) => setFormData(prev => ({ ...prev, accessType: e.target.value as 'general' | 'record-specific' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="general">General Access (All Records)</option>
              <option value="record-specific">Record-Specific Access</option>
            </select>
          </div>

          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
              Access Duration *
            </label>
            <select
              id="duration"
              value={formData.durationInSeconds.toString()}
              onChange={(e) => setFormData(prev => ({ ...prev, durationInSeconds: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {durationOptions.map(option => (
                <option key={option.value} value={option.value.toString()}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
              Reason (Optional)
            </label>
            <input
              id="reason"
              type="text"
              placeholder="e.g., Regular checkup, consultation..."
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || !formData.providerAddress}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Granting Access...
              </div>
            ) : (
              'Grant Access'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

// =============================================
// MANAGE ACCESS TAB COMPONENT
// =============================================

interface ManageAccessTabProps {
  providers: ProviderAccessInfo[];
  onRevokeAccess: (providerAddress: string) => Promise<void>;
  isLoading: boolean;
}

const ManageAccessTab: React.FC<ManageAccessTabProps> = ({
  providers,
  onRevokeAccess,
  isLoading
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Manage Access Permissions</h3>
        <p className="text-sm text-gray-500 mt-1">
          View and manage all current access permissions
        </p>
      </div>
      <div className="p-6">
        {providers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No access permissions found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {providers.map((provider, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {provider.providerAddress}
                    </p>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>{provider.accessType === 'general' ? 'Full Access' : 'Record-Specific'}</span>
                      {provider.expiryTimestamp > 0 && (
                        <>
                          <span>•</span>
                          <Clock className="h-3 w-3" />
                          <span>
                            Expires: {new Date(provider.expiryTimestamp * 1000).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    provider.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {provider.isActive ? 'Active' : 'Expired'}
                  </span>
                  <button
                    className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => onRevokeAccess(provider.providerAddress)}
                    disabled={isLoading || !provider.isActive}
                  >
                    {isLoading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AccessManagementDashboard;