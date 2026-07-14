import { Metadata } from "next";
import { ShortlinksPage } from "@/features/ShortlinksPage";

export const metadata: Metadata = {
  title: "Shortlinks | Job Tracker",
  description: "Manage your shortened URLs",
};

export default function Page() {
  return <ShortlinksPage />;
}
