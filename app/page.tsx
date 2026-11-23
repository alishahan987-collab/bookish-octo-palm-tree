import { BeforeAfter, FeaturedTreatments, LocationContact, SpecialOffers } from "@/components/home/DataSections";
import {
  BookCTA,
  ExploreProcedures,
  FAQSection,
  Hero,
  Introduction,
  MeetTheDoctor,
  Reviews,
  Technology,
  WhyChoose,
} from "@/components/home/StaticSections";
import { getTreatments } from "@/lib/data";

export default async function HomePage() {
  // Server render from the seed catalogue; the browser then reads the live (localStorage) copy.
  const treatments = await getTreatments();
  return (
    <>
      <Hero />
      <Introduction />
      <MeetTheDoctor />
      <FeaturedTreatments initial={treatments} />
      <ExploreProcedures />
      <WhyChoose />
      <Technology />
      <BeforeAfter />
      <Reviews />
      <SpecialOffers initial={treatments} />
      <BookCTA />
      <FAQSection />
      <LocationContact />
    </>
  );
}
