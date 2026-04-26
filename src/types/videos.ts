export type VideoProfile = {
  name: string;
  url: string;
};

export type VideoSummary = {
  url: string;
  videoId: string;
  title: string;
  duration: string;
  durationSeconds: number;
  thumbnailUrl: string;
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

export type DetailsManyOptions = {
  concurrency?: number;
  retries?: number;
  retryDelayMs?: number;
  minDelayMs?: number;
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

export type VideoDetailsBatchSuccess = {
  input: DetailsInput;
  ok: true;
  value: VideoDetailsResult;
};

export type VideoDetailsBatchFailure = {
  input: DetailsInput;
  ok: false;
  error: Error;
};

export type VideoDetailsBatchItem =
  | VideoDetailsBatchSuccess
  | VideoDetailsBatchFailure;

export type VideoDetailsBatchResult = {
  items: VideoDetailsBatchItem[];
  successes: VideoDetailsResult[];
  failures: VideoDetailsBatchFailure[];
};

export type SearchOptions = {
  page?: number;
  k?: string;
  sort?: string;
  durf?: string;
  datef?: string;
  quality?: string;
};
