// app/dashboard/project/budget/[particularId]/[projectbreakdownId]/[inspectionId]/components/modals/NewInspectionForm.tsx

"use client";

import { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  ResizableModal,
  ResizableModalContent,
  ResizableModalHeader,
  ResizableModalTitle,
  ResizableModalDescription,
  ResizableModalBody,
  ResizableModalFooter,
} from "@/components/ui/resizable-modal";
import { Upload, X, ImageIcon, FileImage, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InspectionFormData, NewInspectionFormProps } from "../../types";

// Get current date in format: YYYY-MM-DD (for date input)
const getDefaultDate = () => {
  const now = new Date();
  return now.toISOString().slice(0, 10);
};

// Get current time in format: HH:mm (for time input)
const getDefaultTime = () => {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
};

interface UploadProgress {
  [key: number]: number;
}

interface UploadStatus {
  [key: number]: "uploading" | "completed" | "error";
}

export const NewInspectionForm: React.FC<NewInspectionFormProps> = ({ open, onOpenChange, onSubmit }) => {
  const [formData, setFormData] = useState<InspectionFormData>({
    programNumber: "",
    title: "",
    category: "",
    date: getDefaultDate(),
    time: getDefaultTime(),
    remarks: "",
    images: []
  });

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({});
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const generateUploadUrl = useMutation(api.media.generateUploadUrl);
  const createUploadSession = useMutation(api.media.createUploadSession);
  const saveMedia = useMutation(api.media.saveMedia);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const simulateProgress = (index: number) => {
    setUploadStatus(prev => ({ ...prev, [index]: "uploading" }));
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setUploadStatus(prev => ({ ...prev, [index]: "completed" }));
      }
      setUploadProgress(prev => ({ ...prev, [index]: progress }));
    }, 200);
    return interval;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addImages(files);
  };

  const addImages = (files: File[]) => {
    const validFiles = files.filter(file => file.type.startsWith("image/"));
    
    setFormData(prev => ({ ...prev, images: [...prev.images, ...validFiles] }));
    
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);

    // Initialize progress for new files
    validFiles.forEach((_, idx) => {
      const globalIndex = formData.images.length + idx;
      simulateProgress(globalIndex);
    });
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    addImages(files);
  }, [formData.images.length]);

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    // Clean up progress/status
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[index];
      return newProgress;
    });
    setUploadStatus(prev => {
      const newStatus = { ...prev };
      delete newStatus[index];
      return newStatus;
    });
  };

  const resetForm = () => {
    imagePreviews.forEach(url => URL.revokeObjectURL(url));
    setImagePreviews([]);
    setUploadProgress({});
    setUploadStatus({});
    setFormData({
      programNumber: "",
      title: "",
      category: "",
      date: getDefaultDate(),
      time: getDefaultTime(),
      remarks: "",
      images: []
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      let uploadSessionId = undefined;

      // Upload images if any
      if (formData.images.length > 0) {
        // Create upload session
        uploadSessionId = await createUploadSession({
          imageCount: formData.images.length,
        });

        // Upload each image
        for (let i = 0; i < formData.images.length; i++) {
          const file = formData.images[i];
          
          // Get upload URL
          const uploadUrl = await generateUploadUrl();
          
          // Upload file to Convex storage
          const result = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": file.type },
            body: file,
          });

          const { storageId } = await result.json();

          // Save media metadata
          await saveMedia({
            storageId,
            name: file.name,
            type: file.type,
            size: file.size,
            sessionId: uploadSessionId,
            orderInSession: i,
          });
        }
      }

      // Combine date and time into a single datetime string for the API
      const dateTimeString = `${formData.date}T${formData.time}`;

      // Call parent onSubmit with form data and session ID
      onSubmit({ ...formData, date: dateTimeString, uploadSessionId });
      resetForm();
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("Failed to upload images. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ResizableModal open={open} onOpenChange={onOpenChange}>
      <ResizableModalContent 
        width="800px" 
        maxWidth="95vw"
        maxHeight="90vh"
        className="overflow-hidden"
      >
        <ResizableModalHeader>
          <ResizableModalTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            New Inspection
          </ResizableModalTitle>
          <ResizableModalDescription className="text-gray-600 dark:text-gray-400">
            Fill in the details for the new inspection report. Title, Date and Time are required.
          </ResizableModalDescription>
        </ResizableModalHeader>
        
        <ResizableModalBody className="px-8 py-6">
          <form id="inspection-form" onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Inspection Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Inspection Title
              </Label>
              <Input 
                id="title" 
                name="title" 
                type="text" 
                placeholder="e.g., Community Women Empowerment Workshop" 
                value={formData.title} 
                onChange={handleInputChange} 
                required 
                className="w-full" 
              />
            </div>

            {/* 2. Image Upload - Moved to second position */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-muted-foreground" />
                Upload Images
                <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
              </Label>
              
              {/* Modern Upload Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200",
                  isDragging 
                    ? "border-[#15803D] bg-[#15803D]/5 scale-[1.02]" 
                    : "border-gray-300 dark:border-gray-600 hover:border-[#15803D]/50 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                )}
              >
                <input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <label
                  htmlFor="images"
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  <div className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200",
                    isDragging 
                      ? "bg-[#15803D] text-white scale-110" 
                      : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                  )}>
                    {isDragging ? (
                      <Upload className="w-8 h-8" />
                    ) : (
                      <FileImage className="w-8 h-8" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {isDragging ? "Drop images here" : "Click to upload or drag and drop"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      PNG, JPG, JPEG up to 10MB each
                    </p>
                  </div>
                </label>
              </div>

              {/* Image Previews with Progress */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
                  {imagePreviews.map((preview, index) => {
                    const progress = uploadProgress[index] || 0;
                    const status = uploadStatus[index];
                    
                    return (
                      <div 
                        key={index} 
                        className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800"
                      >
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className={cn(
                            "w-full h-full object-cover transition-all duration-300",
                            status === "uploading" && "opacity-60"
                          )}
                        />
                        
                        {/* Progress Overlay */}
                        {status === "uploading" && progress < 100 && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/20">
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                            <div className="w-16">
                              <Progress value={progress} className="h-1.5" />
                            </div>
                            <span className="text-xs text-white font-medium">
                              {Math.round(progress)}%
                            </span>
                          </div>
                        )}
                        
                        {/* Completed Checkmark */}
                        {status === "completed" && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </div>
                        )}
                        
                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 left-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
                          disabled={isUploading}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        
                        {/* Image Number Badge */}
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 text-white text-xs rounded-full">
                          {index + 1}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Date and Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-medium">
                  Inspection Date
                </Label>
                <Input 
                  id="date" 
                  name="date" 
                  type="date" 
                  value={formData.date} 
                  onChange={handleInputChange} 
                  required 
                  className="w-full" 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time" className="text-sm font-medium">
                  Inspection Time
                </Label>
                <Input 
                  id="time" 
                  name="time" 
                  type="time" 
                  value={formData.time} 
                  onChange={handleInputChange} 
                  required 
                  className="w-full" 
                />
              </div>
            </div>

            {/* 4. Remarks */}
            <div className="space-y-2">
              <Label htmlFor="remarks" className="text-sm font-medium">
                Remarks <span className="text-zinc-400 font-normal">(Optional)</span>
              </Label>
              <Textarea 
                id="remarks" 
                name="remarks" 
                placeholder="Enter detailed remarks about the inspection..." 
                value={formData.remarks} 
                onChange={handleInputChange} 
                rows={4}
                className="w-full resize-none" 
              />
            </div>
          </form>
        </ResizableModalBody>

        <ResizableModalFooter className="px-8 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="inspection-form"
            className="bg-[#15803D] hover:bg-[#166534] text-white"
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              "Create Inspection"
            )}
          </Button>
        </ResizableModalFooter>
      </ResizableModalContent>
    </ResizableModal>
  );
};
