import type {
  Booking,
  BookingFilters,
  BookingInput,
  BookingStatus,
  ClinicSettings,
  Doctor,
  HHmm,
  ISODate,
  Journey,
  JourneyInput,
  JourneyStep,
  PriceModel,
  Treatment,
  TreatmentInput,
} from "./types";

/**
 * The single contract every storage backend implements.
 *
 * Prototype: `localSource` (browser localStorage).
 * Phase 2:   `supabaseSource` (Postgres + RLS) implementing the same methods.
 * The UI only ever talks to `lib/data/index.ts`, which delegates here.
 */
export interface DataSource {
  // Treatments
  getTreatments(opts?: { includeInactive?: boolean }): Promise<Treatment[]>;
  getTreatmentBySlug(slug: string): Promise<Treatment | null>;
  saveTreatment(input: TreatmentInput): Promise<Treatment>;
  deleteTreatment(id: string): Promise<void>;
  updatePrice(treatmentId: string, price: PriceModel): Promise<Treatment>;

  // Doctors
  getDoctors(): Promise<Doctor[]>;

  // Settings
  getSettings(): Promise<ClinicSettings>;
  updateSettings(patch: Partial<ClinicSettings>): Promise<ClinicSettings>;

  // Bookings
  getBookings(filters?: BookingFilters): Promise<Booking[]>;
  createBooking(input: BookingInput): Promise<Booking>;
  setBookingStatus(id: string, status: Exclude<BookingStatus, "pending">, note?: string): Promise<Booking>;
  rescheduleBooking(id: string, date: ISODate, time: HHmm): Promise<{ booking: Booking; previous: { date: ISODate; time: HHmm } }>;

  // Journeys
  getJourneys(): Promise<Journey[]>;
  createJourney(input: JourneyInput): Promise<Journey>;
  updateJourneyStep(journeyId: string, stepId: string, patch: Partial<JourneyStep>): Promise<Journey>;
  deleteJourney(id: string): Promise<void>;

  // Demo
  resetDemoData(): Promise<void>;
}

export class DataError extends Error {
  constructor(
    public code: "SLOT_UNAVAILABLE" | "NOT_FOUND" | "VALIDATION" | "DAY_CLOSED" | "INVALID_TRANSITION",
    message: string,
  ) {
    super(message);
    this.name = "DataError";
  }
}
