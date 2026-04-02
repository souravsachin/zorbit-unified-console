import React from 'react';
import RegionalFormPage from './RegionalFormPage';

const NewApplicationUAEPage: React.FC = () => (
  <RegionalFormPage
    formSlug="hi-application-uae-v2"
    regionName="UAE"
    regionFlag={'\u{1F1E6}\u{1F1EA}'}
    accentColor="text-emerald-600 dark:text-emerald-400"
  />
);

export default NewApplicationUAEPage;
