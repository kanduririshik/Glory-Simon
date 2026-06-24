import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types/entities';

export function useTeamMembers() {
  return useQuery<User[]>({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw new Error(error.message);
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        full_name: row.full_name,
        email: row.email,
        role: row.role,
        created_date: row.created_at,
      }));
    },
    staleTime: 5 * 60_000,
  });
}

export function useTeamMap(): Map<string, User> {
  const { data: members = [] } = useTeamMembers();
  return new Map(members.map(m => [m.id, m]));
}

export function getMemberName(map: Map<string, User>, id?: string): string {
  if (!id) return 'Unassigned';
  return map.get(id)?.full_name || 'Unknown';
}
