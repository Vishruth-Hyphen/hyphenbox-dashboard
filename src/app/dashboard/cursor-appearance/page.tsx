"use client";

import React, { useState, useEffect, useCallback } from "react";
import * as SubframeCore from "@subframe/core";
import { Button } from "@/ui/components/Button";
import { TextField } from "@/ui/components/TextField";
import { useOrganization } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import CursorPreview from './CursorPreview'; // Import the new component
import CoPilotButtonPreview from './CoPilotButtonPreview'; // Import the button preview

function CursorAppearancePage() {
  const { getOrganizationId } = useOrganization();
  const organizationId = getOrganizationId();

  // State for theme settings
  const [brandColor, setBrandColor] = useState("#2563EB"); // Default
  const [cursorName, setCursorName] = useState(""); // Default empty
  const [logoUrl, setLogoUrl] = useState<string | null>(null); // Current logo URL
  const [logoFileName, setLogoFileName] = useState<string | null>(null); // Displayed file name
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch theme data on mount
  useEffect(() => {
    async function fetchTheme() {
      if (!organizationId) {
        setError("Organization not identified.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from("organization_themes")
          .select("brand_color, cursor_company_label, logo_url")
          .eq("organization_id", organizationId)
          .maybeSingle(); // Use maybeSingle to handle potential null result

        if (fetchError) throw fetchError;

        if (data) {
          setBrandColor(data.brand_color || "#2563EB");
          setCursorName(data.cursor_company_label || ""); // Use empty string if null
          setLogoUrl(data.logo_url || null);
          // Extract filename from URL if it exists
          if (data.logo_url) {
             try {
               const urlParts = new URL(data.logo_url);
               const pathParts = urlParts.pathname.split('/');
               setLogoFileName(pathParts[pathParts.length - 1] || null);
             } catch (e) {
               console.warn("Could not parse existing logo URL for filename:", data.logo_url);
               setLogoFileName(null); // Reset if URL is invalid
             }
          } else {
            setLogoFileName(null);
          }
        } else {
           // If no data, set defaults (could also indicate an issue)
           // The trigger should create defaults, but handle case where it might not exist yet
           console.log("No existing theme found for organization, using defaults.");
           setBrandColor("#2563EB");
           setCursorName("");
           setLogoUrl(null);
           setLogoFileName(null);
        }
      } catch (err: any) {
        console.error("Error fetching theme:", err);
        setError(err.message || "Failed to load theme settings.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchTheme();
  }, [organizationId]);

  // Handle logo upload
  const handleLogoUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!organizationId) {
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

      setError(null); // Clear previous errors
      setIsSaving(true); // Indicate activity

      const fileName = `${organizationId}-${Date.now()}.svg`; // Unique filename
      const filePath = `${fileName}`; // Path in the bucket

      try {
        // Upload to Supabase storage
        const { error: uploadError } = await supabase
          .storage
          .from('organization-logos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true, // Overwrite if exists (or use unique names)
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
        setLogoUrl(newLogoUrl);
        setLogoFileName(file.name); // Display the original uploaded filename

        // Optionally: Immediately save the new URL to the database
        // handleSaveChanges(newLogoUrl); // Pass the new URL directly
        // Or let the user click "Save Changes" separately

      } catch (err: any) {
          console.error('Logo upload error:', err);
          setError(err.message || 'Failed to upload logo.');
      } finally {
          setIsSaving(false); // Finish activity indicator
      }
  }, [organizationId, supabase]);

  // Handle saving changes
  const handleSaveChanges = useCallback(async (currentLogoUrl = logoUrl) => { // Allow passing logoUrl directly after upload
    if (!organizationId) {
      setError("Organization ID is missing, cannot save changes.");
      return;
    }

    setIsSaving(true);
    setError(null);

    // Basic hex color validation
    if (!/^#[A-Fa-f0-9]{6}$/.test(brandColor)) {
       setError("Invalid brand color format. Please use #RRGGBB (e.g., #B6EB24).");
       setIsSaving(false);
       return;
    }

    try {
      const { error: updateError } = await supabase
        .from("organization_themes")
        .update({
          brand_color: brandColor,
          cursor_company_label: cursorName || null, // Store null if empty
          logo_url: currentLogoUrl, // Use the potentially updated logo URL
          updated_at: new Date().toISOString(),
        })
        .eq("organization_id", organizationId);

      if (updateError) throw updateError;

      // Optionally add success feedback, e.g., a toast notification
      console.log("Theme updated successfully!");

    } catch (err: any) {
      console.error("Error saving theme:", err);
      setError(err.message || "Failed to save theme settings.");
    } finally {
      setIsSaving(false);
    }
  }, [organizationId, brandColor, cursorName, logoUrl, supabase]);


  if (isLoading) {
    return <div className="p-6">Loading theme settings...</div>; // Basic loading state
  }

  return (
    <div className="flex h-full w-full flex-col items-start p-6">
      <div className="flex w-full max-w-3xl flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background p-6 shadow-sm">
        {/* Remove the flex container */}
        {/* <div className="flex w-full items-center justify-between"> */}
          <h1 className="text-xl font-semibold text-default-font">Cursor Appearance</h1>
          {/* Place preview below the title and add bottom margin */}
          {/* Wrap previews in a flex container with gap */}
          <div className="w-full mb-4 flex items-center gap-4"> 
             <CursorPreview brandColor={brandColor} cursorName={cursorName} />
             <CoPilotButtonPreview logoUrl={logoUrl} />
          </div>
        {/* </div> */}

        {/* Remove the preview component from here (already removed) */}

        <div className="flex w-full flex-col items-start rounded-md border border-solid border-neutral-border bg-white shadow-sm">
          {/* Cursor Color Section */}
          <div className="flex w-full items-center gap-2 border-b border-solid border-neutral-border px-4 py-4">
            <span className="w-1/3 text-body font-body text-subtext-color">
              Cursor Color
            </span>
            <div className="flex w-2/3 items-center justify-start gap-2">
              <div className="flex h-6 w-6 flex-none rounded border border-neutral-300" style={{ backgroundColor: brandColor }}></div>
              {/* Use TextField wrapper with TextField.Input inside */}
              <TextField variant="outline" className="w-24"> {/* Pass styling/variant to wrapper */}
                 <TextField.Input
                    type="text"
                    value={brandColor}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBrandColor(e.target.value)}
                    placeholder="#B6EB24"
                    className="text-body font-body" // Style the input itself if needed
                 />
              </TextField>
            </div>
          </div>

          {/* Cursor Name Section */}
          <div className="flex w-full items-center gap-2 border-b border-solid border-neutral-border px-4 py-4">
            <span className="w-1/3 text-body font-body text-subtext-color">
              Cursor Name
            </span>
            <div className="flex w-2/3 items-center justify-start gap-2">
              {/* Use TextField wrapper with TextField.Input inside */}
               <TextField variant="outline" className="flex-grow"> {/* Pass styling/variant to wrapper */}
                  <TextField.Input
                     type="text"
                     value={cursorName}
                     onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCursorName(e.target.value)}
                     placeholder="Your Company Name"
                     className="text-body font-body" // Style the input itself if needed
                  />
               </TextField>
            </div>
          </div>

          {/* Company Logo Section */}
          <div className="flex w-full items-start gap-2 px-4 py-4">
            <span className="w-1/3 text-body font-body text-subtext-color pt-1">
              Company Logo
            </span>
            <div className="flex w-2/3 flex-col items-start gap-2">
               {/* Display current logo image if URL exists */}
              {logoUrl && (
                <div className="mb-2 flex items-center gap-2">
                   <img src={logoUrl} alt="Company Logo" className="h-10 w-auto max-w-[150px] rounded object-contain" />
                   {/* Display uploaded file name - REMOVED */}
                   {/* {logoFileName && <span className="text-caption text-neutral-500 truncate">{logoFileName}</span>} */}
                </div>
              )}
              {/* File Input for Upload */}
              <label className={`flex cursor-pointer items-center justify-center gap-1 rounded-md border border-dashed border-neutral-border bg-default-background px-4 py-3 text-brand-700 shadow-sm transition hover:bg-neutral-50 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <SubframeCore.Icon
                  className="text-body font-body"
                  name="FeatherUploadCloud"
                />
                <span className="text-sm font-medium">{logoUrl ? 'Replace Logo' : 'Upload Logo'}</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/svg+xml"
                  onChange={handleLogoUpload}
                  disabled={isSaving}
                />
              </label>
              <span className="text-caption font-caption text-subtext-color">SVG format required.</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="w-full rounded border border-solid border-error-300 bg-error-50 p-3 text-sm text-error-700">
            {error}
          </div>
        )}

        {/* Save Button */}
        <div className="flex w-full justify-end">
           <Button onClick={() => handleSaveChanges()} disabled={isSaving || isLoading}>
             {isSaving ? "Saving..." : "Save Changes"}
           </Button>
        </div>
      </div>
    </div>
  );
}

export default CursorAppearancePage; 