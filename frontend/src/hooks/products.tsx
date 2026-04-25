import { useState, useEffect, useCallback } from "react";
import { PRODUCT_ENDPOINTS } from "../../api";
import type { Product } from "../cart";

interface Filters {
  search: string;
  status: string;
  sortBy: string;
  order: "asc" | "desc";
  page: number;
  limit: number;
}
interface MetaData {
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<MetaData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    sortBy: "created_at",
    order: "desc",
    page: 1,
    limit: 10,
  });

  const fetchItems = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const queryString = new URLSearchParams(
        Object.entries(filters).map(([key, val]) => [key, String(val)]),
      ).toString();

      const res = await fetch(`${PRODUCT_ENDPOINTS.GET_ALL}?${queryString}`);

      if (!res.ok) throw new Error("Network response was not ok");
      const result = await res.json();

      setProducts(result.data);
      setMeta(result.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const debounce = setTimeout(fetchItems, 300);
    return () => clearTimeout(debounce);
  }, [fetchItems]);

  const updateFilter = (key: keyof Filters, value: string | number) =>
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));

  return { products, meta, loading, error, filters, updateFilter, setFilters };
}
