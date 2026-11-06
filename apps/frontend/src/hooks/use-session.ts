import { useQuery } from "@tanstack/react-query";
import { sessionQueryOptions } from "@/lib/session";

export const useSession = () => useQuery(sessionQueryOptions);
