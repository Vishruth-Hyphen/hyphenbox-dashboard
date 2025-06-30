'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Breadcrumbs } from '@/ui/components/Breadcrumbs';
import { Button } from '@/ui/components/Button';
import { IconButton } from '@/ui/components/IconButton';
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
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';



// Sortable Item Component for Drag and Drop
interface SortableFlowItemProps {
  flowItem: OnboardingChecklistFlowItem;
  index: number;
  onRemove: (flowId: string) => void;
  isSaving: boolean;
}

function SortableFlowItem({ flowItem, index, onRemove, isSaving }: SortableFlowItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: flowItem.flow_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div className="flex items-center gap-2">
      <div 
        ref={setNodeRef}
        style={style}
        className={`flex-1 p-3 border rounded-md flex items-center bg-white shadow-sm cursor-grab active:cursor-grabbing ${isDragging ? 'z-50' : ''}`}
        {...attributes}
        {...listeners}
      >
        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-medium mr-4">
          {index + 1}
        </div>
        <span className="text-sm font-medium text-gray-700">
          {flowItem.cursor_flows?.[0]?.name || 'Flow name missing'}
        </span>
      </div>
      <IconButton
        icon="FeatherTrash2"
        variant="destructive-secondary"
        onClick={() => onRemove(flowItem.flow_id)}
        disabled={isSaving}
        aria-label="Delete flow"
        className="flex-shrink-0"
      />
    </div>
  );
}

