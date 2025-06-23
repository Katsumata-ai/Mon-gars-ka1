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
    question: "Comment fonctionne Mangaka AI ?",
    answer:
      "Mangaka AI utilise l'intelligence artificielle avancée pour vous aider à créer des mangas professionnels. Vous pouvez générer des personnages, des décors, des scènes et assembler vos pages facilement grâce à notre interface intuitive.",
  },
  {
    question: "Puis-je utiliser Mangaka AI gratuitement ?",
    answer:
      "Oui ! Notre plan Junior vous permet de créer des mangas avec des fonctionnalités de base. Pour accéder à toutes les fonctionnalités avancées comme la génération illimitée, optez pour notre plan Mangaka Senior.",
  },
  {
    question: "Quelle est votre politique de remboursement ?",
    answer:
      "Nous offrons un remboursement complet dans les 7 jours suivant l'achat de votre abonnement Mangaka Senior. Si vous n'êtes pas satisfait, contactez notre support pour un remboursement sans questions.",
  },
  {
    question: "Puis-je exporter mes créations ?",
    answer:
      "Absolument ! Vous pouvez exporter vos mangas en haute résolution dans différents formats (PNG, PDF, etc.) et les utiliser comme bon vous semble, que ce soit pour l'impression ou la publication en ligne.",
  },
];

export const Faq5 = ({
  badge = "FAQ",
  heading = "Questions Fréquentes",
  description = "Trouvez toutes les réponses essentielles sur Mangaka AI et comment notre plateforme peut servir vos besoins créatifs.",
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
