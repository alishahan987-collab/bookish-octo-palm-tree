import type {
  Booking,
  BookingFilters,
  BookingInput,
  BookingResult,
  BookingStatus,
  ClinicSettings,
  Condition,
  ConditionInput,
  DayAvailability,
  GalleryInput,
  GalleryItem,
  HHmm,
  ISODate,
  ImageRef,
  Journey,
  JourneyInput,
  JourneyStep,
  Post,
  PostInput,
  PriceModel,
  SiteContent,
  Treatment,
  TreatmentInput,
} from "./types";

/**
 * The single contract every storage backend implements.
 *   - localSource:    browser demo mode (localStorage + IndexedDB for images)
 *   - supabaseSource: production (Postgres + RLS, Storage, Auth, server API routes)
 * UI code only ever imports `lib/data` (index.ts), never a source directly.
 */
export interface DataSource {
  readonly mode: "demo" | "supabase";

  // Site content & settings
  getContent(): Promise<SiteContent>;
  saveContent(next: SiteContent): Promise<SiteContent>;
  getSettings(): Promise<ClinicSettings>;
  updateSettings(patch: Partial<ClinicSettings>): Promise<ClinicSettings>;

  // Procedures
  getTreatments(opts?: { includeInactive?: boolean }): Promise<Treatment[]>;
  getTreatmentBySlug(slug: string): Promise<Treatment | null>;
  saveTreatment(input: TreatmentInput): Promise<Treatment>;
  deleteTreatment(id: string): Promise<void>;
  updatePrice(treatmentId: string, price: PriceModel): Promise<Treatment>;

  // Conditions
  getConditions(opts?: { includeInactive?: boolean }): Promise<Condition[]>;
  getConditionBySlug(slug: string): Promise<Condition | null>;
  saveCondition(input: ConditionInput): Promise<Condition>;
  deleteCondition(id: string): Promise<void>;

  // Blog
  getPosts(opts?: { includeDrafts?: boolean }): Promise<Post[]>;
  getPostBySlug(slug: string, opts?: { includeDrafts?: boolean }): Promise<Post | null>;
  savePost(input: PostInput): Promise<Post>;
  deletePost(id: string): Promise<void>;

  // Before & after gallery
  getGallery(opts?: { includeUnpublished?: boolean }): Promise<GalleryItem[]>;
  saveGalleryItem(input: GalleryInput): Promise<GalleryItem>;
  deleteGalleryItem(id: string): Promise<void>;

  // Media
  uploadImage(file: Blob, folder: string): Promise<ImageRef>;

  // Availability & bookings
  getAvailability(doctorId: string, opts?: { days?: number; ignoreBookingId?: string }): Promise<DayAvailability[]>;
  createBooking(input: BookingInput & { website?: string }): Promise<BookingResult>;
  getBookings(filters?: BookingFilters): Promise<Booking[]>;
  setBookingStatus(id: string, status: Exclude<BookingStatus, "pending">, note?: string): Promise<BookingResult>;
  rescheduleBooking(id: string, date: ISODate, time: HHmm): Promise<BookingResult & { previous: { date: ISODate; time: HHmm } }>;

  // Treatment journeys
  getJourneys(): Promise<Journey[]>;
  createJourney(input: JourneyInput): Promise<Journey>;
  updateJourneyStep(journeyId: string, stepId: string, patch: Partial<JourneyStep>): Promise<Journey>;
  deleteJourney(id: string): Promise<void>;

  // Demo only
  resetDemoData(): Promise<void>;
}

export type DataErrorCode =
  | "SLOT_UNAVAILABLE"
  | "NOT_FOUND"
  | "VALIDATION"
  | "DAY_CLOSED"
  | "INVALID_TRANSITION"
  | "UNAUTHORIZED"
  | "RATE_LIMITED"
  | "SERVER";

export class DataError extends Error {
  constructor(
    public code: DataErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "DataError";
  }
}
