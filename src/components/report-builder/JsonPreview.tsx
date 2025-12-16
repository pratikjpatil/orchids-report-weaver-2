import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface JsonPreviewProps {
  template: any;
}

export const JsonPreview = ({ template }: JsonPreviewProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(template, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">JSON Template</h3>
        <Button onClick={handleCopy} size="sm" variant="outline" className="gap-2">
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy
            </>
          )}
        </Button>
      </div>

      <div className="relative rounded-lg bg-muted/50 border border-border overflow-hidden">
        <pre className="p-4 overflow-x-auto text-xs font-mono text-foreground max-h-[600px] overflow-y-auto">
          {JSON.stringify(template, null, 2)}
        </pre>
      </div>
    </div>
  );
};
