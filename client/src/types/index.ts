export interface IAttachment {
  url: string;
  contentType: string;
  title: string;
}

export type Repo = {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
};

export type ProcessedRepo = {
  visibility: boolean;
  label: string;
  value: string;
};
