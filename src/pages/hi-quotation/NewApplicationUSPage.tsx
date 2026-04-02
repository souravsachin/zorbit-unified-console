import React from 'react';
import RegionalFormPage from './RegionalFormPage';

const NewApplicationUSPage: React.FC = () => (
  <RegionalFormPage
    formSlug="hi-application-us-v2"
    regionName="United States"
    regionFlag={'\u{1F1FA}\u{1F1F8}'}
    accentColor="text-blue-600 dark:text-blue-400"
  />
);

export default NewApplicationUSPage;
