import { API_CONFIG } from '../config';
import api from './api';

export interface Customer {
  id: string;
  displayName: string;
  emailToken: string;
  phoneToken: string;
  organizationId: string;
  status: string;
  createdAt: string;
}

export interface CreateCustomerPayload {
  email: string;
  phone: string;
  displayName: string;
}

export const customerService = {
  getCustomers: (orgId: string, params?: Record<string, unknown>) =>
    api.get<Customer[]>(`${API_CONFIG.CUSTOMER_URL}/api/v1/O/${orgId}/customers`, { params }),

  getCustomer: (orgId: string, customerId: string) =>
    api.get<Customer>(`${API_CONFIG.CUSTOMER_URL}/api/v1/O/${orgId}/customers/${customerId}`),

  createCustomer: (orgId: string, payload: CreateCustomerPayload) =>
    api.post(`${API_CONFIG.CUSTOMER_URL}/api/v1/O/${orgId}/customers`, payload),
};
