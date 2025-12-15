// components/modals/OnboardingModal.tsx

"use client";

import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Upload, X, User, Building2, CheckCircle2, ArrowRight } from "lucide-react";
import Image from "next/image";
import { Id } from "@/convex/_generated/dataModel";
import { OnboardingConfig } from "@/convex/config/onboardingConfig";


export function OnboardingModal() {
  const status = useQuery(api.auth.getOnboardingStatus);
  const completeOnboarding = useMutation(api.auth.completeInitialOnboarding);
  const generateUploadUrl = useMutation(api.media.generateUploadUrl);
  
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [username, setUsername] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Effect to determine if modal should show
  useEffect(() => {
    if (status) {
      const hasCompletedInitial = status.completedSteps.includes("initial_profile");
      setIsOpen(!hasCompletedInitial);

      // Initialize form with defaults if opening
      if (!hasCompletedInitial) {
        // Set username if available
        if (status.currentUserName) {
          setUsername(status.currentUserName);
        }
        
        // Set department - priority: current > default from config
        if (status.currentDepartmentId) {
          setDepartmentId(status.currentDepartmentId);
        } else if (OnboardingConfig.DEFAULT_DEPARTMENT_CODE && status.departments.length > 0) {
          // Find department by code from config
          const defaultDept = status.departments.find(
            (d: { _id: string; name: string; code: string }) => 
              d.code === OnboardingConfig.DEFAULT_DEPARTMENT_CODE
          );
          
          if (defaultDept) {
            // Set the department ID as a string (not the object)
            const deptId = defaultDept._id.toString();
            setDepartmentId(deptId);
          }
        }
      }
    }
  }, [status]);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error("Please enter a username");
      return;
    }
    if (!departmentId) {
      toast.error("Please select a department");
      return;
    }
    setStep(2);
  };

  const handleFileChange = (file: File) => {
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error("File size must be less than 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      let storageId: string | undefined = undefined;

      // 1. Upload Image
      if (imageFile) {
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": imageFile.type },
          body: imageFile,
        });
        
        if (!result.ok) throw new Error("Image upload failed");
        const json = await result.json();
        storageId = json.storageId;
      }

      // 2. Submit Data
      await completeOnboarding({
        username: username,
        departmentId: departmentId as Id<"departments">,
        imageStorageId: storageId,
      });

      toast.success("Welcome! Your profile has been set up.");
      setIsOpen(false);
    } catch (error) {
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Prevent render if status isn't loaded yet
  if (!status) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => { /* Block closing */ }}>
      <DialogContent 
        className="sm:max-w-[500px] p-0 overflow-hidden gap-0 border-0 shadow-2xl focus:outline-none"
        onInteractOutside={(e) => e.preventDefault()} 
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header Section */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 p-8 text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute top-0 right-0 p-4 opacity-5 transform translate-x-1/4 -translate-y-1/4">
            <User size={140} />
          </div>
          
          <div className="relative z-10">
            <h2 className="text-2xl font-bold tracking-tight">
              {step === 1 ? "Welcome to Tarlac Systems" : "Profile Picture"}
            </h2>
            <p className="text-zinc-400 mt-2 text-sm leading-relaxed">
              {step === 1 
                ? "Let's get your account configured. Please verify your details below." 
                : "Upload a photo to help your team recognize you."}
            </p>
          </div>

          {/* Stepper */}
          <div className="flex gap-2 mt-8 relative z-10">
            <div className={`h-1 flex-1 rounded-full transition-all duration-500 ${step >= 1 ? "bg-green-500" : "bg-zinc-700"}`} />
            <div className={`h-1 flex-1 rounded-full transition-all duration-500 ${step >= 2 ? "bg-green-500" : "bg-zinc-700"}`} />
          </div>
        </div>

        <div className="p-8 bg-white dark:bg-zinc-950">
          {step === 1 ? (
            <form onSubmit={handleNextStep} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-9 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                    placeholder="jdoe"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 z-10" />
                  <Select value={departmentId} onValueChange={setDepartmentId}>
                    <SelectTrigger className="pl-9 w-full bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                        {status.departments.map((dept: { _id: Id<"departments">; name: string }) => (
                        <SelectItem key={dept._id} value={dept._id}>
                            {dept.name}
                        </SelectItem>
                        ))}
                  </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90">
                  Next Step <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Drag & Drop Area */}
              <div 
                className={`
                  relative border-2 border-dashed rounded-xl h-48 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 group
                  ${isDragOver 
                    ? "border-green-500 bg-green-50 dark:bg-green-900/10" 
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50"}
                `}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                  accept="image/png, image/jpeg, image/webp"
                />

                {imagePreview ? (
                  <div className="relative w-full h-full flex items-center justify-center p-4">
                    <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-zinc-950 shadow-xl">
                      <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="absolute top-2 right-2 bg-zinc-200 dark:bg-zinc-800 p-1.5 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                      <Upload size={20} className="text-zinc-500" />
                    </div>
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Click to upload or drag and drop</p>
                    <p className="text-xs text-zinc-500 mt-1">SVG, PNG, JPG (max 5MB)</p>
                  </>
                )}
              </div>

              <div className="flex justify-between items-center pt-2">
                <Button 
                  variant="ghost" 
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  Back
                </Button>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    onClick={handleSubmit}
                    disabled={loading}
                    className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                  >
                    Skip
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 text-white min-w-[130px]"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>Finish Setup <CheckCircle2 className="ml-2 h-4 w-4" /></>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}