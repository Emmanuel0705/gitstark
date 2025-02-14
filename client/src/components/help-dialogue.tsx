import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  BookOpen,
  Bug,
  HelpCircle,
  LifeBuoy,
  MessageCircleCode,
  ShieldQuestion,
} from "lucide-react";

export function HelpDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="px-3">
          <HelpCircle />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center">How can we help?</DialogTitle>
          <DialogDescription className="text-center">
            Choose an option based on your needs.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-6 gap-2.5 pt-2">
          <Button
            className="col-span-3 w-full h-20 [&_svg]:size-6 [&_svg]:shrink-0"
            variant="outline"
          >
            <span className="text-muted-foreground flex flex-col justify-center items-center font-semibold ">
              <BookOpen className="size-6 flex-shrink-0" />
              Learn more
            </span>
          </Button>
          <Button
            className="col-span-3 w-full h-20 [&_svg]:size-6 [&_svg]:shrink-0"
            variant="outline"
          >
            <span className="text-muted-foreground flex flex-col justify-center items-center font-semibold ">
              <LifeBuoy className="size-6 flex-shrink-0" />
              Support
            </span>
          </Button>
          <Button
            className="col-span-2 w-full h-20 [&_svg]:size-6 [&_svg]:shrink-0"
            variant="outline"
          >
            <span className="text-muted-foreground flex flex-col justify-center items-center font-semibold ">
              <Bug className="size-6 flex-shrink-0" />
              Report bug
            </span>
          </Button>
          <Button
            className="col-span-2 w-full h-20 [&_svg]:size-6 [&_svg]:shrink-0"
            variant="outline"
          >
            <span className="text-muted-foreground flex flex-col justify-center items-center font-semibold ">
              <MessageCircleCode className="size-6 flex-shrink-0" />
              Feature request
            </span>
          </Button>
          <Button
            className="col-span-2 w-full h-20 [&_svg]:size-6 [&_svg]:shrink-0"
            variant="outline"
          >
            <span className="text-muted-foreground flex flex-col justify-center items-center font-semibold ">
              <ShieldQuestion className="size-6 flex-shrink-0" />
              FAQ
            </span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
