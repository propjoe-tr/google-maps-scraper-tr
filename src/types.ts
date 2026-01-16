export interface BusinessResultFast {
  name: string;
  rating: number | null;
  reviewCount: number | null;
  phone: string | null;
  category: string | null;
  mapsUrl: string | null;
}

export interface BusinessResultDetailed {
  name: string;
  rating: number | null;
  reviewCount: number | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  category: string | null;
  mapsUrl: string | null;
}

export type BusinessResult = BusinessResultFast | BusinessResultDetailed;

export interface SearchResultFast {
  query: string;
  timestamp: string;
  total: number;
  results: BusinessResultFast[];
}

export interface SearchResultDetailed {
  query: string;
  timestamp: string;
  total: number;
  results: BusinessResultDetailed[];
}
