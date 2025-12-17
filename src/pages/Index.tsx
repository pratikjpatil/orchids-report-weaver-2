import { useCallback, useEffect } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import { ReportCanvas } from "@/components/jasper-editor/ReportCanvas";
import { TopToolbar } from "@/components/jasper-editor/TopToolbar";
import { LeftPanel } from "@/components/jasper-editor/LeftPanel";
import { RightPanel } from "@/components/jasper-editor/RightPanel";
import { ImportTemplateDialog } from "@/components/jasper-editor/ImportTemplateDialog";
import { useToast } from "@/hooks/use-toast";
import { saveTemplate, saveVariants } from "@/services/api";
import { useAppDispatch, useAppSelector } from "@/store";
import { generateBulkTestData } from "@/utils/testDataGenerator";
import {
  setTemplate,
  setTemplateMeta,
  setSelectedCell,
  setSaving,
  setTemplateSaved,
} from "@/store/templateSlice";
import { loadTableConfigs } from "@/store/configSlice";
import {
  selectTemplateMeta,
  selectReportMeta,
  selectVariants,
  selectSaving,
  selectTemplateSaved,
  selectTemplateForExport,
} from "@/store/selectors";
import { useState } from "react";

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
  const dispatch = useAppDispatch();
  
  const templateMeta = useAppSelector(selectTemplateMeta);
  const reportMeta = useAppSelector(selectReportMeta);
  const variants = useAppSelector(selectVariants);
  const saving = useAppSelector(selectSaving);
  const templateSaved = useAppSelector(selectTemplateSaved);
  const templateForExport = useAppSelector(selectTemplateForExport);

  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const handleExportJSON = useCallback(() => {
    const exportData = { template: templateForExport, variants };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportMeta.reportName || "report"}-template.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Template exported",
      description: "Your template has been downloaded as JSON",
    });
  }, [templateForExport, variants, reportMeta.reportName, toast]);

  const handleSaveTemplate = useCallback(async () => {
    dispatch(setSaving(true));
    const result = await saveTemplate({
      template: templateForExport,
      variants,
    });
    dispatch(setSaving(false));

    if (result.success) {
      dispatch(setTemplateSaved(true));
      if (result.templateId) {
        dispatch(setTemplateMeta({ templateId: result.templateId }));
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
  }, [dispatch, templateForExport, variants, toast]);

  const handleSaveVariants = useCallback(async () => {
    if (!templateSaved && !templateMeta.templateId) {
      toast({
        title: "Save template first",
        description: "Please save the template before saving variants",
        variant: "destructive",
      });
      return;
    }

    dispatch(setSaving(true));
    const result = await saveVariants(templateMeta.templateId, variants);
    dispatch(setSaving(false));

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
  }, [dispatch, templateSaved, templateMeta.templateId, variants, toast]);

  const handleImport = useCallback((data: { template: any; variants: any[] }) => {
    dispatch(setTemplate({ ...data.template, variants: data.variants || [] }));
    dispatch(setSelectedCell(null));
    dispatch(setTemplateSaved(false));
    toast({
      title: "Template imported",
      description: "Template loaded successfully",
    });
  }, [dispatch, toast]);

  const handleGenerateTestData = useCallback((rowCount: number) => {
    const testData = generateBulkTestData(rowCount);
    dispatch(setTemplate(testData));
    dispatch(setSelectedCell(null));
    dispatch(setTemplateSaved(false));
    toast({
      title: "Test data generated",
      description: `Successfully generated ${rowCount} rows for performance testing`,
    });
  }, [dispatch, toast]);

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
            onGenerateTestData={handleGenerateTestData}
            reportName={reportMeta.reportName}
            saving={saving}
            templateSaved={templateSaved}
            variantsCount={variants.length}
          />

          <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
            <LeftPanel />
            <ReportCanvas />
            <RightPanel />
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
import { useCallback, useEffect } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import { ReportCanvas } from "@/components/jasper-editor/ReportCanvas";
import { TopToolbar } from "@/components/jasper-editor/TopToolbar";
import { LeftPanel } from "@/components/jasper-editor/LeftPanel";
import { RightPanel } from "@/components/jasper-editor/RightPanel";
import { ImportTemplateDialog } from "@/components/jasper-editor/ImportTemplateDialog";
import { useToast } from "@/hooks/use-toast";
import { saveTemplate, saveVariants } from "@/services/api";
import { useAppDispatch, useAppSelector } from "@/store";
import { generateBulkTestData } from "@/utils/testDataGenerator";
import {
  setTemplate,
  setTemplateMeta,
  setSelectedCell,
  setSaving,
  setTemplateSaved,
} from "@/store/templateSlice";
import { loadTableConfigs } from "@/store/configSlice";
import {
  selectTemplateMeta,
  selectReportMeta,
  selectVariants,
  selectSaving,
  selectTemplateSaved,
  selectTemplateForExport,
} from "@/store/selectors";
import { useState } from "react";

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
  const dispatch = useAppDispatch();
  
  const templateMeta = useAppSelector(selectTemplateMeta);
  const reportMeta = useAppSelector(selectReportMeta);
  const variants = useAppSelector(selectVariants);
  const saving = useAppSelector(selectSaving);
  const templateSaved = useAppSelector(selectTemplateSaved);
  const templateForExport = useAppSelector(selectTemplateForExport);

  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const handleExportJSON = useCallback(() => {
    const exportData = { template: templateForExport, variants };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportMeta.reportName || "report"}-template.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Template exported",
      description: "Your template has been downloaded as JSON",
    });
  }, [templateForExport, variants, reportMeta.reportName, toast]);

  const handleSaveTemplate = useCallback(async () => {
    dispatch(setSaving(true));
    const result = await saveTemplate({
      template: templateForExport,
      variants,
    });
    dispatch(setSaving(false));

    if (result.success) {
      dispatch(setTemplateSaved(true));
      if (result.templateId) {
        dispatch(setTemplateMeta({ templateId: result.templateId }));
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
  }, [dispatch, templateForExport, variants, toast]);

  const handleSaveVariants = useCallback(async () => {
    if (!templateSaved && !templateMeta.templateId) {
      toast({
        title: "Save template first",
        description: "Please save the template before saving variants",
        variant: "destructive",
      });
      return;
    }

    dispatch(setSaving(true));
    const result = await saveVariants(templateMeta.templateId, variants);
    dispatch(setSaving(false));

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
  }, [dispatch, templateSaved, templateMeta.templateId, variants, toast]);

  const handleImport = useCallback((data: { template: any; variants: any[] }) => {
    dispatch(setTemplate({ ...data.template, variants: data.variants || [] }));
    dispatch(setSelectedCell(null));
    dispatch(setTemplateSaved(false));
    toast({
      title: "Template imported",
      description: "Template loaded successfully",
    });
  }, [dispatch, toast]);

  const handleGenerateTestData = useCallback((rowCount: number) => {
    const testData = generateBulkTestData(rowCount);
    dispatch(setTemplate(testData));
    dispatch(setSelectedCell(null));
    dispatch(setTemplateSaved(false));
    toast({
      title: "Test data generated",
      description: `Successfully generated ${rowCount} rows for performance testing`,
    });
  }, [dispatch, toast]);

  return (
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
          onGenerateTestData={handleGenerateTestData}
          reportName={reportMeta.reportName}
          saving={saving}
          templateSaved={templateSaved}
          variantsCount={variants.length}
        />

        <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <LeftPanel />
          <ReportCanvas />
          <RightPanel />
        </Box>
      </Box>

      <ImportTemplateDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImport={handleImport}
      />
    </ThemeProvider>
  );
};

export default Index;
