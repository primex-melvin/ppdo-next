// app/dashboard/project/budget/[particularId]/[projectbreakdownId]/[projectId]/components/modals/InspectionDetailsModal.tsx

"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { InspectionDetailsModalProps } from "../types";

const getStatusColor = (status: string): string => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "in_progress":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "pending":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  }
};

export const InspectionDetailsModal: React.FC<InspectionDetailsModalProps> = ({ 
  open, 
  onOpenChange, 
  inspection 
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Fetch full inspection details with images when modal opens
  const fullInspection = useQuery(
    api.inspections.getInspection,
    inspection?._id ? { inspectionId: inspection._id } : "skip"
  );

  const inspectionData = fullInspection || inspection;

  if (!inspectionData) return null;

  const openImage = (url: string, index: number) => {
    setSelectedImage(url);
    setCurrentImageIndex(index);
  };

  const closeImage = () => {
    setSelectedImage(null);
  };

  const navigateImage = (direction: "next" | "prev") => {
    if (!inspectionData.images || inspectionData.images.length < 2) return;
    const len = inspectionData.images.length;
    
    let newIndex: number;
    if (direction === "next") {
      newIndex = (currentImageIndex + 1) % len;
    } else {
      newIndex = (currentImageIndex - 1 + len) % len;
    }

    setCurrentImageIndex(newIndex);
    setSelectedImage(inspectionData.images[newIndex].url);
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const statusClasses = getStatusColor(inspectionData.status);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {inspectionData.title}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Program Number: {inspectionData.programNumber} • {formatDate(inspectionData.inspectionDate)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Status Badge */}
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClasses}`}>
                {inspectionData.status.replace("_", " ")}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{inspectionData.category}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">• {inspectionData.viewCount} views</span>
            </div>

            {/* Images Gallery - Facebook style grid */}
            {inspectionData.images && inspectionData.images.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Images ({inspectionData.images.length})
                </h3>
                {inspectionData.images.length === 1 ? (
                  <div 
                    className="relative cursor-pointer overflow-hidden rounded-lg group"
                    onClick={() => openImage(inspectionData.images[0].url, 0)}
                  >
                    <img
                      src={inspectionData.images[0].url}
                      alt="Inspection"
                      className="w-full h-auto max-h-96 object-contain group-hover:opacity-90 transition-opacity"
                    />
                  </div>
                ) : inspectionData.images.length === 2 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {inspectionData.images.map((image: any, index: number) => (
                      <div
                        key={index}
                        className="relative cursor-pointer overflow-hidden rounded-lg group aspect-square"
                        onClick={() => openImage(image.url, index)}
                      >
                        <img
                          src={image.url}
                          alt={`Inspection ${index + 1}`}
                          className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                        />
                      </div>
                    ))}
                  </div>
                ) : inspectionData.images.length === 3 ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div
                      className="relative cursor-pointer overflow-hidden rounded-lg group row-span-2"
                      onClick={() => openImage(inspectionData.images[0].url, 0)}
                    >
                      <img
                        src={inspectionData.images[0].url}
                        alt="Inspection 1"
                        className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                      />
                    </div>
                    {inspectionData.images.slice(1).map((image: any, index: number) => (
                      <div
                        key={index + 1}
                        className="relative cursor-pointer overflow-hidden rounded-lg group aspect-square"
                        onClick={() => openImage(image.url, index + 1)}
                      >
                        <img
                          src={image.url}
                          alt={`Inspection ${index + 2}`}
                          className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {inspectionData.images.slice(0, 4).map((image: any, index: number) => (
                      <div
                        key={index}
                        className="relative cursor-pointer overflow-hidden rounded-lg group aspect-square"
                        onClick={() => openImage(image.url, index)}
                      >
                        <img
                          src={image.url}
                          alt={`Inspection ${index + 1}`}
                          className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                        />
                        {index === 3 && inspectionData.images.length > 4 && (
                          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                            <span className="text-white font-semibold text-3xl">
                              +{inspectionData.images.length - 4}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* No images placeholder */}
            {(!inspectionData.images || inspectionData.images.length === 0) && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center border border-gray-200 dark:border-gray-700">
                <svg 
                  className="w-12 h-12 text-gray-400 mx-auto mb-2" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                  />
                </svg>
                <p className="text-sm text-gray-500 dark:text-gray-400">No images for this inspection</p>
              </div>
            )}

            {/* Remarks */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Remarks</h3>
              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                  {inspectionData.remarks}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-95 z-[100] flex items-center justify-center p-4"
          onClick={closeImage}
        >
          <button
            onClick={closeImage}
            className="absolute top-4 right-4 p-3 bg-white rounded-full hover:bg-gray-100 transition-colors z-10 shadow-xl"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {inspectionData.images && inspectionData.images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigateImage("prev");
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10 bg-black bg-opacity-50 rounded-full p-3 hover:bg-opacity-70"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigateImage("next");
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10 bg-black bg-opacity-50 rounded-full p-3 hover:bg-opacity-70"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
          <div className="relative max-w-6xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedImage}
              alt="Fullscreen view"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 px-4 py-2 rounded-full text-sm">
              {currentImageIndex + 1} / {inspectionData.images?.length || 0}
            </div>
          </div>
        </div>
      )}
    </>
  );
};