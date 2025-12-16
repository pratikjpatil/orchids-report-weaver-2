import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MetadataEditorProps {
  metadata: any;
  onChange: (metadata: any) => void;
}

export const MetadataEditor = ({ metadata, onChange }: MetadataEditorProps) => {
  const updateField = (path: string[], value: any) => {
    const newMetadata = { ...metadata };
    let current: any = newMetadata;
    
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    
    current[path[path.length - 1]] = value;
    onChange(newMetadata);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="templateId">Template ID</Label>
          <Input
            id="templateId"
            value={metadata.templateId}
            onChange={(e) => updateField(["templateId"], e.target.value)}
            placeholder="e.g., 1"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reportId">Report ID</Label>
          <Input
            id="reportId"
            value={metadata.reportId}
            onChange={(e) => updateField(["reportId"], e.target.value)}
            placeholder="e.g., 1"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reportName">Report Name</Label>
        <Input
          id="reportName"
          value={metadata.meta.reportName}
          onChange={(e) => updateField(["meta", "reportName"], e.target.value)}
          placeholder="e.g., General Ledger Account Statement"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="reportDate">Report Date</Label>
          <Input
            id="reportDate"
            type="date"
            value={metadata.meta.reportDate}
            onChange={(e) => updateField(["meta", "reportDate"], e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="version">Version</Label>
          <Input
            id="version"
            value={metadata.version}
            onChange={(e) => updateField(["version"], e.target.value)}
            placeholder="e.g., v1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="circleCode">Circle Code</Label>
          <Input
            id="circleCode"
            value={metadata.meta.circleCode}
            onChange={(e) => updateField(["meta", "circleCode"], e.target.value)}
            placeholder="e.g., CIR-MUMBAI"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="branchCode">Branch Code</Label>
          <Input
            id="branchCode"
            value={metadata.meta.branchCode}
            onChange={(e) => updateField(["meta", "branchCode"], e.target.value)}
            placeholder="e.g., 10089"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pageSize">Page Size</Label>
          <Select value={metadata.meta.pageSize} onValueChange={(value) => updateField(["meta", "pageSize"], value)}>
            <SelectTrigger id="pageSize">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A4">A4</SelectItem>
              <SelectItem value="LETTER">Letter</SelectItem>
              <SelectItem value="LEGAL">Legal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pageOrientation">Page Orientation</Label>
          <Select value={metadata.meta.pageOrientation} onValueChange={(value) => updateField(["meta", "pageOrientation"], value)}>
            <SelectTrigger id="pageOrientation">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="portrait">Portrait</SelectItem>
              <SelectItem value="landscape">Landscape</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
