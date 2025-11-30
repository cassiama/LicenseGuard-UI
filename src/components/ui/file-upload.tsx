import * as React from "react"
import { cn } from "@/lib/utils"

interface FileUploadProps extends Omit<React.ComponentProps<"input">, "type" | "onChange"> {
  uploadText?: string
  hintText?: string
  onChange?: (file: File | null) => void
}

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB in bytes

const FileUpload = React.forwardRef<HTMLInputElement, FileUploadProps>(
  ({ 
    className, 
    uploadText = "Upload your file", 
    hintText = "Drag & drop your file, or click to browse",
    onChange,
    ...props 
  }, ref) => {
    const [file, setFile] = React.useState<File | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    // TODO: add more functionality for dragging files onto the component
    const [, setIsDragging] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => inputRef.current!)

    const handleFileChange = (selectedFile: File | null) => {
      if (selectedFile) {
        // check if it has the correct MIME type first
        if (selectedFile.type !== "text/plain") {
          setError("Only text files are allowed (MIME type: text/plain)");
          setFile(null);
          onChange?.(null);
          return;
        }
        
        // check if it has the correct file extension
        if (selectedFile && !selectedFile.name.endsWith(".txt")) {
          setError("Only .txt files are allowed");
          setFile(null);
          onChange?.(null);
          return;
        }
        
        // check if it doesn't exceed the maximum file size (1 MB)
        if (selectedFile.size > MAX_FILE_SIZE) {
          setError("File size must not exceed 1 MB");
          setFile(null);
          onChange?.(null);
          return;
        }
        
        // once all validations passed, set the file to be selected
        setError(null);
        setFile(selectedFile);
        onChange?.(selectedFile);
      }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0] || null
      handleFileChange(selectedFile)
    }

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    }

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    }

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const droppedFile = e.dataTransfer.files?.[0] || null
      handleFileChange(droppedFile);
    }

    const handleButtonClick = () => {
      inputRef.current?.click();
    }

    const handleRemoveFile = () => {
      setFile(null);
      setError(null);
      if (inputRef.current)
        inputRef.current.value = "";
      onChange?.(null);
    }

    if (file) {
      return (
        <div className={cn("flex flex-col items-center gap-3", className)}>
          <div className="flex max-w-[480px] flex-col items-center self-stretch">
            <div className="relative flex items-center justify-between w-full px-6 py-4 bg-[#3C4E5F] rounded-2xl shadow-[0_4px_8px_3px_rgba(0,0,0,0.15),0_1px_3px_0_rgba(0,0,0,0.30)]">
              <div className="flex-1 text-white text-center font-inter text-sm font-normal leading-[21px]">
                <span className="font-bold">Filename: </span>
                <span>{file.name}</span>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="ml-4 text-white hover:text-white/80 transition-colors outline-none"
                aria-label="Remove file"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.8 4.27333L11.7267 3.20001L8 6.92667L4.27333 3.20001L3.2 4.27333L6.92667 8.00001L3.2 11.7267L4.27333 12.8L8 9.07334L11.7267 12.8L12.8 11.7267L9.07333 8.00001L12.8 4.27333Z" fill="currentColor"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <>
        {error && (
          <div className="mb-4 p-4 text-red-300 bg-red-900/50 rounded-lg text-sm">
            {error}
          </div>
        )}
        <div
          className={cn("flex flex-col items-center gap-3 p-8 border-2 border-dashed border-[#314668] rounded-2xl", className)}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".txt"
            className="hidden"
            onChange={handleInputChange}
            {...props}
          />
          
          <div className="flex flex-col items-start relative">
            <svg 
              className="w-9 h-11 relative" 
              width="36" 
              height="44" 
              viewBox="0 0 36 44" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M16.5 32.5H19.5V26.2375L21.9 28.6375L24 26.5L18 20.5L12 26.5L14.1375 28.6L16.5 26.2375V32.5ZM9 37C8.175 37 7.46875 36.7063 6.88125 36.1187C6.29375 35.5312 6 34.825 6 34V10C6 9.175 6.29375 8.46875 6.88125 7.88125C7.46875 7.29375 8.175 7 9 7H21L30 16V34C30 34.825 29.7063 35.5312 29.1188 36.1187C28.5312 36.7063 27.825 37 27 37H9ZM19.5 17.5V10H9V34H27V17.5H19.5ZM9 10V17.5V34V10Z" 
                fill="white"
              />
            </svg>
          </div>

          <div className="flex max-w-[480px] pt-2 flex-col items-center relative">
            <div className="text-white text-center font-inter text-lg font-bold">
              {uploadText}
            </div>
          </div>

          <div className="flex max-w-[480px] flex-col items-center relative">
            <div className="text-[#859ABB] text-center font-inter text-sm font-normal leading-[21px]">
              {hintText}
            </div>
          </div>

          <div className="flex h-12 min-w-[84px] max-w-[200px] px-5 justify-center items-center relative">
            <button
              type="button"
              onClick={handleButtonClick}
              className="flex p-5 justify-center items-center gap-1 flex-1 rounded-2xl bg-[#192734] text-white text-center font-inter text-base font-bold leading-6 tracking-[0.24px] hover:bg-[#192734]/90 shadow-[0_4px_8px_3px_rgba(0,0,0,0.15),0_1px_3px_0_rgba(0,0,0,0.30)] transition-all outline-none"
            >
              Browse Files
            </button>
          </div>
        </div>
      </>
    )
  }
)

FileUpload.displayName = "FileUpload";

export { FileUpload };
