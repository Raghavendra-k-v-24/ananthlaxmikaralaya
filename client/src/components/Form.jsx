import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { ChevronDownIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const Form = () => {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState(undefined);
  return (
    <div className="w-full h-full bg-[url('C:\Users\ragha\Desktop\Projects\AnanthLaxmiKaralaya\client\src\assets\formBackground.png')] object-cover flex items-center p-15 justify-center flex-col gap-10">
      <span className="text-3xl bg-amber-800 text-[#fff6e5] font-semibold px-5 py-2 rounded-md">
        Enquiry Form
      </span>
      <Card className="w-[450px] !font-[Inter] h-max bg-white/10 backdrop-blur-md">
        <CardContent>
          <form>
            <div className="flex flex-col gap-5">
              <div className="grid gap-2">
                <Label htmlFor="email">Name</Label>
                <Input id="name" type="text" placeholder="Ananth" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Phone Number</Label>
                <Input
                  id="number"
                  type="number"
                  placeholder="9123456789"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ananth@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">From Date</Label>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      id="date"
                      className="w-full justify-between font-normal bg-transparent"
                    >
                      {date ? date.toLocaleDateString() : "Select date"}
                      <ChevronDownIcon />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto overflow-hidden p-0 font-[Inter]"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={date}
                      captionLayout="dropdown"
                      onSelect={(date) => {
                        setDate(date);
                        setOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">To Date</Label>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      id="date"
                      className="w-full justify-between font-normal bg-transparent"
                    >
                      {date ? date.toLocaleDateString() : "Select date"}
                      <ChevronDownIcon />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto overflow-hidden p-0 font-[Inter]"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={date}
                      captionLayout="dropdown"
                      onSelect={(date) => {
                        setDate(date);
                        setOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Occasion</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Marraige, Birthday etc"
                  required
                />
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button
            type="submit"
            className="w-full bg-trasparent bg-amber-700 text-lg text-[#fff6e5] font-bold py-5"
          >
            Enquire
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Form;
