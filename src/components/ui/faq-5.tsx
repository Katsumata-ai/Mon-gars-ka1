import { Badge } from "@/components/ui/badge";

export interface FaqItem {
  question: string;
  answer: string;
}

export interface Faq5Props {
  badge?: string;
  heading?: string;
  description?: string;
  faqs?: FaqItem[];
}

const defaultFaqs: FaqItem[] = [
  {
    question: "How does Mangaka AI work?",
    answer:
      "Mangaka AI uses advanced artificial intelligence to help you create professional manga. You can generate characters, backgrounds, scenes and easily assemble your pages thanks to our intuitive interface.",
  },
  {
    question: "Can I use Mangaka AI for free?",
    answer:
      "Yes! Our Junior plan allows you to create manga with basic features. To access all advanced features like unlimited generation, choose our Mangaka Senior plan.",
  },
  {
    question: "What is your refund policy?",
    answer:
      "We offer a full refund within 7 days of purchasing your Mangaka Senior subscription. If you're not satisfied, contact our support for a no-questions-asked refund.",
  },
  {
    question: "Can I export my creations?",
    answer:
      "Absolutely! You can export your manga in high resolution in different formats (PNG, PDF, etc.) and use them as you wish, whether for printing or online publication.",
  },
];

export const Faq5 = ({
  badge = "FAQ",
  heading = "Frequently Asked Questions",
  description = "Find all the essential answers about Mangaka AI and how our platform can serve your creative needs.",
  faqs = defaultFaqs,
}: Faq5Props) => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <Badge className="text-xs font-medium mb-4 bg-primary-500 text-white">{badge}</Badge>
          <h2 className="text-4xl font-bold text-white font-comic mb-6">{heading}</h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            {description}
          </p>
        </div>
        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <div key={index} className="mb-8 flex gap-4 bg-slate-800/50 p-6 rounded-lg border border-slate-700">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-500 font-mono text-sm text-white font-bold">
                {index + 1}
              </span>
              <div className="flex-1">
                <div className="mb-3">
                  <h3 className="font-bold text-white text-lg">{faq.question}</h3>
                </div>
                <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
