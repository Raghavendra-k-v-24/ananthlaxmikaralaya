import { Button } from "@/components/ui/button";
import ChakraImage from "../assets/chakra.png";
const Header = () => {
  return (
    <div className="w-full h-max bg-amber-900 px-10 py-1 flex justify-between  items-center">
      <div className="w-max h-max flex items-center">
        <img src={ChakraImage} alt="Hero Image" className="w-max h-[70px]" />
        <div className="w-max h-max flex flex-col items-center">
          <span className="text-2xl font-bold text-[#fff6e5]">
            Ananth Laxmi
          </span>
          <span className="text-xs font-semibold text-[#D4AF37]">
            Mangal Karalaya
          </span>
        </div>
      </div>
      <div className="font-[Inter] flex gap-10 items-center px-10">
        <span className="text-lg text-[#fff6e5] cursor-pointer">Home</span>
        <span className="text-lg text-[#fff6e5] cursor-pointer">About Us</span>
        <span className="text-lg text-[#fff6e5] cursor-pointer">Gallery</span>
        <span className="text-lg text-[#fff6e5] cursor-pointer">
          Contact Us
        </span>
        <Button className="bg-amber-600 hover:bg-amber-600 hover:text-black cursor-pointer">
          Enquire Now
        </Button>
      </div>
    </div>
  );
};

export default Header;
