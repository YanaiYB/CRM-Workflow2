-- Create enum for document types
CREATE TYPE public.morning_doc_type AS ENUM (
  'invoice',
  'receipt',
  'invoice_receipt',
  'tax_invoice_receipt',
  'proforma',
  'credit_invoice'
);

-- Create client_documents table
CREATE TABLE public.client_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  brand public.brand NOT NULL,
  morning_doc_id TEXT NOT NULL,
  doc_number TEXT,
  doc_type public.morning_doc_type NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'ILS',
  pdf_url TEXT,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  client_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for fast lookup
CREATE INDEX idx_client_documents_client_id ON public.client_documents(client_id);
CREATE INDEX idx_client_documents_event_id ON public.client_documents(event_id);
CREATE INDEX idx_client_documents_brand ON public.client_documents(brand);

-- Enable RLS
ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated users have full access (matching project pattern)
CREATE POLICY "auth all client_documents"
ON public.client_documents
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);