import { Upload } from "lucide-react";
import { Button } from "./ui/button";
import { ChangeEvent, useRef } from "react";

interface UploadButtonProps {
  onFileSelect: (files: FileList) => void;
  multiple?: boolean;
}

export const UploadButton = ({ onFileSelect, multiple = false }: UploadButtonProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
      />
      <Button
        onClick={handleClick}
        variant="secondary"
        className="w-full"
      >
        <Upload className="h-5 w-5 mr-2" />
        Upload Photo{multiple ? 's' : ''}
      </Button>
    </>
  );
};
