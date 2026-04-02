import React from 'react';
import RegionalFormPage from './RegionalFormPage';

const NewApplicationIndiaPage: React.FC = () => (
  <RegionalFormPage
    formSlug="hi-application-india-v2"
    regionName="India"
    regionFlag={'\u{1F1EE}\u{1F1F3}'}
    accentColor="text-orange-600 dark:text-orange-400"
  />
);

export default NewApplicationIndiaPage;
