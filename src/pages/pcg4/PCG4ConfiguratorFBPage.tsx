import React from 'react';
import RegionalFormPage from '../hi-quotation/RegionalFormPage';

/**
 * PCG4 Configuration Wizard rendered via the Form Builder engine.
 * Uses the same RegionalFormPage renderer that powers HI Quotation forms,
 * but pointed at the pcg4-configuration-fb slug.
 */
const PCG4ConfiguratorFBPage: React.FC = () => (
  <RegionalFormPage
    formSlug="pcg4-configuration-fb"
    regionName="PCG4"
    regionFlag=""
    accentColor="text-indigo-600 dark:text-indigo-400"
  />
);

export default PCG4ConfiguratorFBPage;
