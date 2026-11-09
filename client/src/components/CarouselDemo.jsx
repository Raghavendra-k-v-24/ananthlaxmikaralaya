"use client";
import Image1 from "../assets/1.jpeg";
import Image2 from "../assets/2.jpeg";
import Image3 from "../assets/3.jpeg";
import Image4 from "../assets/4.jpeg";
import Image5 from "../assets/5.jpeg";
import Image6 from "../assets/6.jpeg";
import Image7 from "../assets/7.jpeg";
import Image8 from "../assets/8.jpeg";
import Image9 from "../assets/9.jpeg";
import Image10 from "../assets/10.jpeg";
import Image11 from "../assets/11.jpeg";
import Image13 from "../assets/13.jpeg";
import Image14 from "../assets/14.jpeg";
import Image15 from "../assets/15.jpeg";
import Image16 from "../assets/16.jpeg";
import Image17 from "../assets/17.jpeg";
import Image18 from "../assets/18.jpeg";
import Image19 from "../assets/19.jpeg";
import Image20 from "../assets/20.jpeg";
import Image21 from "../assets/21.jpeg";
import Image22 from "../assets/22.jpeg";
import Image23 from "../assets/23.jpeg";
import Image24 from "../assets/24.jpeg";
import Image25 from "../assets/25.jpeg";

import Carousel from "./ui/carousel";
import { ParallaxScroll } from "./Parallex";
export function CarouselDemo() {
  const slideData = [
    {
      title: "Elevation",
      src: Image3,
    },
    {
      title: "Main Hall",
      src: Image6,
    },
    {
      title: "Stage",
      src: Image10,
    },
    {
      title: "Second Hall",
      src: Image15,
    },
  ];
  return (
    <div className="w-full h-full pb-20 bg-[url('./assets/galleryBackground.png')] bg-cover">
      <div className="w-full h-max flex items-center justify-center py-10">
        <span className="text-3xl bg-amber-800 text-[#fff6e5] font-semibold px-5 py-2 rounded-md">
          Gallery
        </span>
      </div>
      <Carousel slides={slideData} />
      <ParallaxScroll />
    </div>
  );
}
