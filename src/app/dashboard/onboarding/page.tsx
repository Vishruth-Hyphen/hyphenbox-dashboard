'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Breadcrumbs } from '@/ui/components/Breadcrumbs';
import { Button } from '@/ui/components/Button';
import { IconWithBackground } from '@/ui/components/IconWithBackground';
import { TextField } from '@/ui/components/TextField';
import { TextArea } from '@/ui/components/TextArea';
import { Alert } from '@/ui/components/Alert';
import { Select } from '@/ui/components/Select';
import { useAuth, useOrganization } from '@/hooks/useAuth';
import { fetchCursorFlows, type CursorFlow } from '@/utils/cursorflows';
import {
  getOrCreateDefaultOnboardingChecklist,
  getOnboardingChecklistWithFlows,
  updateOnboardingChecklistFlows,
  updateOnboardingChecklistDetails,
  type OnboardingChecklist,
  type OnboardingChecklistFlowItem,
} from '@/utils/onboarding';
import { supabase } from '@/lib/supabase';
import * as SubframeCore from "@subframe/core";

interface OrgTheme {
  brand_color?: string;
  cursor_company_label?: string | null;
  logo_url?: string | null;
}

const OnboardingWidgetPreview: React.FC<{
  heading: string;
  description: string;
  logoUrl?: string | null;
  flows: OnboardingChecklistFlowItem[];
}> = ({ heading, description, logoUrl, flows }) => {
  return (
    <div className="w-full max-w-md mx-auto border border-gray-300 rounded-lg shadow-lg p-6 bg-gray-800 text-white">
      <div className="flex justify-between items-start mb-4">
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="h-10 rounded-md" />
        ) : (
          <div className="h-10 w-20 bg-gray-700 rounded-md flex items-center justify-center text-sm">Logo</div>
        )}
        <SubframeCore.Icon name="FeatherX" className="text-gray-400 cursor-pointer" />
      </div>
      <h2 className="text-2xl font-semibold mb-2">{heading || "Welcome!"}</h2>
      <p className="text-sm text-gray-300 mb-6">{description || "Let's do a tour!"}</p>
      
      <div className="space-y-3">
        {flows.map((flowItem, index) => (
          <div key={flowItem.flow_id || 'flow-' + index} className="flex items-center p-3 bg-gray-700 rounded-md">
            <SubframeCore.Icon 
              name={index < 0 ? "FeatherCheckCircle" : "FeatherCircle"}
              className={`mr-3 ${index < 0 ? "text-green-400" : "text-gray-400"}`} 
            />
            <span className="text-sm">{flowItem.cursor_flows?.[0]?.name || 'Flow name missing'}</span>
          </div>
        ))}
        {flows.length === 0 && <p className="text-sm text-gray-400">No flows added yet.</p>}
      </div>

      <Button 
        variant="brand-primary" 
        className="w-full mt-8 bg-teal-500 hover:bg-teal-600 text-white"
      >
        Start next step
      </Button>
    </div>
  );
};

