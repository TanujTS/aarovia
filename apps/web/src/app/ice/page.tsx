'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Heart, 
  Shield, 
  ArrowLeft,
  Plus,
  X,
  Save,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface ICEProfile {
  enabled: boolean;
  bloodType: string;
  allergies: string[];
  chronicConditions: string[];
  medications: string[];
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
}

export default function ICEPage() {
  const [profile, setProfile] = useState<ICEProfile>({
    enabled: false,
    bloodType: '',
    allergies: [],
    chronicConditions: [],
    medications: [],
    emergencyContact: {
      name: '',
      phone: '',
      relation: ''
    }
  });
  
  const [newAllergy, setNewAllergy] = useState('');
  const [newCondition, setNewCondition] = useState('');
  const [newMedication, setNewMedication] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  useEffect(() => {
    // Load existing ICE profile (mock data)
    const mockProfile: ICEProfile = {
      enabled: true,
      bloodType: 'O+',
      allergies: ['Penicillin', 'Shellfish'],
      chronicConditions: ['Hypertension'],
      medications: ['Lisinopril 10mg daily'],
      emergencyContact: {
        name: 'Jane Doe',
        phone: '+1-555-0123',
        relation: 'Spouse'
      }
    };
    setProfile(mockProfile);
  }, []);

  const addItem = (type: 'allergies' | 'chronicConditions' | 'medications', value: string) => {
    if (!value.trim()) return;
    
    setProfile(prev => ({
      ...prev,
      [type]: [...prev[type], value.trim()]
    }));
    
    // Clear input
    if (type === 'allergies') setNewAllergy('');
    if (type === 'chronicConditions') setNewCondition('');
    if (type === 'medications') setNewMedication('');
  };

  const removeItem = (type: 'allergies' | 'chronicConditions' | 'medications', index: number) => {
    setProfile(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // In a real implementation, this would:
      // 1. Store ICE profile on IPFS (plaintext for emergency access)
      // 2. Update smart contract with ICE profile CID
      // 3. Save metadata to database
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSuccess('ICE profile updated successfully and stored on IPFS!');
    } catch (err) {
      setError('Failed to save ICE profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Link>
            </div>
            
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">MedVault</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Heart className="h-6 w-6 mr-2 text-red-500" />
                ICE Profile (In Case of Emergency)
              </CardTitle>
              <CardDescription>
                This information is stored in plaintext on IPFS for emergency access.
                Medical professionals can access this during emergencies.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${profile.enabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span className="font-medium">
                    ICE Profile is {profile.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                
                <Button
                  variant={profile.enabled ? "outline" : "default"}
                  onClick={() => setProfile(prev => ({ ...prev, enabled: !prev.enabled }))}
                >
                  {profile.enabled ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Disable
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Enable
                    </>
                  )}
                </Button>
              </div>
              
              {profile.enabled && (
                <Alert className="mt-4 border-amber-200 bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    When enabled, this information is publicly accessible for emergency situations.
                    Only include essential medical information.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Medical Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Blood Type</label>
                  <select
                    value={profile.bloodType}
                    onChange={(e) => setProfile(prev => ({ ...prev, bloodType: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    disabled={!profile.enabled}
                  >
                    <option value="">Select blood type</option>
                    {bloodTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Allergies */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Allergies</CardTitle>
              <CardDescription>
                List any known allergies to medications, foods, or other substances
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="e.g., Penicillin, Peanuts, Latex"
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  disabled={!profile.enabled}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addItem('allergies', newAllergy);
                    }
                  }}
                />
                <Button
                  onClick={() => addItem('allergies', newAllergy)}
                  disabled={!profile.enabled || !newAllergy.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {profile.allergies.map((allergy, index) => (
                  <div
                    key={index}
                    className="flex items-center bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm"
                  >
                    <span>{allergy}</span>
                    <button
                      onClick={() => removeItem('allergies', index)}
                      disabled={!profile.enabled}
                      className="ml-2 text-red-600 hover:text-red-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chronic Conditions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Chronic Conditions</CardTitle>
              <CardDescription>
                List ongoing medical conditions that emergency responders should know about
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="e.g., Diabetes, Hypertension, Asthma"
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value)}
                  disabled={!profile.enabled}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addItem('chronicConditions', newCondition);
                    }
                  }}
                />
                <Button
                  onClick={() => addItem('chronicConditions', newCondition)}
                  disabled={!profile.enabled || !newCondition.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {profile.chronicConditions.map((condition, index) => (
                  <div
                    key={index}
                    className="flex items-center bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm"
                  >
                    <span>{condition}</span>
                    <button
                      onClick={() => removeItem('chronicConditions', index)}
                      disabled={!profile.enabled}
                      className="ml-2 text-orange-600 hover:text-orange-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Current Medications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Medications</CardTitle>
              <CardDescription>
                List medications you are currently taking with dosages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="e.g., Lisinopril 10mg daily, Metformin 500mg twice daily"
                  value={newMedication}
                  onChange={(e) => setNewMedication(e.target.value)}
                  disabled={!profile.enabled}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addItem('medications', newMedication);
                    }
                  }}
                />
                <Button
                  onClick={() => addItem('medications', newMedication)}
                  disabled={!profile.enabled || !newMedication.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {profile.medications.map((medication, index) => (
                  <div
                    key={index}
                    className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    <span>{medication}</span>
                    <button
                      onClick={() => removeItem('medications', index)}
                      disabled={!profile.enabled}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Emergency Contact</CardTitle>
              <CardDescription>
                Primary contact person for medical emergencies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Name</label>
                  <Input
                    placeholder="Full Name"
                    value={profile.emergencyContact.name}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      emergencyContact: { ...prev.emergencyContact, name: e.target.value }
                    }))}
                    disabled={!profile.enabled}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Phone Number</label>
                  <Input
                    placeholder="+1-555-0123"
                    value={profile.emergencyContact.phone}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      emergencyContact: { ...prev.emergencyContact, phone: e.target.value }
                    }))}
                    disabled={!profile.enabled}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Relationship</label>
                  <Input
                    placeholder="e.g., Spouse, Parent, Friend"
                    value={profile.emergencyContact.relation}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      emergencyContact: { ...prev.emergencyContact, relation: e.target.value }
                    }))}
                    disabled={!profile.enabled}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving || !profile.enabled}
              size="lg"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save ICE Profile
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
