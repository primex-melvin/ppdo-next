"use client";

import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  ResizableModal,
  ResizableModalBody,
  ResizableModalContent,
  ResizableModalTitle,
} from "@/components/ui/resizable-modal";
import { LoadingState } from "@/components/features/ppdo/LoadingState";
import { toast } from "sonner";
import {
  Loader2,
  Upload,
  X,
  User,
  Building2,
  CheckCircle2,
  ArrowRight,
  Lightbulb,
  History,
  Bug,
  Sparkles,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import { Id } from "@/convex/_generated/dataModel";
import { OnboardingConfig, type OnboardingFlow } from "@/convex/config/onboardingConfig";
import { useRouter } from "next/navigation";

export function OnboardingModal() {
  const status = useQuery(api.auth.getOnboardingStatus, {});
  const completeOnboarding = useMutation(api.auth.completeInitialOnboarding);
  const completeBugReportOnboarding = useMutation(api.auth.completeBugReportOnboarding);
  const completeResetPinFeatureOnboarding = useMutation(api.auth.completeResetPinFeatureOnboarding);
  const generateUploadUrl = useMutation(api.media.generateUploadUrl);
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [flow, setFlow] = useState<OnboardingFlow | null>(null);

  // Profile Flow State
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Features Flow State
  const [featureStep, setFeatureStep] = useState<1 | 2 | 3>(1);
  const [resetPinStep, setResetPinStep] = useState<1 | 2>(1);
  const [resetPinLoading, setResetPinLoading] = useState(false);
  const [isResetPinImageOpen, setIsResetPinImageOpen] = useState(false);

  // Fix hydration issues
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Effect to determine if modal should show
  useEffect(() => {
    if (status) {
      setLoading(false);
      setResetPinLoading(false);

      if (status.nextFlow) {
        setFlow(status.nextFlow);
        setIsOpen(true);

        if (status.nextFlow === "profile") {
          setStep(1);

          if (status.currentUserName) {
            setUsername(status.currentUserName);
          }

          if (status.currentDepartmentId) {
            setDepartmentId(status.currentDepartmentId);
          } else if (OnboardingConfig.DEFAULT_DEPARTMENT_CODE && status.departments.length > 0) {
            const defaultDept = status.departments.find(
              (d: { _id: string; name: string; code: string }) =>
                d.code === OnboardingConfig.DEFAULT_DEPARTMENT_CODE
            );

            if (defaultDept) {
              setDepartmentId(defaultDept._id.toString());
            }
          }
        }

        if (status.nextFlow === "features") {
          setFeatureStep(1);
        }

        if (status.nextFlow === "reset_pin_feature") {
          setResetPinStep(1);
          setIsResetPinImageOpen(false);
        }
      } else {
        setFlow(null);
        setIsOpen(false);
        setIsResetPinImageOpen(false);
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

  const handleSubmitProfile = async () => {
    try {
      setLoading(true);
      let storageId: string | undefined = undefined;

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

      await completeOnboarding({
        username: username,
        departmentId: departmentId as Id<"departments">,
        imageStorageId: storageId,
      });

      toast.success("Profile Setup Complete!");
      // Effect will switch to next flow
    } catch {
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureNext = () => {
    setLoading(false); // Reset loading state just in case
    if (featureStep < 3) {
      setFeatureStep(prev => (prev + 1) as 1 | 2 | 3);
    } else {
      handleFinishFeatures();
    }
  };

  const handleFinishFeatures = async () => {
    try {
      setLoading(true);
      await completeBugReportOnboarding();
      router.push("/dashboard/settings/updates/bugs-report?welcome=true");
    } catch {
      toast.error("Failed to complete onboarding.");
      setLoading(false);
    }
  };

  const handleResetPinNext = () => {
    if (resetPinStep < 2) {
      setResetPinStep(2);
    }
  };

  const handleOpenSecuritySettings = async () => {
    try {
      setResetPinLoading(true);
      await completeResetPinFeatureOnboarding();
      setIsOpen(false);
      setFlow(null);
      window.dispatchEvent(new CustomEvent("open-account-settings", {
        detail: { tab: "security" },
      }));
    } catch {
      toast.error("Failed to complete onboarding.");
      setResetPinLoading(false);
    }
  };

  const resetPinImageSrc = resetPinStep === 1
    ? "/onboarding/onboarding-reset-pin-arrow.webp"
    : "/onboarding/onboarding-reset-pin.webp";

  const isBannerTarget = (target: EventTarget | null) =>
    target instanceof Element && !!target.closest("[data-changelog-banner='true']");

  const handleOutsideInteract = (event: {
    target: EventTarget | null;
    preventDefault: () => void;
  }) => {
    if (isBannerTarget(event.target)) {
      return;
    }

    event.preventDefault();
  };

  // Prevent render if not mounted or status isn't loaded yet
  if (!mounted || !status) return null;

  // IMPORTANT: Do not render Dialog if flow is not set, otherwise it might be empty
  if (!isOpen || !flow) return null;

  return (
    <>
      <Dialog open={isOpen} modal={false} onOpenChange={() => { /* Block closing */ }}>
        <DialogContent
          showCloseButton={false}
          overlayClassName="top-[var(--changelog-banner-height,0px)]"
          className="sm:max-w-[500px] p-0 overflow-hidden gap-0 border-0 shadow-2xl focus:outline-none"
          onInteractOutside={handleOutsideInteract}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogTitle className="sr-only">Onboarding Setup</DialogTitle>
          {flow === "profile" ? (
          <>
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 p-8 text-white relative overflow-hidden">
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
                        onClick={handleSubmitProfile}
                        disabled={loading}
                        className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                      >
                        Skip
                      </Button>
                      <Button
                        onClick={handleSubmitProfile}
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
          </>
        ) : flow === "features" ? (
          <>
            {/* Features Flow Header */}
            <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 transform translate-x-1/4 -translate-y-1/4">
                {featureStep === 1 && <Lightbulb size={140} />}
                {featureStep === 2 && <History size={140} />}
                {featureStep === 3 && <Bug size={140} />}
              </div>

              <div className="relative z-10">
                <h2 className="text-2xl font-bold tracking-tight">
                  {featureStep === 1 && "Make It Better"}
                  {featureStep === 2 && "Stay Updated"}
                  {featureStep === 3 && "Report Issues"}
                </h2>
                <p className="text-indigo-200 mt-2 text-sm leading-relaxed">
                  {featureStep === 1 && "Your ideas matter. Suggest features that will improve your workflow."}
                  {featureStep === 2 && "Keep track of all the latest improvements and fixes in our system."}
                  {featureStep === 3 && "Encountered a bug? Let us know so we can fix it immediately."}
                </p>
              </div>

              <div className="mt-8 relative z-10">
                <div className="flex justify-between text-xs text-indigo-300 mb-2">
                  <span>Step {featureStep} of 3</span>
                </div>
                <Progress value={(featureStep / 3) * 100} className="h-1.5 bg-indigo-950/50" />
              </div>
            </div>

            {/* Features Content */}
            <div className="p-8 bg-white dark:bg-zinc-950">
              {loading ? (
                <LoadingState message="Finalizing setup..." />
              ) : (
                <>
                  <div className="min-h-[200px] flex flex-col items-center text-center justify-center space-y-4">
                    <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center mb-2">
                      {featureStep === 1 && <Lightbulb size={32} className="text-indigo-600 dark:text-indigo-400" />}
                      {featureStep === 2 && <History size={32} className="text-indigo-600 dark:text-indigo-400" />}
                      {featureStep === 3 && <Bug size={32} className="text-indigo-600 dark:text-indigo-400" />}
                    </div>

                    <div className="max-w-[80%]">
                      {featureStep === 1 && (
                        <p className="text-zinc-600 dark:text-zinc-400">
                          Visit the Suggestions page to submit ideas or vote on features you want to see next.
                        </p>
                      )}
                      {featureStep === 2 && (
                        <p className="text-zinc-600 dark:text-zinc-400">
                          Check the Changelog regularly to see what&apos;s new, what&apos;s changed, and what&apos;s currently in progress.
                        </p>
                      )}
                      {featureStep === 3 && (
                        <p className="text-zinc-600 dark:text-zinc-400">
                          Help us maintain a stable system by reporting any unexpected behavior or errors you encounter.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={handleFeatureNext}
                      disabled={loading}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white w-full h-11 text-base cursor-pointer"
                    >
                      {featureStep === 3 ? (
                        <>Finish Bug, Suggestion, Changelogs System <Sparkles className="ml-2 h-4 w-4" /></>
                      ) : (
                        <>Next <ArrowRight className="ml-2 h-4 w-4" /></>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </>
        ) : flow === "reset_pin_feature" ? (
          <>
            <div className="bg-gradient-to-br from-emerald-900 to-teal-800 p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 transform translate-x-1/4 -translate-y-1/4">
                {resetPinStep === 1 ? <KeyRound size={140} /> : <ShieldCheck size={140} />}
              </div>

              <div className="relative z-10">
                <h2 className="text-2xl font-bold tracking-tight">
                  {resetPinStep === 1 ? "Reset PIN Feature" : "How to Request and Use It"}
                </h2>
                <p className="text-emerald-100 mt-2 text-sm leading-relaxed">
                  {resetPinStep === 1
                    ? "Recover access safely if you forget the PIN used for permanent delete actions."
                    : "Follow these steps to request approval and set a new PIN when your reset is accepted."}
                </p>
              </div>

              <div className="mt-8 relative z-10">
                <div className="flex justify-between text-xs text-emerald-200 mb-2">
                  <span>Step {resetPinStep} of 2</span>
                </div>
                <Progress value={(resetPinStep / 2) * 100} className="h-1.5 bg-emerald-950/40" />
              </div>
            </div>

            <div className="p-8 bg-white dark:bg-zinc-950">
              <div className="space-y-6">
                <button
                  type="button"
                  onClick={() => setIsResetPinImageOpen(true)}
                  className="group block w-full text-left rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                  aria-label="Open reset PIN onboarding image in full screen"
                >
                  <div className="relative overflow-hidden rounded-2xl border border-emerald-100 dark:border-emerald-950/50 bg-emerald-50/60 dark:bg-emerald-950/10">
                    <div className="relative aspect-[16/10] w-full">
                      <Image
                        src={resetPinImageSrc}
                        alt="Reset PIN feature preview"
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        priority
                      />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-4 py-3 text-sm font-medium text-white">
                      Click image to view full screen
                    </div>
                  </div>
                </button>

                {resetPinStep === 1 ? (
                  <div className="space-y-4 text-sm text-zinc-600 dark:text-zinc-400">
                    <p>
                      Your delete protection PIN is required before the app allows permanent delete actions.
                    </p>
                    <p>
                      If you forget that PIN, you can now request a reset instead of losing access to that security step.
                    </p>
                    <p>
                      This keeps delete actions protected while giving you a safe way to recover and continue working.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-5">
                      <ol className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
                        <li>Open <span className="font-medium text-zinc-900 dark:text-zinc-100">Account Settings &gt; Security</span>.</li>
                        <li>Click <span className="font-medium text-zinc-900 dark:text-zinc-100">Request PIN Reset</span>.</li>
                        <li>Wait for <span className="font-medium text-zinc-900 dark:text-zinc-100">super admin approval</span> in the PIN reset review page.</li>
                        <li>After approval, create a new <span className="font-medium text-zinc-900 dark:text-zinc-100">6-digit PIN</span>.</li>
                      </ol>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Permanent delete stays blocked until your request is approved and your new PIN is saved.
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  {resetPinStep === 2 && (
                    <Button
                      variant="ghost"
                      onClick={() => setResetPinStep(1)}
                      disabled={resetPinLoading}
                    >
                      Back
                    </Button>
                  )}
                  <Button
                    onClick={resetPinStep === 1 ? handleResetPinNext : handleOpenSecuritySettings}
                    disabled={resetPinLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[220px]"
                  >
                    {resetPinLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : resetPinStep === 1 ? (
                      <>
                        Next <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Open Security Settings <ShieldCheck className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </>
          ) : null}
        </DialogContent>
      </Dialog>

      <ResizableModal open={isResetPinImageOpen} modal={false} onOpenChange={setIsResetPinImageOpen}>
        <ResizableModalContent
          width="100vw"
          height="100vh"
          maxWidth="100vw"
          maxHeight="100vh"
          overlayClassName="top-[var(--changelog-banner-height,0px)]"
          className="rounded-none border-0 bg-black p-0 shadow-none"
          closeAriaLabel="Close full screen image"
          closeButtonClassName="right-5 top-5 rounded-full border border-white/25 bg-white/90 p-3 opacity-100 shadow-xl backdrop-blur-md hover:bg-white focus:ring-white focus:ring-offset-0 dark:border-black/30 dark:bg-zinc-900/90 dark:hover:bg-zinc-900"
          closeIconClassName="h-6 w-6 text-zinc-900 hover:text-zinc-950 dark:text-zinc-100 dark:hover:text-white"
          onPointerDownOutside={handleOutsideInteract}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <ResizableModalTitle className="sr-only">Reset PIN onboarding image</ResizableModalTitle>
          <ResizableModalBody className="flex items-center justify-center overflow-hidden p-0">
            <div className="relative h-full w-full">
              <Image
                src={resetPinImageSrc}
                alt="Reset PIN onboarding full screen preview"
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>
          </ResizableModalBody>
        </ResizableModalContent>
      </ResizableModal>
    </>
  );
}
