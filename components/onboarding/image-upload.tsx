"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ImageIcon, UploadIcon, X, Loader2 } from 'lucide-react'
import { supabase } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"
import { toast } from "sonner"

interface ImageUploadProps {
  value: File | null
  onChange: (file: File | null) => void
  onUrlChange?: (url: string | null) => void
  existingUrl?: string | null
  userId: string
}

export function ImageUpload({
  value,
  onChange,
  onUrlChange,
  existingUrl,
  userId,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(existingUrl || null)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (file: File | null) => {
    if (!file) {
      onChange(null)
      onUrlChange?.(null)
      setPreview(null)
      return
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB")
      return
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed")
      return
    }

    setIsLoading(true)
    setUploadProgress(0)
    onChange(file)

    try {
      // Create a preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Upload to Supabase
      const fileExt = file.name.split(".").pop()
      const fileName = `${userId}/${uuidv4()}.${fileExt}`

      const { data, error } = await supabase.storage
        .from("organization-logos")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        })

      if (error) throw error

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("organization-logos")
        .getPublicUrl(fileName)

      onUrlChange?.(publicUrlData.publicUrl)
      toast.success("Logo uploaded successfully")
    } catch (error) {
      console.error("Error uploading file:", error)
      toast.error("Failed to upload image. Please try again.")
      onChange(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = async () => {
    if (preview && preview.includes("supabase.co")) {
      // Extract file path from URL to delete from Supabase
      const urlParts = preview.split("/")
      const bucketIndex = urlParts.findIndex(part => part === "organization-logos")
      if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
        const filePath = urlParts.slice(bucketIndex + 1).join("/")
        try {
          await supabase.storage.from("organization-logos").remove([filePath])
        } catch (error) {
          console.error("Error removing file:", error)
        }
      }
    }
    
    onChange(null)
    onUrlChange?.(null)
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    const file = e.dataTransfer.files?.[0] || null
    handleFileChange(file)
  }, [])

  return (
    <div className="space-y-2">
      <div 
        className={`flex items-center justify-center border-2 border-dashed rounded-lg p-4 h-40 transition-colors
          ${isDragging ? "border-primary bg-primary/10" : "border-slate-200 dark:border-slate-700"}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-sm text-slate-500">Uploading...</p>
          </div>
        ) : preview ? (
          <div className="relative w-full h-full">
            <img
              src={preview || "/placeholder.svg"}
              alt="Logo preview"
              className="object-contain w-full h-full"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-0 right-0 bg-slate-800 text-white rounded-full p-1 hover:bg-slate-700 transition-colors"
              aria-label="Remove image"
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
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              className="hidden"
              accept="image/*"
              aria-label="Upload logo"
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
      {preview && (
        <p className="text-xs text-slate-500">
          Click the X to remove the image and upload a different one
        </p>
      )}
    </div>
  )
}