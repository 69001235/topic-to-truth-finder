ALTER TABLE public.respostas ADD COLUMN ref text NOT NULL DEFAULT '+';
ALTER TABLE public.respostas ADD COLUMN category text NOT NULL DEFAULT 'Adicionadas pela equipa';