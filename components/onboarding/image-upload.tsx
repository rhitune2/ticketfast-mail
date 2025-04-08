"use client";

import type React from "react";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ImageIcon, UploadIcon, X } from "lucide-react";

interface ImageUploadProps {
  value: File | null;
  onChange: (file: File | null) => void;
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    if (file) {
      onChange(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      onChange(null);
      setPreview(null);
    }
  };

  const handleRemove = () => {
    onChange(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-center border-2 border-dashed rounded-lg p-4 h-40 ">
        {preview ? (
          <div className="relative w-full h-full">
            <img
              src={preview || "/placeholder.svg"}
              alt="Logo preview"
              className="object-contain w-full h-full"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-0 right-0 bg-slate-800 text-white rounded-full p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400">
            <ImageIcon className="h-10 w-10 mb-2" />
            <p className="text-sm text-center">
              Drag and drop your logo here or click to browse
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadIcon className="h-4 w-4 mr-2" />
              Upload Logo
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
