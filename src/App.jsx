import "@fontsource/inter";
import "@fontsource/inter/400.css";
import "@fontsource/inter/400-italic.css";
import ShankuChakra from "./assets/shanku_chakra.jpg";

const App = () => {
  return (
    <div className="w-full h-screen flex flex-col gap-5 justify-center items-center">
      <img src={ShankuChakra} alt="ShankChakra" className="w-[350px]" />
      <span className="text-3xl">🙏Coming Soon🙏</span>
    </div>
  );
};

export default App;
