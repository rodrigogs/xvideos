export type VideoProfile = {
  name: string;
  url: string;
};

export type VideoSummary = {
  url: string;
  path: string;
  title: string;
  duration: string;
  profile: VideoProfile;
  views: string;
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
  duration: string;
  image: string;
  views: string;
  videoType: string;
  videoWidth: string;
  videoHeight: string;
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
