import { request } from "@/lib/axios";

export interface ImportableRepository {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  private: boolean;
  defaultBranch: string;
  url: string;
  pushedAt: string | null;
  imported: boolean;
}

export interface ImportableRepositoryPage {
  items: ImportableRepository[];
  page: number;
  hasNextPage: boolean;
}

export const listImportableRepositories = (
  page: number,
  signal?: AbortSignal,
) =>
  request<ImportableRepositoryPage>({
    url: "/projects/repositories",
    params: { page },
    signal,
  });
