import HeroImage from "../assets/hero.jpeg";
import DiyaImage from "../assets/diya.png";
import { Button } from "@/components/ui/button";
import { Sparkles } from "./Sparkels";
const Hero = () => {
  return (
    <div className="w-full h-full relative bg-slate-950">
      <img
        src={DiyaImage}
        alt="Hero Image"
        className="w-[150px] h-[calc(100vh-80px)] object-cover absolute left-5 top-0 origin-top animate-swing"
      />
      <img
        src={HeroImage}
        alt="Hero Image"
        className="w-full h-[calc(100vh-80px)] object-contain rounded-b-2xl 
        [mask-image:radial-gradient(ellipse_40%_80%_at_center,black_50%,transparent_100%)]"
      />
      <span className="absolute bottom-50 left-1/2 -translate-x-1/2 text-2xl p-5 font-bold text-[#fff6e5]">
        The Perfect venue for your Divine Celebrations
      </span>
      <Button className="bg-amber-500 absolute bottom-42 left-1/2 -translate-x-1/2 text-xl p-5 font-[Inter] text-[#fff6e5] hover:bg-amber-600 hover:text-black cursor-pointer">
        Enquire Now
      </Button>
      <Sparkles />
      <img
        src={DiyaImage}
        alt="Hero Image"
        className="w-[150px] h-[calc(100vh-80px)] object-cover absolute right-5 top-0 origin-top animate-swing"
      />
    </div>
  );
};

export default Hero;
