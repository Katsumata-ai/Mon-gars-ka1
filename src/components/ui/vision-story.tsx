import { Heart, Sparkles, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

function VisionStory() {
  return (
    <div className="w-full py-8 sm:py-16 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid border border-slate-700/50 rounded-2xl container p-6 lg:p-8 grid-cols-1 gap-8 items-center lg:grid-cols-2 bg-slate-800/30 backdrop-blur-sm">
          <div className="flex gap-6 flex-col">
            <div className="flex gap-4 flex-col">
              <div>
                <Badge variant="outline" className="border-primary-500/50 text-primary-500 bg-primary-500/10">
                  Our Vision
                </Badge>
              </div>
              <div className="flex gap-3 flex-col">
                <h2 className="text-3xl lg:text-4xl tracking-tight max-w-xl text-left font-comic font-bold text-white">
                  Your imagination deserves to be seen
                </h2>
                <p className="text-base lg:text-lg leading-relaxed tracking-tight text-gray-300 max-w-xl text-left">
                  For decades, creating manga was reserved for an elite.
                  We're changing that. Today, every story matters.
                </p>
              </div>
            </div>
            <div className="grid lg:pl-4 grid-cols-1 gap-6">
              <div className="flex flex-row gap-4 items-start">
                <Heart className="w-5 h-5 mt-1 text-primary-500 flex-shrink-0" />
                <div className="flex flex-col gap-1">
                  <p className="text-white font-semibold text-base">Unleash your creativity</p>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Transform your stories into epic manga without technical barriers.
                  </p>
                </div>
              </div>
              <div className="flex flex-row gap-4 items-start">
                <Sparkles className="w-5 h-5 mt-1 text-primary-500 flex-shrink-0" />
                <div className="flex flex-col gap-1">
                  <p className="text-white font-semibold text-base">Art for everyone</p>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Our AI understands your ideas and transforms them into authentic manga art.
                  </p>
                </div>
              </div>
              <div className="flex flex-row gap-4 items-start">
                <Users className="w-5 h-5 mt-1 text-primary-500 flex-shrink-0" />
                <div className="flex flex-col gap-1">
                  <p className="text-white font-semibold text-base">Join the revolution</p>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Over 1200 creators already trust us. Why not you?
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="relative w-full h-80 lg:h-96 rounded-xl overflow-hidden shadow-2xl">
              <Image
                src="/vision-interface.png"
                alt="Manga creation interface with Mangaka AI"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { VisionStory };
