import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useCredits() {
  const { data, error, isLoading } = useSWR('/api/credits', fetcher);

  return {
    credits: data?.credits,
    isLoading,
    isError: error,
  };
} 