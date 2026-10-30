export async function requestWithTokenRefresh<T>(
  request: (accessToken: string) => Promise<T>,
  accessToken: string,
  refresh: () => Promise<string | null>,
): Promise<T | null> {
  try {
    return await request(accessToken);
  } catch (error: any) {
    if (error.response?.status !== 401) throw error;
    const refreshedToken = await refresh();
    if (!refreshedToken) return null;
    return request(refreshedToken);
  }
}
