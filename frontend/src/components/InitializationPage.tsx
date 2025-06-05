import React, { useState, useEffect } from 'react';
import {
  Button,
  Card,
  Stepper,
  Step,
  StepLabel,
  TextField,
  CircularProgress,
  Select,
  MenuItem,
  Snackbar,
  Alert
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { getMessage } from './Sidebar/lang';
import '../styles/custom_antd.css';
import '../styles/initialization.css';

interface InitializationPageProps {
  onInitializationComplete: () => void;
}

const languageOptions = [
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' }
];

const InitializationPage: React.FC<InitializationPageProps> = ({ onInitializationComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isInitializing, setIsInitializing] = useState(false);
  const [projectType, setProjectType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'zh'>('zh');
  const [snackbar, setSnackbar] = useState<{open: boolean; message: string; severity: 'success' | 'error'}>({open: false, message: '', severity: 'success'});

  // Fetch project type on step 2
  useEffect(() => {
    if (currentStep === 1) {
      fetchProjectType();
    }
  }, [currentStep]);

  // Optionally: load last selected language from localStorage or API
  useEffect(() => {
    // Try to use localStorage or system/browser language
    const lang = localStorage.getItem('auto-coder-language') as 'en' | 'zh' | null;
    if (lang === 'en' || lang === 'zh') {
      setCurrentLanguage(lang);
    } else {
      // fallback: try navigator.language
      if (navigator.language.startsWith('zh')) {
        setCurrentLanguage('zh');
      } else {
        setCurrentLanguage('en');
      }
    }
  }, []);

  // Persist language selection
  const handleLanguageChange = (value: 'en' | 'zh') => {
    setCurrentLanguage(value);
    localStorage.setItem('auto-coder-language', value);
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const fetchProjectType = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/guess/project_type');
      const data = await response.json();
      setProjectType(data.project_type || '');
    } catch (error) {
      console.error('Error fetching project type:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeProject = async () => {
    setIsInitializing(true);
    try {
      const response = await fetch('/api/initialization-project', {
        method: 'POST'
      });

      if (response.ok) {
        setCurrentStep(1);
      } else {
        setSnackbar({open: true, message: getMessage('failedToInitialize', {}, currentLanguage) || 'Failed to initialize project', severity: 'error'});
      }
    } catch (error) {
      console.error('Error initializing project:', error);
      setSnackbar({open: true, message: getMessage('failedToInitialize', {}, currentLanguage) || 'Failed to initialize project', severity: 'error'});
    } finally {
      setIsInitializing(false);
    }
  };

  const configureProjectType = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/congigure/project_type?project_type=${encodeURIComponent(projectType)}`, {
        method: 'PUT'
      });
      
      if (response.ok) {
        setSnackbar({open: true, message: getMessage('projectConfigurationComplete', {}, currentLanguage) || 'Project configuration complete', severity: 'success'});
        onInitializationComplete();
      } else {
        setSnackbar({open: true, message: getMessage('failedToConfigureProjectType', {}, currentLanguage) || 'Failed to configure project type', severity: 'error'});
      }
    } catch (error) {
      console.error('Error configuring project type:', error);
      setSnackbar({open: true, message: getMessage('failedToConfigureProjectType', {}, currentLanguage) || 'Failed to configure project type', severity: 'error'});
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    {
      title: getMessage('initializeProject', {}, currentLanguage) || 'Initialize Project',
      content: (
        <div className="text-center p-6">
          <h2 className="initialization-title">{getMessage('projectNeedsInitialization', {}, currentLanguage) || 'This project needs to be initialized'}</h2>
          <p className="initialization-description">{getMessage('initializationExplanation', {}, currentLanguage) || 'Initialize the project to set up necessary files and configurations'}</p>
          <Button
            variant="contained"
            size="large"
            onClick={initializeProject}
            disabled={isInitializing}
          >
            {isInitializing && <CircularProgress size={20} sx={{ mr: 1 }} />} {getMessage('initializeNow', {}, currentLanguage) || 'Initialize Now'}
          </Button>
        </div>
      ),
    },
    {
      title: getMessage('configureProjectType', {}, currentLanguage) || 'Configure Project Type',
      content: (
        <div className="text-center p-6">
          <h2 className="initialization-title">{getMessage('configureProjectTypeTitle', {}, currentLanguage) || 'Configure Project Type'}</h2>
          <p className="initialization-description">
            {getMessage('projectTypeExplanation', {}, currentLanguage) || 'Project type defines file extensions AI should focus on'}
          </p>

          {isLoading ? (
            <CircularProgress />
          ) : (
            <>
              <TextField
                className="mb-4 max-w-md mx-auto"
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                placeholder={getMessage('projectTypePlaceholder', {}, currentLanguage) || 'e.g. js,ts,jsx,tsx'}
                size="small"
                variant="outlined"
                sx={{ input: { color: 'white' } }}
              />
              <Button
                variant="contained"
                size="large"
                onClick={configureProjectType}
                disabled={isLoading}
              >
                {getMessage('saveConfiguration', {}, currentLanguage) || 'Save Configuration'}
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="initialization-page flex items-center justify-center p-4">
      <Card className="initialization-card" variant="outlined">
        {/* Language Switcher */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <Select
            value={currentLanguage}
            onChange={(e: SelectChangeEvent<'en' | 'zh'>) => handleLanguageChange(e.target.value as 'en' | 'zh')}
            size="small"
            sx={{ width: 120, color: 'white' }}
          >
            {languageOptions.map(option => (
              <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
            ))}
          </Select>
        </div>
        <Stepper activeStep={currentStep} alternativeLabel sx={{ mb: 2 }}>
          {steps.map((item, index) => (
            <Step key={index}>
              <StepLabel>{item.title}</StepLabel>
            </Step>
          ))}
        </Stepper>
        <div className="p-4 rounded">
          {steps[currentStep].content}
        </div>
      </Card>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default InitializationPage; 
