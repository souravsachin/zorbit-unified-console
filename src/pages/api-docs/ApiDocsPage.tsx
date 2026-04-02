import React from 'react';
import { ExternalLink } from 'lucide-react';

interface ServiceDoc {
  name: string;
  description: string;
  proxyPath: string;
  swaggerPath: string;
}

const services: ServiceDoc[] = [
  { name: 'Identity Service', description: 'Authentication, users, organizations, JWT tokens', proxyPath: '/api/identity', swaggerPath: '/api-docs' },
  { name: 'Authorization Service', description: 'Roles, privileges, access control policies', proxyPath: '/api/authorization', swaggerPath: '/api-docs' },
  { name: 'Navigation Service', description: 'Dynamic menu management, route registration', proxyPath: '/api/navigation', swaggerPath: '/api-docs' },
  { name: 'Event Bus', description: 'Kafka topics, dead letter queue, event routing', proxyPath: '/api/messaging', swaggerPath: '/api-docs' },
  { name: 'PII Vault', description: 'Tokenization of sensitive PII data', proxyPath: '/api/pii-vault', swaggerPath: '/api-docs' },
  { name: 'Audit Service', description: 'Event audit logging and compliance', proxyPath: '/api/audit', swaggerPath: '/api-docs' },
  { name: 'Customer Service', description: 'Sample business service for customer management', proxyPath: '/api/customer', swaggerPath: '/api-docs' },
  { name: 'PCG4 - Product Configurator', description: 'Product definition, variants, encounter types', proxyPath: '/api/app/pcg4', swaggerPath: '/api-docs' },
];

function getSwaggerUrl(svc: ServiceDoc): string {
  // Use the nginx proxy path + swagger path for production access
  const base = window.location.origin;
  return `${base}${svc.proxyPath}${svc.swaggerPath}`;
}

const ApiDocsPage: React.FC = () => {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">API Documentation</h1>
      <p className="text-gray-500">Links to Swagger UI for each Zorbit platform service.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((svc) => (
          <div key={svc.name} className="card p-6 hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-lg mb-2">{svc.name}</h3>
            <p className="text-sm text-gray-500 mb-4">{svc.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-mono">{svc.proxyPath}</span>
              <a
                href={getSwaggerUrl(svc)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                <span>Open Swagger</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApiDocsPage;
