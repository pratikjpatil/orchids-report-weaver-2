import { useState } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import { ReportCanvas } from "@/components/jasper-editor/ReportCanvas";
import { TopToolbar } from "@/components/jasper-editor/TopToolbar";
import { LeftPanel } from "@/components/jasper-editor/LeftPanel";
import { RightPanel } from "@/components/jasper-editor/RightPanel";
import { ImportTemplateDialog } from "@/components/jasper-editor/ImportTemplateDialog";
import { ConfigProvider } from "@/contexts/ConfigContext";
import { useToast } from "@/hooks/use-toast";
import { saveTemplate, saveVariants } from "@/services/api";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1976d2" },
    secondary: { main: "#2c8aa8" },
    background: { default: "#f5f7fa", paper: "#ffffff" },
  },
  components: {
    MuiAppBar: {
      styleOverrides: { root: { boxShadow: "0 1px 3px rgba(0,0,0,0.08)" } },
    },
  },
});

const Index = () => {
  const { toast } = useToast();
  const [template, setTemplate] = useState<any>({
    templateMeta: {
      templateId: "",
      version: 1,
      pageSize: "A4",
      pageOrientation: "portrait",
    },
    reportMeta: {
      reportName: "",
      reportId: "",
      extras: [
        { name: "Report Date", value: new Date().toISOString().split("T")[0] },
      ],
    },
    reportData: { columns: [], rows: [] },
    variants: [],
  });

  const [selectedCell, setSelectedCell] = useState<{
    rowIndex: number;
    cellIndex: number;
  } | null>(null);
  const [formulaMode, setFormulaMode] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [templateSaved, setTemplateSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleExportJSON = () => {
    const exportData = { template, variants: template.variants || [] };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${template.reportMeta?.reportName || "report"}-template.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Template exported",
      description: "Your template has been downloaded as JSON",
    });
  };

  const handleSaveTemplate = async () => {
    setSaving(true);
    const payload = {
      template: {
        templateMeta: template.templateMeta,
        reportMeta: template.reportMeta,
        reportData: template.reportData,
      },
      variants: template.variants,
    };
    const result = await saveTemplate(payload);
    setSaving(false);

    if (result.success) {
      setTemplateSaved(true);
      if (result.templateId) {
        setTemplate({
          ...template,
          templateMeta: {
            ...template.templateMeta,
            templateId: result.templateId,
          },
        });
      }
      toast({
        title: "Template saved",
        description: "Your template has been saved successfully",
      });
    } else {
      toast({
        title: "Save failed",
        description: result.error || "Failed to save template",
        variant: "destructive",
      });
    }
  };

  const handleSaveVariants = async () => {
    if (!templateSaved && !template.templateMeta.templateId) {
      toast({
        title: "Save template first",
        description: "Please save the template before saving variants",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    const result = await saveVariants(
      template.templateMeta.templateId,
      template.variants || []
    );
    setSaving(false);

    if (result.success) {
      toast({
        title: "Variants saved",
        description: "Your variants have been saved successfully",
      });
    } else {
      toast({
        title: "Save failed",
        description: result.error || "Failed to save variants",
        variant: "destructive",
      });
    }
  };

  const handleImport = (data: { template: any; variants: any[] }) => {
    setTemplate({ ...data.template, variants: data.variants || [] });
    setSelectedCell(null);
    setTemplateSaved(false);
    toast({
      title: "Template imported",
      description: "Template loaded successfully",
    });
  };

  // Update selected cell when rows are reordered
  const handleTemplateChange = (newTemplate: any) => {
    setTemplate(newTemplate);
  };

  return (
    <ConfigProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "100vh",
            overflow: "hidden",
          }}
        >
          <TopToolbar
            onExport={handleExportJSON}
            onSave={handleSaveTemplate}
            onSaveVariants={handleSaveVariants}
            onImport={() => setImportDialogOpen(true)}
            reportName={template.reportMeta.reportName}
            saving={saving}
            templateSaved={templateSaved}
            variantsCount={template.variants?.length || 0}
          />

          <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
            <LeftPanel
              template={template}
              onTemplateChange={handleTemplateChange}
            />

            <ReportCanvas
              template={template}
              onTemplateChange={handleTemplateChange}
              selectedCell={selectedCell}
              onCellSelect={setSelectedCell}
              formulaMode={formulaMode}
            />

            <RightPanel
              template={template}
              onTemplateChange={handleTemplateChange}
              selectedCell={selectedCell}
              formulaMode={formulaMode}
              onFormulaModeChange={setFormulaMode}
            />
          </Box>
        </Box>

        <ImportTemplateDialog
          open={importDialogOpen}
          onClose={() => setImportDialogOpen(false)}
          onImport={handleImport}
        />
      </ThemeProvider>
    </ConfigProvider>
  );
};

export default Index;
