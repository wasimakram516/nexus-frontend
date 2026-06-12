import { usersService } from "@/services/users.service";

export interface UserLite {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  institutionId: string | null;
  createdAt: string;
}

interface PaginatedUsers {
  items: UserLite[];
  total: number;
  page: number;
  limit: number;
}

const PAGE_SIZE = 100;

/** Fetches every institution user across pages (backend caps limit at 100). */
export async function fetchAllUsers(): Promise<UserLite[]> {
  const all: UserLite[] = [];
  let page = 1;

  for (;;) {
    const res = await usersService.getAll({ page, limit: PAGE_SIZE });
    const data = res.data?.data as PaginatedUsers | undefined;
    const items = data?.items ?? [];
    all.push(...items);
    if (all.length >= (data?.total ?? 0) || items.length < PAGE_SIZE) break;
    page += 1;
  }

  return all;
}

export function buildUserMap(users: UserLite[]): Record<string, UserLite> {
  return users.reduce<Record<string, UserLite>>((acc, u) => {
    acc[u.id] = u;
    return acc;
  }, {});
}