function OnboardingPageContent() {
  const router = useRouter();
  const { session } = useAuth();
  const { currentOrgId, currentOrgName } = useOrganization();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [currentChecklist, setCurrentChecklist] = useState<OnboardingChecklist | null>(null);
  const [allCursorFlows, setAllCursorFlows] = useState<CursorFlow[]>([]);
  const [selectedOnboardingFlows, setSelectedOnboardingFlows] = useState<OnboardingChecklistFlowItem[]>([]);
  
  const [widgetHeading, setWidgetHeading] = useState('');
  const [widgetDescription, setWidgetDescription] = useState('');
  const [customLogoUrl, setCustomLogoUrl] = useState('');
  const [organizationTheme, setOrganizationTheme] = useState<OrgTheme | null>(null);

  const loadInitialData = useCallback(async (orgId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { checklist, error: checklistError } = await getOrCreateDefaultOnboardingChecklist(orgId);
      if (checklistError || !checklist) {
        setError('Failed to load or create default onboarding checklist: ' + (checklistError?.message || 'Unknown error'));
        return;
      }
      setCurrentChecklist(checklist);
      setWidgetHeading(checklist.title_text || 'Welcome to our App!');
      setWidgetDescription(checklist.description || 'Follow these steps to get started.');
      setCustomLogoUrl(checklist.logo_url || '');
      
      const { flows: checklistFlowsData, error: flowsError } = await getOnboardingChecklistWithFlows(checklist.id);
      if (flowsError) {
        setError('Failed to load onboarding flows: ' + (flowsError?.message || 'Unknown error'));
      } else {
        const sortedFlows = (checklistFlowsData || []).sort((a, b) => a.position - b.position);
        setSelectedOnboardingFlows(sortedFlows);
      }

      const { data: allFlowsData, error: allFlowsError } = await fetchCursorFlows(orgId);
      if (allFlowsError) {
        setError('Failed to load all cursor flows: ' + (allFlowsError?.message || 'Unknown error'));
      } else {
        setAllCursorFlows(allFlowsData || []);
      }
      
      try {
        const themeResponse = await fetch('/api/dashboard/organization-theme'); 
        if (themeResponse.ok) {
          const theme = await themeResponse.json();
          setOrganizationTheme(theme.theme);
        } else {
          console.warn('Could not fetch organization theme for logo.');
          if (currentOrgId) {
            const { data: orgThemeData, error: dbThemeError } = await supabase
              .from('organization_themes')
              .select('logo_url, brand_color, cursor_company_label')
              .eq('organization_id', currentOrgId)
              .single();
            if (!dbThemeError && orgThemeData) {
              setOrganizationTheme(orgThemeData as OrgTheme);
            }
          }
        }
      } catch (themeError) {
        console.warn('Error fetching organization theme:', themeError);
      }

    } catch (e: any) {
      setError('An unexpected error occurred: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentOrgId]);

  useEffect(() => {
    if (currentOrgId) {
      loadInitialData(currentOrgId);
    }
  }, [currentOrgId, loadInitialData]);

  const handleAddFlowToOnboarding = (flowId: string) => {
    if (!currentChecklist || !flowId) {
        setError("Cannot add flow: No active checklist loaded or flow ID missing.");
        return;
    }
    const flowToAdd = allCursorFlows.find(f => f.id === flowId);
    if (!flowToAdd) {
        setError("Selected flow not found in available flows.");
        return;
    }
    if (selectedOnboardingFlows.find(f => f.flow_id === flowToAdd.id)) {
        setSuccessMessage(`Flow "${flowToAdd.name}" is already added.`);
        setTimeout(() => setSuccessMessage(null), 3000);
        return; 
    }
    
    const newItem: OnboardingChecklistFlowItem = {
      id: 'temp-' + Date.now(), 
      checklist_id: currentChecklist.id,
      flow_id: flowToAdd.id,
      position: selectedOnboardingFlows.length + 1,
      cursor_flows: [{ id: flowToAdd.id, name: flowToAdd.name, status: flowToAdd.status as any }],
    };
    setSelectedOnboardingFlows(prev => [...prev, newItem]);
  };

  const handleRemoveFlowFromOnboarding = (flowIdToRemove: string) => {
    setSelectedOnboardingFlows(prev => prev.filter(f => f.flow_id !== flowIdToRemove)
      .map((flow, index) => ({ ...flow, position: index + 1 })));
  };

  const handleSaveChanges = async (type: 'flows' | 'appearance') => {
    if (!currentChecklist || !session?.user?.id) {
      setError('Cannot save: Missing checklist or user session.');
      return;
    }
    setIsSaving(true);
    setSuccessMessage(null);
    setError(null);

    try {
      if (type === 'flows') {
        const flowItemsToSave = selectedOnboardingFlows.map((f, index) => ({ 
            flow_id: f.flow_id, 
            position: index + 1 
        }));
        const { success, error: saveFlowsError } = await updateOnboardingChecklistFlows(currentChecklist.id, flowItemsToSave);
        if (saveFlowsError || !success) {
          throw saveFlowsError || new Error('Failed to save onboarding flows');
        }
        setSuccessMessage('Onboarding flows updated successfully!');
      } else if (type === 'appearance') {
        const appearanceDetails: Partial<OnboardingChecklist> = {
          title_text: widgetHeading,
          description: widgetDescription,
          logo_url: customLogoUrl || null,
          appearance_settings: {
            ...(currentChecklist.appearance_settings || {}),
          }
        };
        const { checklist, error: saveDetailsError } = await updateOnboardingChecklistDetails(currentChecklist.id, appearanceDetails);
        if (saveDetailsError || !checklist) {
          throw saveDetailsError || new Error('Failed to save appearance settings');
        }
        setCurrentChecklist(checklist); 
        setSuccessMessage('Appearance settings updated successfully!');
      }
      if (type === 'flows' && currentOrgId) {
          const { flows: checklistFlowsData, error: flowsError } = await getOnboardingChecklistWithFlows(currentChecklist.id);
          if (!flowsError && checklistFlowsData) {
            const sortedFlows = (checklistFlowsData || []).sort((a, b) => a.position - b.position);
            setSelectedOnboardingFlows(sortedFlows);
          }
      }
    } catch (e: any) {
      setError('Failed to save changes: ' + e.message);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const availableFlowsForSelect = allCursorFlows.filter(af => !selectedOnboardingFlows.some(sf => sf.flow_id === af.id));

  // Handle logo upload
  const handleLogoUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentOrgId) {
      setError("Organization ID is missing, cannot upload logo.");
      return;
    }
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset file input to allow re-uploading the same file name
    event.target.value = '';

    if (file.type !== "image/svg+xml") {
      setError("Invalid file type. Please upload an SVG file.");
      return;
    }

    setError(null);
    setIsSaving(true);

    const fileName = `onboarding-${currentOrgId}-${Date.now()}.svg`;
    const filePath = `${fileName}`;

    try {
      // Upload to Supabase storage
      const { error: uploadError } = await supabase
        .storage
        .from('organization-logos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/svg+xml'
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicUrlData } = supabase
        .storage
        .from('organization-logos')
        .getPublicUrl(filePath);

      if (!publicUrlData?.publicUrl) {
        throw new Error("Could not retrieve public URL for the uploaded logo.");
      }

      const newLogoUrl = publicUrlData.publicUrl;

      // Update state immediately for better UX
      setCustomLogoUrl(newLogoUrl);

    } catch (err: any) {
      console.error('Logo upload error:', err);
      setError(err.message || 'Failed to upload logo.');
    } finally {
      setIsSaving(false);
    }
  }, [currentOrgId]);

  if (isLoading && !currentChecklist) { 
    return <div className="p-12 text-center">Loading onboarding configuration...</div>;
  }

  if (error && !currentChecklist && !isLoading) { 
      return <div className="p-12 text-center text-red-600">Error: {error} <Button onClick={() => currentOrgId && loadInitialData(currentOrgId)}>Retry</Button></div>;
  }

  return (
    <div className="container max-w-none flex h-full w-full flex-col items-start gap-8 bg-default-background py-12">
      <Breadcrumbs>
        <Breadcrumbs.Item>Dashboard</Breadcrumbs.Item>
        <Breadcrumbs.Divider />
        <Breadcrumbs.Item active={true}>Onboarding</Breadcrumbs.Item>
      </Breadcrumbs>

      <h1 className="text-heading-2 font-heading-2 text-default-font">Onboarding Configuration</h1>
      
      {error && !isSaving && <Alert title="Error" variant="error" description={error} className="mb-4" actions={<Button onClick={() => setError(null)} variant="destructive-tertiary" size="small">Dismiss</Button>} />}
      {successMessage && <Alert title="Success" variant="success" description={successMessage} className="mb-4" actions={<Button onClick={() => setSuccessMessage(null)} variant="neutral-tertiary" size="small">Dismiss</Button>} />} 

      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-700 mb-1">1. Configure Onboarding Flows</h2>
          <p className="text-sm text-gray-500 mb-4">Select flows and arrange them in the order they should appear to your users.</p>
          
          <div className="mb-6">
            <Select
              className="w-full"
              label="Add a flow to the onboarding checklist"
              placeholder="Select a flow to add..."
              value=""
              onValueChange={(value) => {
                if (value && value !== "no-flows") {
                  handleAddFlowToOnboarding(value);
                }
              }}
              disabled={isLoading || isSaving}
            >
              {availableFlowsForSelect.length > 0 ? (
                availableFlowsForSelect.map(flow => (
                  <Select.Item key={flow.id} value={flow.id}>
                    {flow.name}
                  </Select.Item>
                ))
              ) : (
                <Select.Item value="no-flows" disabled>
                  {allCursorFlows.length === 0 ? "No flows created yet." : "All flows already added."}
                </Select.Item>
              )}
            </Select>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-600 mb-3">Selected Onboarding Flows (Order of appearance)</h3>
            {isLoading && selectedOnboardingFlows.length === 0 && <p className="text-sm text-gray-500">Loading selected flows...</p>}
            <div className="min-h-[100px] border rounded-md p-2 bg-gray-50 space-y-2">
              {selectedOnboardingFlows.length > 0 ? (
                selectedOnboardingFlows.map((flowItem, index) => (
                  <div 
                    key={flowItem.flow_id || 'sflow-' + index}
                    className="p-3 border rounded-md flex justify-between items-center bg-white shadow-sm"
                  >
                    <div className="flex items-center">
                      <IconWithBackground icon="FeatherMove" variant="neutral" size="small" className="mr-3 text-gray-400 cursor-not-allowed" title="Order is based on sequence of addition" />
                      <span className="text-sm font-medium text-gray-700">{index + 1}. {flowItem.cursor_flows?.[0]?.name || 'Flow name missing'}</span>
                    </div>
                    <Button 
                      variant="destructive-tertiary" 
                      size="small" 
                      onClick={() => handleRemoveFlowFromOnboarding(flowItem.flow_id)} 
                      icon="FeatherX"
                      disabled={isSaving}
                    />
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 p-2">No flows selected for onboarding. Add from the dropdown above.</p>
              )}
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={() => handleSaveChanges('flows')} disabled={isLoading || isSaving} loading={isSaving}>Save Onboarding Flows</Button>
          </div>
        </div>

        <div className="lg:col-span-1 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-700 mb-1">2. Customize Onboarding Widget</h2>
           <p className="text-sm text-gray-500 mb-4">Set the title, description, and logo for the onboarding widget.</p>
          <TextField 
            className="w-full mb-4" 
            label="Widget Heading"
          >
            <TextField.Input 
              placeholder="e.g., Welcome! Let's get you started."
              value={widgetHeading}
              onChange={(e) => setWidgetHeading(e.target.value)}
              disabled={isLoading || isSaving}
            />
          </TextField>
          <TextArea 
            className="w-full mb-4" 
            label="Widget Description"
          >
            <TextArea.Input 
              placeholder="e.g., Follow these quick guides to learn the basics."
              value={widgetDescription}
              onChange={(e) => setWidgetDescription(e.target.value)}
              rows={3}
              disabled={isLoading || isSaving}
            />
          </TextArea>
          
          <div className="flex flex-col gap-4 mb-4">
            <h4 className="text-md font-medium text-gray-600">Onboarding Logo</h4>
            
            {/* Display current logo image if URL exists */}
            {customLogoUrl && (
              <div className="flex items-center gap-2 mb-2">
                <img src={customLogoUrl} alt="Onboarding Logo" className="h-16 w-auto max-w-[200px] rounded border p-2 bg-gray-50" />
              </div>
            )}
            
            {/* Show organization default if no custom logo */}
            {!customLogoUrl && organizationTheme?.logo_url && (
              <div className="flex items-center gap-2 mb-2">
                <img src={organizationTheme.logo_url} alt="Default Organization Logo" className="h-16 w-auto max-w-[200px] rounded border p-2 bg-gray-50" />
                <span className="text-xs text-gray-500">Using organization default</span>
              </div>
            )}
            
            {/* File Input for Upload */}
            <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-blue-700 transition hover:bg-gray-100 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <SubframeCore.Icon
                className="text-body font-body"
                name="FeatherUploadCloud"
              />
              <span className="text-sm font-medium">{customLogoUrl ? 'Replace Logo' : 'Upload Custom Logo'}</span>
              <input
                type="file"
                className="hidden"
                accept="image/svg+xml"
                onChange={handleLogoUpload}
                disabled={isSaving}
              />
            </label>
            <span className="text-xs text-gray-500">SVG format required. Leave empty to use organization default logo.</span>
            
            {/* Remove custom logo button */}
            {customLogoUrl && (
              <button
                type="button"
                onClick={() => {
                  setCustomLogoUrl('');
                }}
                className="text-red-600 text-sm hover:text-red-800 self-start"
                disabled={isSaving}
              >
                Remove custom logo (use organization default)
              </button>
            )}
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={() => handleSaveChanges('appearance')} disabled={isLoading || isSaving} loading={isSaving}>Save Appearance</Button>
          </div>
        </div>
      </div>

      <div className="w-full p-6 bg-white rounded-lg shadow mt-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-1">3. Widget Preview</h2>
          <p className="text-sm text-gray-500 mb-6">This is how your onboarding widget will look to users.</p>
          <div className="flex justify-center items-center p-4 bg-gray-100 rounded-md">
            <OnboardingWidgetPreview 
              heading={widgetHeading}
              description={widgetDescription}
              logoUrl={customLogoUrl || organizationTheme?.logo_url}
              flows={selectedOnboardingFlows}
            />
          </div>
      </div>

      <div className="w-full p-6 bg-white rounded-lg shadow mt-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">4. Onboarding Analytics</h2>
        {selectedOnboardingFlows.length > 0 ? (
          <ul className="space-y-2">
            {selectedOnboardingFlows.map(flowItem => (
              <li key={flowItem.flow_id} className="text-sm text-gray-600 p-2 border-b">
                <strong>{flowItem.cursor_flows?.[0]?.name || 'Flow name missing'}:</strong> 
                <span className="ml-2">Started by: (Analytics coming soon)</span>
                <span className="ml-2">| Completed by: (Analytics coming soon)</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No flows currently in the onboarding sequence to show analytics for.</p>
        )}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center">Loading Onboarding Page...</div>}>
      <OnboardingPageContent />
    </Suspense>
  );
} 