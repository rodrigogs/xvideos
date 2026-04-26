export type VideoProfile = {
  name: string;
  url: string;
};

export type VideoSummary = {
  url: string;
  videoId: string;
  title: string;
  duration: string;
  profile: VideoProfile;
  watchCount: number;
};

export type Pagination = {
  page: number;
  pages: number[];
};

export type VideoListResult = {
  videos: VideoSummary[];
  pagination: Pagination;
  refresh: () => Promise<VideoListResult>;
  hasNext: () => boolean;
  next: () => Promise<VideoListResult>;
  hasPrevious: () => boolean;
  previous: () => Promise<VideoListResult>;
};

export type DetailsInput = {
  url: string;
};

export type VideoFiles = {
  low: string;
  high: string;
  HLS: string;
  thumb: string;
  thumb69: string;
  thumbSlide: string;
  thumbSlideBig: string;
};

export type VideoDetailsResult = {
  title: string;
  url: string;
  videoId: string;
  duration: string;
  durationSeconds: number;
  thumbnailUrls: string[];
  watchCount: number;
  voteCount: number;
  ratingPercent: number;
  videoType: string;
  videoWidth: string;
  videoHeight: string;
  uploadDate: string;
  description: string;
  contentUrl: string;
  tags: string[];
  categories: string[];
  files: VideoFiles;
};

export type SearchOptions = {
  page?: number;
  k?: string;
  sort?: string;
  durf?: string;
  datef?: string;
  quality?: string;
};