const OnboardingWidgetPreview: React.FC<{
  heading: string;
  description: string;
  flows: OnboardingChecklistFlowItem[];
}> = ({ heading, description, flows }) => {
  return (
    <div 
      className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-lg overflow-hidden"
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        boxShadow: '0 5px 20px rgba(0, 0, 0, 0.15)'
      }}
    >
      {/* Header */}
      <div 
        className="flex justify-between items-center px-6 py-4 border-b"
        style={{ borderColor: '#e0e0e0' }}
      >
        <h2 
          className="text-xl font-semibold flex-grow text-center"
          style={{ color: '#1a1a1a' }}
        >
          {heading || "Welcome!"}
        </h2>
        <SubframeCore.Icon name="FeatherX" className="text-gray-400 cursor-pointer" style={{ fontSize: '24px' }} />
      </div>

      {/* Content */}
      <div className="px-6 py-4">
        {/* Description */}
        {description && (
          <p 
            className="text-sm mb-4 leading-relaxed"
            style={{ color: '#666' }}
          >
            {description}
          </p>
        )}
        
        {/* Flows */}
        <div 
          className="border rounded-lg overflow-hidden"
          style={{ borderColor: '#e0e0e0' }}
        >
          {flows.length > 0 ? (
            flows.map((flowItem, index) => (
              <div 
                key={flowItem.flow_id || 'flow-' + index} 
                className={`flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${index < flows.length - 1 ? 'border-b' : ''}`}
                style={{ 
                  borderColor: index < flows.length - 1 ? '#f0f0f0' : 'transparent'
                }}
              >
                {/* Numbered circle */}
                <div 
                  className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mr-4 flex-shrink-0 text-sm font-medium"
                >
                  {index + 1}
                </div>
                <span 
                  className="text-sm font-medium"
                  style={{ color: '#333' }}
                >
                  {flowItem.cursor_flows?.[0]?.name || 'Flow name missing'}
                </span>
              </div>
            ))
          ) : (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-gray-500 italic">No steps in this checklist yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div 
        className="px-6 py-4 border-t flex justify-end"
        style={{ borderColor: '#f0f0f0' }}
      >
        <div className="flex items-center gap-1 text-xs" style={{ color: '#666' }}>
          <span style={{ opacity: 0.7 }}>powered by</span>
          <div className="h-4 w-12 bg-gray-300 rounded opacity-70"></div>
        </div>
      </div>
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

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  // Add flow to onboarding (maintain position ordering)
  const handleAddFlowToOnboarding = useCallback((flowId: string) => {
    if (!flowId) return;
    
    const flowExists = selectedOnboardingFlows.some(f => f.flow_id === flowId);
    if (flowExists) return;
    
    const flowData = allCursorFlows.find(f => f.id === flowId);
    if (!flowData) return;
    
    const newPosition = Math.max(...selectedOnboardingFlows.map(f => f.position), 0) + 1;
    
    const newFlowItem: OnboardingChecklistFlowItem = {
      id: 'temp-' + Date.now(),
      checklist_id: currentChecklist?.id || '',
      flow_id: flowId,
      position: newPosition,
      cursor_flows: [{ id: flowData.id, name: flowData.name, status: flowData.status }]
    };
    
    setSelectedOnboardingFlows(prev => [...prev, newFlowItem].sort((a, b) => a.position - b.position));
  }, [selectedOnboardingFlows, allCursorFlows, currentChecklist]);

  // Remove flow from onboarding
  const handleRemoveFlowFromOnboarding = useCallback((flowId: string) => {
    setSelectedOnboardingFlows(prev => prev.filter(f => f.flow_id !== flowId));
  }, []);

  // Handle drag end - reorder flows
  const handleDragEnd = useCallback((event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setSelectedOnboardingFlows((items) => {
        const oldIndex = items.findIndex(item => item.flow_id === active.id);
        const newIndex = items.findIndex(item => item.flow_id === over.id);
        
        const reorderedItems = arrayMove(items, oldIndex, newIndex);
        
        // Update positions to reflect new order
        return reorderedItems.map((item, index) => ({
          ...item,
          position: index + 1
        }));
      });
    }
  }, []);

  // Save changes (flows or details)
  const handleSaveChanges = useCallback(async (type: 'flows' | 'details') => {
    if (!currentChecklist) {
      setError('No checklist found to save changes to.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (type === 'flows') {
        const flowsToSave = selectedOnboardingFlows.map(item => ({
          flow_id: item.flow_id,
          position: item.position
        }));

        const { success, error: updateError } = await updateOnboardingChecklistFlows(
          currentChecklist.id,
          flowsToSave
        );

        if (!success) {
          throw updateError;
        }

        setSuccessMessage('Onboarding flows saved successfully!');
      } else if (type === 'details') {
        const { checklist: updatedChecklist, error: updateError } = await updateOnboardingChecklistDetails(
          currentChecklist.id,
          {
            title_text: widgetHeading,
            description: widgetDescription,
            logo_url: null
          }
        );

        if (updateError || !updatedChecklist) {
          throw updateError;
        }

        setCurrentChecklist(updatedChecklist);
        setSuccessMessage('Widget settings saved successfully!');
      }

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('[OnboardingPage] Error saving changes:', err);
      setError(err instanceof Error ? err.message : `Failed to save ${type}`);
    } finally {
      setIsSaving(false);
    }
  }, [currentChecklist, selectedOnboardingFlows, widgetHeading, widgetDescription]);



  // Available flows for selection (excluding already selected ones)
  const availableFlowsForSelect = allCursorFlows.filter(flow => 
    !selectedOnboardingFlows.some(selectedFlow => selectedFlow.flow_id === flow.id) &&
    flow.status === 'live'
  );

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
          <p className="text-sm text-gray-500 mb-4">Select flows and drag them to arrange in the order they should appear to your users.</p>
          
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
            <h3 className="text-lg font-medium text-gray-600 mb-3">Selected Onboarding Flows (Drag to reorder)</h3>
            {isLoading && selectedOnboardingFlows.length === 0 && <p className="text-sm text-gray-500">Loading selected flows...</p>}
            <div className="min-h-[100px] border rounded-md p-2 bg-gray-50 space-y-2">
              {selectedOnboardingFlows.length > 0 ? (
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                  modifiers={[restrictToVerticalAxis]}
                >
                  <SortableContext 
                    items={selectedOnboardingFlows.map(item => item.flow_id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {selectedOnboardingFlows.map((flowItem, index) => (
                      <SortableFlowItem
                        key={flowItem.flow_id}
                        flowItem={flowItem}
                        index={index}
                        onRemove={handleRemoveFlowFromOnboarding}
                        isSaving={isSaving}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
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
           <p className="text-sm text-gray-500 mb-4">Set the title and description for the onboarding widget.</p>
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

          <div className="mt-6 flex justify-end">
            <Button onClick={() => handleSaveChanges('details')} disabled={isLoading || isSaving} loading={isSaving}>Save Appearance</Button>
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